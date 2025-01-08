import { z } from 'zod'
import EventEmitter, { on } from 'events'
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { eq, and, or, ne, sql } from 'drizzle-orm'
import * as schema from '~/server/db/schema'
import {
  UserSubscriptionManager,
  type NewChannelMessage
} from '~/server/api/utils/subscriptionManager'

// Event emitter to bridge Postgres notifications to tRPC
const ee = new EventEmitter()

const subscriptionManager = new UserSubscriptionManager()

export const messagesRouter = createTRPCRouter({
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
    }),
  getMessagesFromChannel: protectedProcedure
    .input(z.object({ channelId: z.number() }))
    .query(async ({ input, ctx }) => {
      const { channelId } = input
      const messages = await ctx.db.query.messages.findMany({
        where: eq(schema.messages.channelId, channelId),
        with: {
          user: true,
          reactions: true
        }
      })
      return messages
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
      .select({
        id: schema.users.id,
        name: schema.users.name,
        avatar: schema.users.image
      })
      .from(schema.users)
      .where(ne(schema.users.id, ctx.session.user.id))

    return onlineUsers
  }),
  getChannels: protectedProcedure.query(async ({ ctx }) => {
    const userChannels = await ctx.db
      .select({
        id: schema.channels.id,
        name: schema.channels.name,
        description: schema.channels.description,
        isPrivate: schema.channels.isPrivate,
        createdAt: schema.channels.createdAt,
        // Use a left join to get isAdmin, which might be null for public channels
        isAdmin: schema.channelMembers.isAdmin
      })
      .from(schema.channels)
      .leftJoin(
        schema.channelMembers,
        and(
          eq(schema.channels.id, schema.channelMembers.channelId),
          eq(schema.channelMembers.userId, ctx.session.user.id)
        )
      )
      .where(
        or(
          // Include channel if it's public
          eq(schema.channels.isPrivate, false),
          // OR if user is a member (for private channels)
          eq(schema.channelMembers.userId, ctx.session.user.id)
        )
      )

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
