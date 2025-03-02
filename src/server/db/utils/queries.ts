import { eq, and, or, type SQL, sql, gt, asc, desc, inArray, lt, ne } from 'drizzle-orm'
import * as schema from '~/server/db/schema'
import { db } from '~/server/db'
import { type ChatTab } from '~/app/store/features/ui/types'

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

export async function getMessagesFromChannel(
  channelId: number,
  userId: string,
  chatTab: ChatTab,
  limit: number = 20
) {
  try {
    if (chatTab === 'Saved') {
      return await getSavedMessages(userId)
    }

    const subquery = sql`(
      SELECT id 
      FROM ${schema.messages}
      WHERE channel_id = ${channelId} 
      AND is_reply = false
      ${chatTab === 'Pins' ? sql`AND is_pinned = true` : sql``}
      ${chatTab === 'Files' ? sql`AND attachment_count > 0` : sql``}
      ${chatTab === 'Bot' ? sql`AND is_bot = true` : sql``}
      ORDER BY id DESC
      LIMIT ${limit}
    )`

    const results = await db.query.messages.findMany({
      columns: {
        contentEmbedding: false
      },
      extras: {
        isSaved: sql<boolean>`EXISTS (
            SELECT 1 FROM ${schema.savedMessagesTable}
            WHERE message_id = ${schema.messages.id}
            AND user_id = ${userId}
          )`.as('isSaved')
      },
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            image: true
          }
        },
        reactions: {
          columns: {
            messageId: true,
            userId: true,
            emoji: true
          }
        },
        attachments: {
          columns: {
            fileContentEmbedding: false
          }
        }
      },
      where: inArray(schema.messages.id, subquery),
      orderBy: asc(schema.messages.id)
      // offset: offset || 0
    })

    return results
  } catch (err) {
    console.error('Error getting messages from channel:', err)
  }
}

async function getSavedMessages(userId: string, limit: number = 20) {
  try {
    // Create subquery to get saved message IDs
    const subquery = sql`(
      SELECT message_id 
      FROM ${schema.savedMessagesTable}
      WHERE user_id = ${userId}
      ORDER BY message_id DESC
      LIMIT ${limit}
    )`

    // Query messages using the same structure as getMessagesFromChannel
    const results = await db.query.messages.findMany({
      columns: {
        contentEmbedding: false
      },
      extras: {
        isSaved: sql<boolean>`EXISTS (
            SELECT 1 FROM ${schema.savedMessagesTable}
            WHERE message_id = ${schema.messages.id}
            AND user_id = ${userId}
          )`.as('isSaved')
      },
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            image: true
          }
        },
        reactions: {
          columns: {
            messageId: true,
            userId: true,
            emoji: true
          }
        },
        attachments: {
          columns: {
            fileContentEmbedding: false
          }
        }
      },
      where: inArray(schema.messages.id, subquery),
      orderBy: asc(schema.messages.id)
    })

    return results
  } catch (err) {
    console.error('Error getting saved messages:', err)
  }
}

export async function getLatestMessagesFromChannel(channelId: number, limit: number) {
  try {
    const messages = await db.query.messages.findMany({
      columns: {
        content: true,
        createdAt: true
      },
      with: {
        user: {
          columns: {
            name: true
          }
        }
      },
      orderBy: desc(schema.messages.createdAt),
      // where: and(eq(schema.messages.channelId, channelId), ne(schema.messages.userId, userId)),
      where: eq(schema.messages.channelId, channelId),
      limit
    })

    return messages
  } catch (err) {
    console.log(err)
  }
}

export async function getLatestMessagesFromUser(userId: string, limit: number) {
  try {
    const messages = await db.query.messages.findMany({
      columns: {
        content: true,
        createdAt: true
      },
      with: {
        user: {
          columns: {
            name: true
          }
        }
      },
      orderBy: desc(schema.messages.createdAt),
      where: eq(schema.messages.userId, userId),
      limit
    })

    return messages
  } catch (err) {
    console.log(err)
  }
}

export async function getUserNameFromId(userId: string): Promise<string> {
  try {
    const user = await db.query.users.findFirst({
      columns: {
        name: true
      },
      where: eq(schema.users.id, userId)
    })

    return user?.name ?? ''
  } catch (err) {
    console.log(err)
  }

  return ''
}
