import { z } from 'zod'
import EventEmitter, { on } from 'events'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { eq, and, or, ne, sql, desc, ilike, asc } from 'drizzle-orm'
import * as schema from '~/server/db/schema'
import {
  UserSubscriptionManager,
  type NewChannelMessage
} from '~/server/api/utils/subscriptionManager'
import { getUserChannels, getMessagesFromChannel } from '~/server/db/utils/queries'
import { incrementMessageReplyCount, setMessageAttachmentCount } from '~/server/db/utils/insertions'
import { generatePresignedUrl, generateDownloadUrl } from '~/server/db/utils/s3'
import { createMessageTextEmbedding, seedChannelWithMessages } from '~/server/db/utils/openai'

// Event emitter for trpc subscriptions
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

      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to subscribe to a channel.'
        })
      }

      subscriptionManager.subscribe(userId, input.channelId)

      try {
        // Create an observable for message events
        for await (const [data] of on(ee, 'newMessage', { signal })) {
          const newMessage = data as NewChannelMessage

          // Only yield messages for channels this user is subscribed to
          if (await subscriptionManager.isSubscribed(userId, newMessage.channelId)) {
            yield newMessage
          }
        }
      } catch (err) {
        // console.error('Error in onMessage subscription:', err)
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

        // Create embedding for the new message, don't await in this scope
        void createMessageTextEmbedding(newMessage.id, content)
        // Emit the new message event
        // The subscription above will handle filtering to only subscribed users
        const subscriptionMessage: NewChannelMessage = {
          id: newMessage?.id,
          channelId: input.channelId,
          userId: ctx.session.user.id,
          type: 'NEW_MESSAGE'
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

      const [newReaction] = await ctx.db
        .insert(schema.messageReactions)
        .values({ messageId: input.messageId, emoji: input.emoji, userId: ctx.session.user.id })
        .returning()

      if (!newReaction?.messageId) return { messageId: 0 }

      const subscriptionMessage: NewChannelMessage = {
        id: newReaction?.messageId,
        channelId: input.channelId,
        userId: ctx.session.user.id,
        type: 'NEW_REACTION'
      }

      ee.emit('newMessage', subscriptionMessage)

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
      try {
        let newMessageId: number = 0
        const [newMessage] = await ctx.db
          .insert(schema.messages)
          .values({
            content: input.content,
            channelId: input.channelId,
            userId: ctx.session.user.id,
            isReply: true
          })
          .returning()

        if (!newMessage?.id) {
          return { messageId: newMessageId }
        }

        await ctx.db
          .insert(schema.messagesToParents)
          .values({
            messageId: newMessage.id,
            parentId: input.messageId
          })
          .returning()

        newMessageId = newMessage.id

        if (!newMessageId) {
          throw new Error('Failed to create reply message')
        }

        await incrementMessageReplyCount(input.messageId)

        const subscriptionMessage: NewChannelMessage = {
          id: newMessageId,
          channelId: input.channelId,
          userId: ctx.session.user.id,
          type: 'NEW_REPLY'
        }

        ee.emit('newMessage', subscriptionMessage)

        return { messageId: newMessageId }
      } catch (err) {
        console.error('Error creating reply:', err)
      }
    }),
  getMessageReplies: protectedProcedure
    .input(
      z.object({
        parentMessageId: z.number()
      })
    )
    .query(async ({ ctx, input }) => {
      // await new Promise((resolve) => setTimeout(resolve, 4000))
      const mainMessage = await ctx.db.query.messages.findFirst({
        where: eq(schema.messages.id, input.parentMessageId),
        orderBy: asc(schema.messages.id),
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
        where: eq(schema.messagesToParents.parentId, input.parentMessageId),
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
        messageId: z.number().nullable(),
        channelId: z.number()
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!input.messageId) return
      await ctx.db
        .update(schema.messages)
        .set({ isPinned: true })
        .where(eq(schema.messages.id, input.messageId))

      const subscriptionMessage: NewChannelMessage = {
        id: input.messageId,
        channelId: input.channelId,
        userId: ctx.session.user.id,
        type: 'PIN_MESSAGE'
      }

      ee.emit('newMessage', subscriptionMessage)
    }),
  unPinMessage: protectedProcedure
    .input(
      z.object({
        messageId: z.number().nullable(),
        channelId: z.number()
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!input.messageId) return
      await ctx.db
        .update(schema.messages)
        .set({ isPinned: false })
        .where(eq(schema.messages.id, input.messageId))

      const subscriptionMessage: NewChannelMessage = {
        id: input.messageId,
        channelId: input.channelId,
        userId: ctx.session.user.id,
        type: 'UNPIN_MESSAGE'
      }

      ee.emit('newMessage', subscriptionMessage)
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
      const subscriptionMessage: NewChannelMessage = {
        id: input.messageId,
        channelId: input.channelId,
        userId: ctx.session.user.id,
        type: 'DELETED_MESSAGE'
      }

      ee.emit('newMessage', subscriptionMessage)
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

      const subscriptionMessage: NewChannelMessage = {
        id: input.messageId,
        channelId: input.channelId,
        userId: ctx.session.user.id,
        type: 'SAVE_MESSAGE'
      }

      ee.emit('newMessage', subscriptionMessage)
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

      const subscriptionMessage: NewChannelMessage = {
        id: input.messageId,
        channelId: input.channelId,
        userId: ctx.session.user.id,
        type: 'UNSAVE_MESSAGE'
      }

      ee.emit('newMessage', subscriptionMessage)
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
      const [deletedReaction] = await ctx.db
        .delete(schema.messageReactions)
        .where(
          and(
            eq(schema.messageReactions.messageId, input.messageId),
            eq(schema.messageReactions.emoji, input.emoji),
            eq(schema.messageReactions.userId, ctx.session.user.id)
          )
        )
        .returning({
          id: schema.messageReactions.messageId
        })

      if (!deletedReaction?.id) return {}
      const subscriptionMessage: NewChannelMessage = {
        id: deletedReaction.id,
        channelId: input.channelId,
        userId: ctx.session.user.id,
        type: 'DELETED_REACTION'
      }
      ee.emit('newMessage', subscriptionMessage)

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

      const [newChannel] = await ctx.db
        .insert(schema.channels)
        .values({ name, createdById: userId, description, isPrivate })
        .returning()
      if (!newChannel) {
        throw new Error('Failed to create channel')
      }

      // Add creator as channel member and admin
      await ctx.db.insert(schema.channelMembers).values({
        channelId: newChannel.id,
        userId: userId,
        isAdmin: true // Creator should probably be an admin
      })

      if (userIds.length) {
        // Add other users as channel members
        await ctx.db.insert(schema.channelMembers).values(
          userIds.map((userId) => ({
            channelId: newChannel.id,
            userId: userId,
            isAdmin: false
          }))
        )
      }

      return newChannel
    }),
  getOnlineUsers: protectedProcedure.query(async ({ ctx }) => {
    const onlineUsers = await ctx.db
      .selectDistinct({
        id: schema.users.id,
        name: schema.users.name,
        image: schema.users.image,
        channelId: schema.conversationsTable.channelId,
        userVisibility: schema.users.userVisibility,
        userStatus: schema.users.userStatus,
        // createdAt: schema.conversationsTable.createdAt,
        lastOnline: schema.users.lastOnline
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
      .orderBy(desc(schema.users.lastOnline))

    return onlineUsers
  }),
  getChannels: protectedProcedure.query(async ({ ctx }) => {
    let userChannels = await getUserChannels(ctx.db, ctx.session.user.id)
    if (!userChannels.length) {
      // await ctx.db.transaction(async (tx) => {
      const [newChannel] = await ctx.db
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
      await ctx.db.insert(schema.channelMembers).values({
        channelId: newChannel.id,
        userId: ctx.session.user.id,
        isAdmin: true // Creator should probably be an admin
      })
      // })

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
    }),
  getSignedS3UploadUrl: protectedProcedure
    .input(
      z.object({
        fileName: z.string(),
        fileType: z.string()
      })
    )
    .mutation(async ({ input }) => {
      const { fileName, fileType } = input
      const uploadData = await generatePresignedUrl(fileName)

      return uploadData
    }),
  saveMessageAttachments: protectedProcedure
    .input(
      z.object({
        files: z.array(
          z.object({
            fileKey: z.string(),
            fileName: z.string(),
            fileType: z.string(),
            fileSize: z.number(),
            messageId: z.number()
          })
        ),
        channelId: z.number(),
        messageId: z.number()
      })
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.db.insert(schema.messageAttachmentsTable).values(input.files)

      await setMessageAttachmentCount(input.messageId, input.files.length)

      ee.emit('newMessage', {
        id: input.channelId,
        content: '',
        channelId: input.channelId,
        userId: ctx.session.user.id
      })
    }),
  getMessageAttachments: protectedProcedure
    .input(z.object({ messageId: z.number() }))
    .query(async ({ ctx, input }) => {
      const attachments = await ctx.db
        .select({
          id: schema.messageAttachmentsTable.id,
          fileName: schema.messageAttachmentsTable.fileName,
          fileSize: schema.messageAttachmentsTable.fileSize,
          fileType: schema.messageAttachmentsTable.fileType
        })
        .from(schema.messageAttachmentsTable)
        .where(eq(schema.messageAttachmentsTable.messageId, input.messageId))

      return attachments
    }),
  getMessageAttachmentDownloadUrl: protectedProcedure
    .input(z.object({ attachmentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const attachment = await ctx.db.query.messageAttachmentsTable.findFirst({
        where: eq(schema.messageAttachmentsTable.id, input.attachmentId),
        columns: {
          fileKey: true
        }
      })

      if (!attachment || !attachment?.fileKey) {
        return { downloadUrl: '' }
      }

      const url = await generateDownloadUrl(attachment.fileKey)
      return { downloadUrl: url }
    }),
  getWorkspaceSearchResults: protectedProcedure
    .input(
      z.object({
        query: z.string()
      })
    )
    .query(async ({ input, ctx }) => {
      if (!input.query)
        return {
          users: [],
          messages: [],
          files: []
        }

      const users = await ctx.db
        .selectDistinct({
          id: schema.users.id,
          name: schema.users.name,
          image: schema.users.image,
          channelId: schema.conversationsTable.channelId,
          userVisibility: schema.users.userVisibility,
          userStatus: schema.users.userStatus,
          // createdAt: schema.conversationsTable.createdAt,
          lastOnline: schema.users.lastOnline
        })
        .from(schema.users)
        .where(
          and(
            ne(schema.users.id, ctx.session.user.id),
            ilike(schema.users.name, '%' + input.query + '%')
          )
        )
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

      const messages = await ctx.db.query.messages.findMany({
        where: ilike(schema.messages.content, '%' + input.query + '%'),
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

      const files = await ctx.db.query.messageAttachmentsTable.findMany({
        where: ilike(schema.messageAttachmentsTable.fileName, '%' + input.query + '%'),
        with: {
          message: {
            columns: {
              id: true,
              content: true
            }
          }
        },
        orderBy: asc(schema.messageAttachmentsTable.createdAt)
      })

      return {
        users: users,
        messages: messages,
        files: files
      }
    }),
  seedChannelMessages: protectedProcedure.mutation(async ({ ctx }) => {
    seedChannelWithMessages(50)
    return {}
  })
})
