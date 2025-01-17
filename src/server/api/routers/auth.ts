import { z } from 'zod'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '~/server/api/trpc'
import { users } from '~/server/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { AvatarGenerator } from 'random-avatar-generator'
import { faker } from '@faker-js/faker'
import { type User } from '~/server/db/types'
import { createPrivateConversationsForNewUser } from '~/server/db/utils/insertions'
import * as openAIUtils from '~/server/db/utils/openai'

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
      const userNameEmbedding = await openAIUtils.generateEmbeddingFromText(input.name, 512)

      const [newUser] = await ctx.db
        .insert(users)
        .values({
          name: input.name,
          email: input.email.toLowerCase(),
          password: hashedPassword,
          image: randomAvatar,
          userNameEmbedding: userNameEmbedding ?? null
        })
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
          image: users.image
        })

      if (!newUser?.id) {
        throw new Error('Failed to create user')
      }

      await createPrivateConversationsForNewUser(newUser.id)

      return {
        success: true,
        user: newUser
      }
    }),
  seedDB: protectedProcedure.mutation(async ({ ctx }) => {
    const createUsers: SeedUser[] = []

    for (let i = 0; i < 10; i++) {
      const fakeName = faker.person.fullName()
      const nameEmbedding = await openAIUtils.generateEmbeddingFromText(fakeName, 512)
      const newUser: SeedUser = {
        name: fakeName,
        userNameEmbedding: nameEmbedding ?? null,
        email: faker.internet.email().toLowerCase(),
        password: bcrypt.hashSync('testing', 10),
        image: faker.image.avatar(),
        lastOnline: new Date(),
        userStatus: (await openAIUtils.generateRandomUserStatus()) ?? faker.lorem.sentence()
      }

      createUsers.push(newUser)
    }

    const createdUsers = await ctx.db.insert(users).values(createUsers).returning()

    for (const user of createdUsers) {
      await createPrivateConversationsForNewUser(user.id)
    }
  })
})

type SeedUser = Omit<User, 'id' | 'emailVerified' | 'userVisibility'>
