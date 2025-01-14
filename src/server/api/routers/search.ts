import { z } from 'zod'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc'
import { eq, and, desc, or, ne, ilike, asc, cosineDistance, sql } from 'drizzle-orm'
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

      // user's name & file name embeddings are 512 dimensions
      const slicedEmbedding = messageEmbedding.slice(0, 512)

      const users = await ctx.db
        .select({
          id: schema.users.id,
          name: schema.users.name,
          image: schema.users.image,
          channelId: schema.conversationsTable.channelId,
          userVisibility: schema.users.userVisibility,
          userStatus: schema.users.userStatus,
          lastOnline: schema.users.lastOnline,
          similarity: sql<number>`1 - (${cosineDistance(schema.users.userNameEmbedding, slicedEmbedding)})`
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
        .orderBy((t) => t.similarity)
        .limit(10)

      const messages = await ctx.db
        .select({
          content: schema.messages.content,
          similarity: sql<number>`1 - (${cosineDistance(schema.messages.contentEmbedding, messageEmbedding)})`,
          channelId: schema.messages.channelId,
          createdAt: schema.messages.createdAt
        })
        .from(schema.messages)
        .orderBy((t) => desc(t.similarity))
        .limit(10)

      const files = await ctx.db
        .select({
          id: schema.messageAttachmentsTable.id,
          fileName: schema.messageAttachmentsTable.fileName,
          similarity: sql<number>`1 - (${cosineDistance(schema.messageAttachmentsTable.fileNameEmbedding, slicedEmbedding)})`
        })
        .from(schema.messageAttachmentsTable)
        .orderBy((t) => desc(t.similarity))
        .limit(10)

      return {
        users: users,
        messages: messages,
        files: files
      }
    })
})
