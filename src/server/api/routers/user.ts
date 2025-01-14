import { z } from 'zod'

import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc'
import { eq } from 'drizzle-orm'
import { channels, channelMembers } from '~/server/db/schema'
import { users } from '~/server/db/schema'

const editUserSchema = z.object({
  name: z.string().min(1).nullable(),
  userVisibility: z.string().nullable(),
  userStatus: z.string().nullable()
})

export type EditUserInput = z.infer<typeof editUserSchema>

export const usersRouter = createTRPCRouter({
  getUserChannels: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input, ctx }) => {
      const userChannels = await ctx.db
        .select({
          id: channels.id,
          name: channels.name,
          description: channels.description,
          isPrivate: channels.isPrivate,
          createdAt: channels.createdAt
        })
        .from(channelMembers)
        .innerJoin(channels, eq(channelMembers.channelId, channels.id))
        .where(eq(channelMembers.userId, input.userId))

      return userChannels || []
    }),
  editUserDetails: protectedProcedure.input(editUserSchema).mutation(async ({ ctx, input }) => {
    const result = await ctx.db.update(users).set(input).where(eq(users.id, ctx.session.user.id))
    return result
  }),
  getUserDetails: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.query.users.findFirst({
      where: eq(users.id, ctx.session.user.id),
      columns: {
        name: true,
        userVisibility: true,
        userStatus: true
      }
    })
    return user
  }),
  getUserProfileDetails: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.query.users.findFirst({
        where: eq(users.id, input.userId),
        columns: {
          id: true,
          name: true,
          userVisibility: true,
          userStatus: true,
          image: true
        }
      })
      return user
    })
})
