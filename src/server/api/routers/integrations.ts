import { z } from 'zod'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc'
import { cosineDistance, desc, sql, eq, and, or, exists } from 'drizzle-orm'
import * as openAIUtils from '~/server/db/utils/openai'
import * as schema from '~/server/db/schema'
import { ee } from '~/server/api/routers/messages'
import { type NewChannelMessage } from '~/server/api/utils/subscriptionManager'

export const integrationsRouter = createTRPCRouter({
  predictNextMessage: protectedProcedure
    .input(z.object({ currentText: z.string(), channelId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      //

      const embedding = await openAIUtils.createMessageEmbedding(input.currentText)
      if (!embedding) return { suggestedMessage: '' }

      const similarity = sql<number>`1 - (${cosineDistance(schema.messages.contentEmbedding, embedding)})`

      // Get recent channel messages for context
      const recentMessages = await ctx.db
        .select({
          content: schema.messages.content,
          similarity,
          name: schema.users.name,
          userId: schema.users.id,
          createdAt: schema.messages.createdAt,
          id: schema.messages.id
        })
        .from(schema.messages)
        .where(
          and(eq(schema.messages.channelId, input.channelId), eq(schema.messages.isReply, false))
        )
        .orderBy(desc(schema.messages.createdAt))
        .leftJoin(schema.users, eq(schema.messages.userId, schema.users.id))
        .limit(20)

      // Get similar messages from the current user
      const similarUserMessages = await ctx.db
        .select({ content: schema.messages.content, similarity })
        .from(schema.messages)
        .where(
          and(
            eq(schema.messages.userId, ctx.session.user.id),
            eq(schema.messages.channelId, input.channelId)
          )
        )
        .orderBy((t) => desc(t.similarity))
        .limit(10)

      // Context from user's similar messages
      const userMessagesContext = similarUserMessages.map((m) => m.content).join('\n')

      // Context from recent channel messages
      const recentMessagesContext = recentMessages
        .map((m) => `from: ${m.name}, similarity: ${m.similarity} message: ${m.content}`)
        .join('\n')

      const suggestedMessage = await openAIUtils.generateSuggestedMessage(
        input.currentText,
        userMessagesContext,
        recentMessagesContext
      )

      return { suggestedMessage: suggestedMessage || '' }
    }),
  askUserProfileQuestion: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        question: z.string()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const embedding = await openAIUtils.createMessageEmbedding(input.question)
      if (!embedding) return { reply: '' }

      const userMessages = await ctx.db
        .select({
          content: schema.messages.content,
          similarity: sql<number>`1 - (${cosineDistance(schema.messages.contentEmbedding, embedding)})`
        })
        .from(schema.messages)
        .where(eq(schema.messages.userId, input.userId))
        .orderBy((t) => desc(t.similarity))
        .limit(20)

      // console.log('userMessages', userMessages)

      const userMessagesContext = userMessages.map((m) => `message: ${m.content}`).join('\n')

      const response = await openAIUtils.generateUserProfileResponse(
        userMessagesContext,
        input.question
      )

      return { response: response || '' }
    }),
  sendMessageToUserWithBot: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        content: z.string(),
        channelId: z.number(),
        toUserId: z.string()
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { userId, content, channelId, toUserId } = input
      try {
        const [newMessage] = await ctx.db
          .insert(schema.messages)
          .values({
            userId,
            content,
            channelId
          })
          .returning({
            id: schema.messages.id
          })

        if (!newMessage?.id) return { id: 0 }

        const subscriptionMessage: NewChannelMessage = {
          id: newMessage?.id,
          channelId: input.channelId,
          userId: ctx.session.user.id,
          type: 'NEW_MESSAGE'
        }
        ee.emit('newMessage', subscriptionMessage)

        const messageEmbedding = await openAIUtils.createMessageTextEmbedding(
          newMessage.id,
          content
        )
        if (!messageEmbedding) return { id: 0 }

        const userMessages = await ctx.db
          .select({
            content: schema.messages.content,
            similarity: sql<number>`1 - (${cosineDistance(schema.messages.contentEmbedding, messageEmbedding)})`
          })
          .from(schema.messages)
          .where(eq(schema.messages.userId, toUserId))
          .orderBy((t) => desc(t.similarity))
          .limit(20)

        const toUserMessagesContext = userMessages.map((m) => `message: ${m.content}`).join('\n')

        const chatBotResponse = await openAIUtils.generateUserProfileResponse(
          toUserMessagesContext,
          content
        )

        if (!chatBotResponse) return { id: 0 }

        const [newChatbotMessage] = await ctx.db
          .insert(schema.messages)
          .values({
            userId: toUserId,
            content: chatBotResponse.response,
            channelId,
            fromBot: true
          })
          .returning({
            id: schema.messages.id
          })

        if (!newChatbotMessage?.id) return { id: 0 }

        // Create embedding for the new message, don't await in this scope
        void openAIUtils.createMessageTextEmbedding(newChatbotMessage.id, chatBotResponse.response)

        // Emit the new message event
        // The subscription above will handle filtering to only subscribed users
        subscriptionMessage.userId = toUserId
        ee.emit('newMessage', subscriptionMessage)

        // update the message with the emoji response
        const [newMessageEmoji] = await ctx.db
          .insert(schema.messageReactions)
          .values({
            messageId: newMessage.id,
            userId: toUserId,
            emoji: chatBotResponse.emojiResponse
          })
          .returning({
            messageId: schema.messageReactions.messageId
          })

        if (!newMessageEmoji?.messageId) return { id: 0 }

        // new emit
        subscriptionMessage.userId = toUserId
        subscriptionMessage.type = 'NEW_REACTION'
        ee.emit('newMessage', subscriptionMessage)

        return newMessage
      } catch (err) {
        console.error('Error creating new message:', err)
      }
    }),
  summarizeMessagesInChannel: protectedProcedure
    .input(
      z.object({
        channelId: z.number(),
        userQuery: z.string()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const queryEmbedding = await openAIUtils.generateEmbeddingFromText(input.userQuery, 1536)

      if (!queryEmbedding) return { summary: '' }

      // Find relevant messages in the channel
      const relevantMessages = await ctx.db
        .select({
          content: schema.messages.content,
          similarity: sql<number>`1 - (${cosineDistance(
            schema.messages.contentEmbedding,
            queryEmbedding
          )})`,
          name: schema.users.name
        })
        .from(schema.messages)
        .leftJoin(schema.users, eq(schema.messages.userId, schema.users.id))
        .where(eq(schema.messages.channelId, input.channelId))
        .orderBy((t) => desc(t.similarity))
        .limit(20)

      // console.log('relevantMessages', relevantMessages)

      if (!relevantMessages.length) return { summary: '' }

      // Summarize the messages
      const summarizedText = await openAIUtils.summarizeText(
        relevantMessages
          .map((m) => {
            return `${m.name}: ${m.content}`
          })
          .join('\n'),
        input.userQuery
      )

      return { summary: summarizedText || '' }
    }),
  getUserAgentDetails: protectedProcedure
    .input(
      z.object({
        toUserId: z.string()
      })
    )
    .query(async ({ ctx, input }) => {
      // check db for agent (not implemented yet)

      const [userInfo] = await ctx.db
        .select({
          name: schema.users.name
        })
        .from(schema.users)
        .where(eq(schema.users.id, input.toUserId))

      const agentId = process.env.NEXT_PUBLIC_D_ID_AGENT_ID

      if (!agentId) {
        throw new Error('D-ID agent ID not found')
      }

      return {
        agentId,
        userInfo: {
          name: userInfo?.name ?? ''
        }
      }
    }),
  getUserAvatarResponse: protectedProcedure
    .input(
      z.object({
        toUserId: z.string(),
        query: z.string()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const queryEmbedding = await openAIUtils.generateEmbeddingFromText(input.query, 1536)
      if (!queryEmbedding) return { avatarResponse: '' }

      const relevantMessages = await ctx.db
        .select({
          content: schema.messages.content,
          similarity: sql<number>`1 - (${cosineDistance(
            schema.messages.contentEmbedding,
            queryEmbedding
          )})`,
          name: schema.users.name,
          // channelName: schema.channels.name,
          createdAt: schema.messages.createdAt
        })
        .from(schema.messages)
        .leftJoin(schema.users, eq(schema.messages.userId, schema.users.id))
        .leftJoin(schema.channels, eq(schema.messages.channelId, schema.channels.id))
        .where(
          and(
            // Either the channel is public
            or(
              eq(schema.channels.isPrivate, false),
              // Or the user is a member of the private channel
              exists(
                ctx.db
                  .select()
                  .from(schema.channelMembers)
                  .where(
                    and(
                      eq(schema.channelMembers.channelId, schema.messages.channelId),
                      eq(schema.channelMembers.userId, input.toUserId)
                    )
                  )
              )
            ),
            // Exclude conversation channels
            eq(schema.channels.isConversation, false)
          )
        )
        .orderBy((t) => desc(t.similarity))
        .limit(10)

      console.log('relevantMessages', relevantMessages)

      const messageContext = relevantMessages.map((m) => {
        return {
          message: m.content,
          from: m.name,
          timestamp: m.createdAt.toLocaleString('en-US', {
            weekday: 'long',
            hour: 'numeric',
            minute: '2-digit',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour12: true
          })
        }
      })
      // .join('\n\n')

      const toStr = JSON.stringify(messageContext, null, 2)

      const response = await openAIUtils.generateUserAvatarResponse(toStr, input.query)

      return { avatarResponse: response ?? '' }
    })
})
