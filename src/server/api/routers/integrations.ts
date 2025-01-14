import { z } from 'zod'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc'
import { cosineDistance, desc, gt, sql, eq, and } from 'drizzle-orm'
import * as openAIUtils from '~/server/db/utils/openai'
import * as schema from '~/server/db/schema'

export const integrationsRouter = createTRPCRouter({
  predictNextMessage: protectedProcedure
    .input(z.object({ currentText: z.string(), channelId: z.number() }))
    .mutation(async ({ input, ctx, signal }) => {
      signal?.addEventListener('abort', () => {
        console.log('Aborted')
        throw new Error('Aborted')
      })

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
        .limit(10)

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
        .limit(4)

      if (signal?.aborted) {
        return { suggestedMessage: '' }
      }

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
    })
})
