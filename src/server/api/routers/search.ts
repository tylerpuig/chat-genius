import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import {
  eq,
  and,
  desc,
  or,
  ne,
  ilike,
  asc,
  cosineDistance,
  sql,
  exists,
  isNotNull
} from 'drizzle-orm'
import * as schema from '~/server/db/schema'
import * as openAIUtils from '~/server/db/utils/openai'

const editUserSchema = z.object({
  name: z.string().min(1).nullable(),
  userVisibility: z.string().nullable(),
  userStatus: z.string().nullable()
})

export type EditUserInput = z.infer<typeof editUserSchema>

export const searchRouter = createTRPCRouter({
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
  getWorkspaceSearchResultsBySimilarity: protectedProcedure
    .input(
      z.object({
        query: z.string()
      })
    )
    .query(async ({ input, ctx }) => {
      const messageEmbedding = await openAIUtils.generateEmbeddingFromText(input.query, 1536)

      if (!messageEmbedding)
        return {
          users: [],
          messages: [],
          files: []
        }

      const users = await ctx.db
        .select({
          id: schema.users.id,
          name: schema.users.name,
          image: schema.users.image,
          channelId: schema.conversationsTable.channelId,
          userVisibility: schema.users.userVisibility,
          userStatus: schema.users.userStatus,
          lastOnline: schema.users.lastOnline,
          similarity: sql<number>`1 - (${cosineDistance(schema.users.userNameEmbedding, messageEmbedding)})`
        })
        .from(schema.users)
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
        .where(isNotNull(schema.users.userNameEmbedding))
        .orderBy((t) => desc(t.similarity))
        .limit(5)

      // console.log(users)

      const messages = await ctx.db
        .select({
          content: schema.messages.content,
          similarity: sql<number>`1 - (${cosineDistance(schema.messages.contentEmbedding, messageEmbedding)})`,
          channelId: schema.messages.channelId,
          createdAt: schema.messages.createdAt,
          channelName: schema.channels.name,
          name: schema.users.name
        })
        .from(schema.messages)
        .innerJoin(schema.channels, eq(schema.messages.channelId, schema.channels.id))
        .leftJoin(schema.users, eq(schema.messages.userId, schema.users.id))
        .where(
          and(
            isNotNull(schema.messages.contentEmbedding),
            or(
              // User is a member of the channel
              exists(
                ctx.db
                  .select()
                  .from(schema.channelMembers)
                  .where(
                    and(
                      eq(schema.channelMembers.channelId, schema.messages.channelId),
                      eq(schema.channelMembers.userId, ctx.session.user.id)
                    )
                  )
              ),
              // Channel is public
              and(
                eq(schema.channels.isPrivate, false),
                eq(schema.channels.isConversation, false),
                isNotNull(schema.messages.contentEmbedding)
              ),
              // User is part of the conversation
              and(
                eq(schema.channels.isConversation, true),
                exists(
                  ctx.db
                    .select()
                    .from(schema.conversationsTable)
                    .where(
                      and(
                        eq(schema.conversationsTable.channelId, schema.messages.channelId),
                        or(
                          eq(schema.conversationsTable.user1Id, ctx.session.user.id),
                          eq(schema.conversationsTable.user2Id, ctx.session.user.id)
                        )
                      )
                    )
                )
              )
            )
          )
        )
        .orderBy((t) => desc(t.similarity))
        .limit(10)
      // console.log('messages', messages)

      const files = await ctx.db
        .select({
          id: schema.messageAttachmentsTable.id,
          fileName: schema.messageAttachmentsTable.fileName,
          similarity: sql<number>`1 - (${cosineDistance(schema.messageAttachmentsTable.fileContentEmbedding, messageEmbedding)})`
        })
        .from(schema.messageAttachmentsTable)
        .where(isNotNull(schema.messageAttachmentsTable.fileContentEmbedding))
        .orderBy((t) => desc(t.similarity))
        .limit(10)

      console.log('files', files)

      // remove similarity to reduce network payload
      const formattedUsers = users.map((u) => {
        const { similarity, ...rest } = u
        return rest
      })

      const formattedMessages = messages.map((m) => {
        const { similarity, ...rest } = m
        return rest
      })

      const formattedFiles = files.map((f) => {
        const { similarity, ...rest } = f
        return rest
      })

      return {
        users: formattedUsers,
        messages: formattedMessages,
        files: formattedFiles
      }
    })
})
