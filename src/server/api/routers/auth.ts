import { z } from 'zod'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc'
import { users } from '~/server/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export const authRouter = createTRPCRouter({
  emailSignUp: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string(), name: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const user = await ctx.db.select().from(users).where(eq(users.email, input.email))

      if (user) {
        throw new Error('User already exists')
      }

      // 10 salt rounds
      const hashedPassword = await bcrypt.hash(input.password, 10)

      const newUser = await ctx.db
        .insert(users)
        .values({
          name: input.name,
          email: input.email,
          password: hashedPassword
        })
        .returning()

      return {
        success: true,
        user: newUser
      }
    })
})
