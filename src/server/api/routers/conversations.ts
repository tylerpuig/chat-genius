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
              eq(schema.conversationsTable.user1Id, ctx.session.user.id),
              eq(schema.conversationsTable.user2Id, input.toUserId)
            ),
            and(
              eq(schema.conversationsTable.user1Id, input.toUserId),
              eq(schema.conversationsTable.user2Id, ctx.session.user.id)
            )
          )
        )
        .limit(1)

      let conversationId: number = conversation[0]?.channelId || 0

      if (!conversation?.length) {
        // create a new channel
        // await ctx.db.transaction(async (tx) => {
        const [newChannel] = await ctx.db
          .insert(schema.channels)
          .values({
            name: '',
            createdById: ctx.session.user.id,
            description: '',
            isPrivate: true,
            isConversation: true
          })
          .returning()
        if (!newChannel?.id) {
          throw new Error('Failed to create channel')
        }

        // Add both channel members in parallel
        await Promise.all([
          ctx.db.insert(schema.channelMembers).values({
            channelId: newChannel.id,
            userId: ctx.session.user.id,
            isAdmin: true
          }),
          ctx.db.insert(schema.channelMembers).values({
            channelId: newChannel.id,
            userId: input.toUserId,
            isAdmin: true
          })
        ]).catch((error) => {
          throw new Error(`Failed to create channel members: ${error.message}`)
        })

        const [newConversation] = await ctx.db
          .insert(schema.conversationsTable)
          .values({
            user1Id: ctx.session.user.id,
            user2Id: input.toUserId,
            channelId: newChannel.id
          })
          .returning()
        if (!newConversation) {
          throw new Error('Failed to create conversation')
        }

        conversationId = newChannel.id
        // })
        // create a new conversation

        return { newConversationId: conversationId }
      }

      return { newConversationId: conversationId }
    })
})
