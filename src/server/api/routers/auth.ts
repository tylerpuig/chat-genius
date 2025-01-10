import { z } from 'zod'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc'
import { users } from '~/server/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { AvatarGenerator } from 'random-avatar-generator'
import { faker } from '@faker-js/faker'
import { type User } from '~/server/db/types'

export const authRouter = createTRPCRouter({
  emailSignUp: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string(), name: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const user = await ctx.db.select().from(users).where(eq(users.email, input.email))

      if (user.length) {
        throw new Error('User already exists')
      }

      // 10 salt rounds
      const hashedPassword = await bcrypt.hash(input.password, 10)

      const generator = new AvatarGenerator()

      // Simply get a random avatar
      const randomAvatar = generator.generateRandomAvatar(input.email)

      const newUser = await ctx.db
        .insert(users)
        .values({
          name: input.name,
          email: input.email.toLowerCase(),
          password: hashedPassword,
          image: randomAvatar
        })
        .returning()

      return {
        success: true,
        user: newUser[0]
      }
    }),
  seedDB: protectedProcedure.mutation(async ({ ctx }) => {
    const createUsers: Omit<User, 'id' | 'emailVerified'>[] = []

    for (let i = 0; i < 10; i++) {
      const newUser: Omit<User, 'id' | 'emailVerified'> = {
        name: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),
        password: bcrypt.hashSync('testing', 10),
        image: faker.image.avatar(),
        lastOnline: new Date()
      }

      createUsers.push(newUser)
    }

    await ctx.db.insert(users).values(createUsers)
  })
})
