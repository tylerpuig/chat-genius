import { z } from 'zod'
import EventEmitter, { on } from 'events'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { eq, and, or, ne, sql, gt, desc, ilike, asc } from 'drizzle-orm'
import * as schema from '~/server/db/schema'
import {
  UserSubscriptionManager,
  type NewChannelMessage
} from '~/server/api/utils/subscriptionManager'
import { getUserChannels, getMessagesFromChannel } from '~/server/db/utils/queries'
import { incrementMessageReplyCount, setMessageAttachmentCount } from '~/server/db/utils/insertions'
import { generatePresignedUrl, generateDownloadUrl } from '~/server/db/utils/s3'

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
          // console.log(newMessage, 'onMessage')

          // Only yield messages for channels this user is subscribed to
          if (subscriptionManager.isSubscribed(userId, newMessage.channelId)) {
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
          .returning()

        if (!newMessage?.id) return []
        // Emit the new message event
        // The subscription above will handle filtering to only subscribed users
        const subscriptionMessage: NewChannelMessage = {
          id: newMessage?.id,
          channelId: input.channelId,
          userId: ctx.session.user.id,
          createdAt: new Date(),
          messageType: 'NEW_MESSAGE'
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
  getLatestMessagesFromChannel: protectedProcedure
    .input(
      z.object({
        channelId: z.number(),
        chatTab: z.enum(['Messages', 'Files', 'Pins', 'Saved']),
        lastReadMessageId: z.number()
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { channelId } = input

      const results = await getMessagesFromChannel(
        channelId,
        ctx.session.user.id,
        input.chatTab,
        input.lastReadMessageId
      )

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
        .returning({
          id: schema.messageReactions.messageId
        })

      if (!newReaction?.id) return

      const subMessage: NewChannelMessage = {
        id: newReaction.id,
        channelId: input.channelId,
        userId: ctx.session.user.id,
        createdAt: new Date(),
        messageType: 'NEW_REACTION'
      }
      ee.emit('newMessage', subMessage)

      return newReaction
    }),
  getMessageReactions: protectedProcedure
    .input(
      z.object({
        messageId: z.number()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const reactions = await ctx.db
        .select({
          messageId: schema.messageReactions.messageId,
          emoji: schema.messageReactions.emoji,
          userId: schema.messageReactions.userId
        })
        .from(schema.messageReactions)
        .where(eq(schema.messageReactions.messageId, input.messageId))

      return reactions
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
      // Move all DB operations inside a single transaction
      const result = await ctx.db.transaction(async (tx) => {
        // 1. Create the reply message
        const newMessage = await tx
          .insert(schema.messages)
          .values({
            content: input.content,
            channelId: input.channelId,
            userId: ctx.session.user.id,
            isReply: true
          })
          .returning()

        if (!newMessage?.[0]) {
          throw new Error('Failed to create reply message')
        }

        const newMessageId = newMessage[0].id

        // 2. Create the parent-child relationship
        await tx.insert(schema.messagesToParents).values({
          messageId: newMessageId,
          parentId: input.messageId
        })

        // 3. Increment the reply count within the same transaction
        await tx
          .update(schema.messages)
          .set({
            replyCount: sql`reply_count + 1`
          })
          .where(eq(schema.messages.id, input.messageId))
        console.log('newMessageId', newMessageId)

        return newMessageId
      })

      // Only emit event after successful transaction
      if (result) {
        const channelMessage: NewChannelMessage = {
          id: result,
          channelId: input.channelId,
          userId: ctx.session.user.id,
          createdAt: new Date(),
          messageType: 'NEW_REPLY'
        }
        ee.emit('newMessage', channelMessage)
      }

      return { messageId: result }
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

      // console.log(mainMessage)
      if (!mainMessage) return { mainMessage, replies: [] }
      const replies = await ctx.db.query.messagesToParents.findMany({
        where: eq(schema.messagesToParents.parentId, mainMessage?.id),
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

      // console.log(replies)

      return { mainMessage, replies }
    }),
  getLatestMessageReply: protectedProcedure
    .input(
      z.object({
        parentMessageId: z.number(),
        lastReadMessageId: z.number()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const mainMessage = await ctx.db.query.messages.findFirst({
        where: eq(schema.messages.id, input.parentMessageId),
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
        where: and(
          eq(schema.messagesToParents.parentId, input.parentMessageId),
          gt(schema.messagesToParents.messageId, input.lastReadMessageId)
        ),
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
      const [updatedMessage] = await ctx.db
        .update(schema.messages)
        .set({ isPinned: true })
        .where(eq(schema.messages.id, input.messageId))
        .returning()

      if (updatedMessage?.id) {
        const subMessage: NewChannelMessage = {
          id: updatedMessage?.id,
          channelId: input.channelId,
          userId: ctx.session.user.id,
          createdAt: updatedMessage?.createdAt,
          messageType: 'NEW_PIN'
        }
        ee.emit('newMessage', subMessage)
      }

      return updatedMessage ?? {}
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
      const [updatePin] = await ctx.db
        .update(schema.messages)
        .set({ isPinned: false })
        .where(eq(schema.messages.id, input.messageId))
        .returning({ id: schema.messages.id })

      if (!updatePin?.id) return

      const subMessage: NewChannelMessage = {
        id: updatePin?.id,
        channelId: input.channelId,
        userId: ctx.session.user.id,
        createdAt: new Date(),
        messageType: 'REMOVE_PIN'
      }

      ee.emit('newMessage', subMessage)
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

      const [deletedMessage] = await ctx.db
        .delete(schema.messages)
        .where(eq(schema.messages.id, input.messageId))
        .returning({
          id: schema.messages.id
        })

      if (!deletedMessage?.id) return

      const subMessage: NewChannelMessage = {
        id: deletedMessage?.id,
        channelId: input.channelId,
        userId: ctx.session.user.id,
        createdAt: new Date(),
        messageType: 'DELETE_MESSAGE'
      }
      ee.emit('newMessage', subMessage)
    }),

  saveMessage: protectedProcedure
    .input(
      z.object({
        messageId: z.number(),
        channelId: z.number()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [savedMessage] = await ctx.db
        .insert(schema.savedMessagesTable)
        .values({ messageId: input.messageId, userId: ctx.session.user.id })
        .returning({
          id: schema.savedMessagesTable.messageId
        })

      if (!savedMessage?.id) return

      const subMessage: NewChannelMessage = {
        id: savedMessage?.id,
        channelId: input.channelId,
        userId: ctx.session.user.id,
        createdAt: new Date(),
        messageType: 'SAVE_MESSAGE'
      }
      ee.emit('newMessage', subMessage)
    }),
  unSaveMessage: protectedProcedure
    .input(
      z.object({
        messageId: z.number(),
        channelId: z.number()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [unSavedMessage] = await ctx.db
        .delete(schema.savedMessagesTable)
        .where(eq(schema.savedMessagesTable.messageId, input.messageId))
        .returning({
          id: schema.savedMessagesTable.messageId
        })

      if (!unSavedMessage?.id) return

      const subMessage: NewChannelMessage = {
        id: unSavedMessage?.id,
        channelId: input.channelId,
        userId: ctx.session.user.id,
        createdAt: new Date(),
        messageType: 'UNSAVE_MESSAGE'
      }
      ee.emit('newMessage', subMessage)
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

      // if (!deletedReaction?.id) return

      const subMessage: NewChannelMessage = {
        id: input.messageId,
        channelId: input.channelId,
        userId: ctx.session.user.id,
        createdAt: new Date(),
        messageType: 'REMOVE_REACTION'
      }
      ee.emit('newMessage', subMessage)

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
    })
})
