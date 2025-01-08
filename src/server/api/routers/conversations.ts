import { z } from 'zod'

import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { eq, and, or } from 'drizzle-orm'
import * as schema from '~/server/db/schema'

export const conversationsRouter = createTRPCRouter({
  createConversation: protectedProcedure
    .input(z.object({ toUserId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const conversation = await ctx.db
        .select()
        .from(schema.conversationsTable)
        .where(
          or(
            and(
              eq(schema.conversationsTable.user2Id, input.toUserId),
              eq(schema.conversationsTable.user1Id, ctx.session.user.id)
            ),
            and(
              eq(schema.conversationsTable.user1Id, ctx.session.user.id),
              eq(schema.conversationsTable.user2Id, input.toUserId)
            )
          )
        )
        .limit(1)

      let conversationId: number = conversation[0]?.id || 0

      if (!conversation?.length) {
        // create a new channel
        await ctx.db.transaction(async (tx) => {
          const [newChannel] = await tx
            .insert(schema.channels)
            .values({
              name: '',
              createdById: ctx.session.user.id,
              description: '',
              isPrivate: true,
              isConversation: true
            })
            .returning()
          if (!newChannel) {
            throw new Error('Failed to create channel')
          }

          // Add creator as channel member and admin
          await tx.insert(schema.channelMembers).values({
            channelId: newChannel.id,
            userId: ctx.session.user.id,
            isAdmin: true // Creator should probably be an admin
          })

          // Add other users as channel members
          await tx.insert(schema.channelMembers).values({
            channelId: newChannel.id,
            userId: input.toUserId,
            isAdmin: true
          })

          // create new conversation
          await tx.insert(schema.conversationsTable).values({
            user1Id: ctx.session.user.id,
            user2Id: input.toUserId,
            channelId: newChannel.id
          })

          conversationId = newChannel.id
        })
        // create a new conversation

        return { newConversationId: conversationId }
      }

      return { newConversationId: conversationId }
    })
})
