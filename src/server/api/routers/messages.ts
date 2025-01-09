import { z } from 'zod'
import EventEmitter, { on } from 'events'
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { eq, and, or, ne, sql, asc } from 'drizzle-orm'
import * as schema from '~/server/db/schema'
import {
  UserSubscriptionManager,
  type NewChannelMessage
} from '~/server/api/utils/subscriptionManager'
import { getUserChannels, getMessagesFromChannel } from '~/server/db/utils/queries'
import { incrementMessageReplyCount } from '~/server/db/utils/insertions'

// Event emitter to bridge Postgres notifications to tRPC
const ee = new EventEmitter()

const subscriptionManager = new UserSubscriptionManager()

export const messagesRouter = createTRPCRouter({
  testS3Connection: protectedProcedure.mutation(async ({ ctx }) => {
    // await listBucketContents()
  }),
  onMessage: protectedProcedure
    .input(
      z.object({
        channelId: z.number()
      })
    )
    .subscription(async function* ({ ctx, input, signal }) {
      // AsyncIterator for the new message events
      // Subscribe the user to the channel when they start listening
      const userId = ctx.session.user.id
      subscriptionManager.subscribe(userId, input.channelId)

      try {
        // Create an observable for message events
        for await (const [data] of on(ee, 'newMessage', { signal })) {
          const newMessage = data as NewChannelMessage
          console.log(newMessage, 'onMessage')

          // Only yield messages for channels this user is subscribed to
          if (subscriptionManager.isSubscribed(userId, newMessage.channelId)) {
            yield newMessage
          }
        }
      } catch (err) {
        console.error('Error in onMessage subscription:', err)
      } finally {
        // Clean up subscription when the connection closes
        subscriptionManager.unsubscribe(userId, input.channelId)
      }
    }),
  sendMessage: protectedProcedure
    .input(z.object({ userId: z.string(), content: z.string(), channelId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const { userId, content, channelId } = input
      try {
        const newMessage = await ctx.db
          .insert(schema.messages)
          .values({
            userId,
            content,
            channelId
          })
          .returning()

        if (!newMessage?.[0]?.id) return []
        // Emit the new message event
        // The subscription above will handle filtering to only subscribed users
        const subscriptionMessage: NewChannelMessage = {
          id: newMessage?.[0]?.id,
          content: input.content,
          channelId: input.channelId,
          userId: ctx.session.user.id,
          createdAt: new Date()
        }

        ee.emit('newMessage', subscriptionMessage)
        return newMessage
      } catch (err) {
        console.error('Error creating new message:', err)
      }
    }),
  getMessagesFromChannel: protectedProcedure
    .input(
      z.object({ channelId: z.number(), chatTab: z.enum(['Messages', 'Files', 'Pins', 'Saved']) })
    )
    .query(async ({ input, ctx }) => {
      const { channelId } = input

      const results = await getMessagesFromChannel(channelId, ctx.session.user.id, input.chatTab)

      return results
    }),
  createMessageReaction: protectedProcedure
    .input(
      z.object({
        messageId: z.number(),
        emoji: z.string(),
        channelId: z.number()
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user already reacted with this emoji
      const existingReaction = await ctx.db.query.messageReactions.findFirst({
        where: and(
          eq(schema.messageReactions.messageId, input.messageId),
          eq(schema.messageReactions.emoji, input.emoji),
          eq(schema.messageReactions.userId, ctx.session.user.id)
        )
      })

      if (existingReaction) {
        return existingReaction
      }

      const newReaction = await ctx.db
        .insert(schema.messageReactions)
        .values({ messageId: input.messageId, emoji: input.emoji, userId: ctx.session.user.id })
        .returning()

      ee.emit('newMessage', {
        id: newReaction?.[0]?.messageId,
        content: '',
        channelId: input.channelId,
        userId: ctx.session.user.id
      })

      return newReaction
    }),
  createMessageReply: protectedProcedure
    .input(
      z.object({
        messageId: z.number(),
        content: z.string(),
        channelId: z.number()
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.transaction(async (tx) => {
        const newMessage = await tx
          .insert(schema.messages)
          .values({
            content: input.content,
            channelId: input.channelId,
            userId: ctx.session.user.id,
            isReply: true
          })
          .returning()

        if (!newMessage?.[0]?.id) {
          return { success: false }
        }

        await tx.insert(schema.messagesToParents).values({
          messageId: newMessage[0].id,
          parentId: input.messageId
        })
      })

      await incrementMessageReplyCount(input.messageId)

      ee.emit('newMessage', {
        id: '',
        content: '',
        channelId: input.channelId,
        userId: ctx.session.user.id
      })

      return { success: true }
    }),
  getMessageReplies: protectedProcedure
    .input(
      z.object({
        messageId: z.number()
      })
    )
    .query(async ({ ctx, input }) => {
      // await new Promise((resolve) => setTimeout(resolve, 4000))
      const mainMessage = await ctx.db.query.messages.findFirst({
        where: eq(schema.messages.id, input.messageId),
        extras: {
          isSaved: sql<boolean>`EXISTS (
                    SELECT 1 FROM ${schema.savedMessagesTable}
                    WHERE message_id = ${schema.messages.id}
                    AND user_id = ${ctx.session.user.id}
                  )`.as('isSaved')
        },
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              image: true
            }
          },
          reactions: true,
          attachments: true
        }
      })
      const replies = await ctx.db.query.messagesToParents.findMany({
        where: eq(schema.messagesToParents.parentId, input.messageId),
        with: {
          message: {
            extras: {
              isSaved: sql<boolean>`EXISTS (
                    SELECT 1 FROM ${schema.savedMessagesTable}
                    WHERE message_id = ${schema.messages.id}
                    AND user_id = ${ctx.session.user.id}
                  )`.as('isSaved')
            },
            with: {
              user: {
                columns: {
                  id: true,
                  name: true,
                  image: true
                }
              },
              reactions: true,
              attachments: true
            }
          }
        }
      })

      return { mainMessage, replies }
    }),
  pinMessage: protectedProcedure
    .input(
      z.object({
        messageId: z.number(),
        channelId: z.number()
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(schema.messages)
        .set({ isPinned: true })
        .where(eq(schema.messages.id, input.messageId))

      ee.emit('newMessage', {
        id: input.messageId,
        content: '',
        channelId: input.channelId,
        userId: ctx.session.user.id
      })
    }),
  unPinMessage: protectedProcedure
    .input(
      z.object({
        messageId: z.number(),
        channelId: z.number()
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(schema.messages)
        .set({ isPinned: false })
        .where(eq(schema.messages.id, input.messageId))

      ee.emit('newMessage', {
        id: input.messageId,
        content: '',
        channelId: input.channelId,
        userId: ctx.session.user.id
      })
    }),
  deleteMessage: protectedProcedure
    .input(
      z.object({
        messageId: z.number(),
        channelId: z.number()
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if the message exists and from the current user
      const currentMessage = await ctx.db.query.messages.findFirst({
        where: and(
          eq(schema.messages.id, input.messageId),
          eq(schema.messages.userId, ctx.session.user.id)
        )
      })

      if (!currentMessage) {
        return
      }

      await ctx.db.delete(schema.messages).where(eq(schema.messages.id, input.messageId))

      ee.emit('newMessage', {
        id: input.messageId,
        content: '',
        channelId: input.channelId,
        userId: ctx.session.user.id
      })
    }),

  saveMessage: protectedProcedure
    .input(
      z.object({
        messageId: z.number(),
        channelId: z.number()
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .insert(schema.savedMessagesTable)
        .values({ messageId: input.messageId, userId: ctx.session.user.id })

      ee.emit('newMessage', {
        id: input.messageId,
        content: '',
        channelId: input.channelId,
        userId: ctx.session.user.id
      })
    }),
  unSaveMessage: protectedProcedure
    .input(
      z.object({
        messageId: z.number(),
        channelId: z.number()
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(schema.savedMessagesTable)
        .where(eq(schema.savedMessagesTable.messageId, input.messageId))

      ee.emit('newMessage', {
        id: input.messageId,
        content: '',
        channelId: input.channelId,
        userId: ctx.session.user.id
      })
    }),
  removeMessageReaction: protectedProcedure
    .input(
      z.object({
        messageId: z.number(),
        emoji: z.string(),
        channelId: z.number()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const deletedReaction = await ctx.db
        .delete(schema.messageReactions)
        .where(
          and(
            eq(schema.messageReactions.messageId, input.messageId),
            eq(schema.messageReactions.emoji, input.emoji),
            eq(schema.messageReactions.userId, ctx.session.user.id)
          )
        )

      // if (!deletedReaction?.[0]?.) return []
      ee.emit('newMessage', {
        id: 1,
        content: '',
        channelId: input.channelId,
        userId: ctx.session.user.id
      })

      return deletedReaction
    }),
  createChannel: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string(),
        userId: z.string(),
        isPrivate: z.boolean(),
        userIds: z.array(z.string())
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { name, description, userId, isPrivate, userIds } = input

      return await ctx.db.transaction(async (tx) => {
        const [newChannel] = await tx
          .insert(schema.channels)
          .values({ name, createdById: userId, description, isPrivate })
          .returning()
        if (!newChannel) {
          throw new Error('Failed to create channel')
        }

        // Add creator as channel member and admin
        await tx.insert(schema.channelMembers).values({
          channelId: newChannel.id,
          userId: userId,
          isAdmin: true // Creator should probably be an admin
        })

        if (userIds.length) {
          // Add other users as channel members
          await tx.insert(schema.channelMembers).values(
            userIds.map((userId) => ({
              channelId: newChannel.id,
              userId: userId,
              isAdmin: false
            }))
          )
        }

        return newChannel
      })
    }),
  getOnlineUsers: protectedProcedure.query(async ({ ctx }) => {
    const onlineUsers = await ctx.db
      .selectDistinct({
        id: schema.users.id,
        name: schema.users.name,
        avatar: schema.users.image,
        channelId: schema.conversationsTable.channelId,
        createdAt: schema.conversationsTable.createdAt
      })
      .from(schema.users)
      .where(ne(schema.users.id, ctx.session.user.id))
      .leftJoin(
        schema.conversationsTable,
        or(
          and(
            eq(schema.users.id, schema.conversationsTable.user1Id),
            eq(schema.conversationsTable.user2Id, ctx.session.user.id)
          ),
          and(
            eq(schema.users.id, schema.conversationsTable.user2Id),
            eq(schema.conversationsTable.user1Id, ctx.session.user.id)
          )
        )
      )
      .orderBy(asc(schema.conversationsTable.createdAt))

    const foundUsers = new Map<string, any>()
    for (const user of onlineUsers) {
      if (foundUsers.has(user.id)) {
        console.log('duplicate user', user)
        const cachedUser = foundUsers.get(user.id)
        console.log('cached user', cachedUser)
      }
      foundUsers.set(user.id, user)
    }

    return onlineUsers
  }),
  getChannels: protectedProcedure.query(async ({ ctx }) => {
    let userChannels = await getUserChannels(ctx.db, ctx.session.user.id)
    if (!userChannels.length) {
      await ctx.db.transaction(async (tx) => {
        const [newChannel] = await tx
          .insert(schema.channels)
          .values({
            name: 'Home',
            createdById: ctx.session.user.id,
            description: '',
            isPrivate: false
          })
          .returning()
        if (!newChannel) {
          return []
        }

        // Add creator as channel member and admin
        await tx.insert(schema.channelMembers).values({
          channelId: newChannel.id,
          userId: ctx.session.user.id,
          isAdmin: true // Creator should probably be an admin
        })
      })

      userChannels = await getUserChannels(ctx.db, ctx.session.user.id)
    }

    return userChannels
  }),
  getUsers: protectedProcedure.query(async ({ ctx }) => {
    const users = await ctx.db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        avatar: schema.users.image
      })
      .from(schema.users)
      .where(ne(schema.users.id, ctx.session.user.id))

    return users
  }),
  getUsersInChannel: protectedProcedure
    .input(z.object({ channelId: z.number() }))
    .query(async ({ ctx, input }) => {
      const channelInfo = await ctx.db.query.channels
        .findFirst({
          where: eq(schema.channels.id, input.channelId)
        })
        .execute()

      if (!channelInfo) {
        return []
      }

      if (channelInfo.isPrivate) {
        const members = await ctx.db
          .select({
            image: schema.users.image,
            name: schema.users.name
          })
          .from(schema.channelMembers)
          .where(eq(schema.channelMembers.channelId, input.channelId))
          .leftJoin(schema.users, eq(schema.channelMembers.userId, schema.users.id))

        return members
      }

      // If the channel is public, return all users
      const users = await ctx.db
        .select({
          image: schema.users.image,
          name: schema.users.name
        })
        .from(schema.users)

      return users
    })
})
