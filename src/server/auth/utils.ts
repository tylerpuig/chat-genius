import { db } from '~/server/db'
import { users } from '~/server/db/schema'
import { eq } from 'drizzle-orm'
import { User } from '~/server/db/types'

export async function getUserByEmail(email: string): Promise<User | undefined> {
  try {
    const formattedEmail = email.toLowerCase()
    const result = await db.select().from(users).where(eq(users.email, formattedEmail))
    return result[0]
  } catch (err) {
    console.log(err)
  }
}
