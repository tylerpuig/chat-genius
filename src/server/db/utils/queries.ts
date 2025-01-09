import { eq, and, or } from 'drizzle-orm'
import * as schema from '~/server/db/schema'
import { db } from '~/server/db'

type UserChannelInfo = {
  id: number
  name: string
  description: string
  isPrivate: boolean
  createdAt: Date
  isAdmin: boolean
}

export async function getUserChannels(db: any, userId: string): Promise<UserChannelInfo[]> {
  try {
    const userChannels = await db
      .select({
        id: schema.channels.id,
        name: schema.channels.name,
        description: schema.channels.description,
        isPrivate: schema.channels.isPrivate,
        createdAt: schema.channels.createdAt,
        // Use a left join to get isAdmin, which might be null for public channels
        isAdmin: schema.channelMembers.isAdmin
      })
      .from(schema.channels)
      .leftJoin(
        schema.channelMembers,
        and(
          eq(schema.channels.id, schema.channelMembers.channelId),
          eq(schema.channelMembers.userId, userId)
        )
      )
      .where(
        and(
          eq(schema.channels.isConversation, false),

          or(
            // Include channel if it's public
            eq(schema.channels.isPrivate, false),
            // OR if user is a member (for private channels)
            eq(schema.channelMembers.userId, userId)
          )
        )
      )

    return userChannels
  } catch (err) {
    console.log(err)
  }

  return []
}
