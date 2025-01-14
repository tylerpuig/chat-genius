import { eq, and, or, type SQL, sql, gt, asc, desc } from 'drizzle-orm'
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

export async function getMessagesFromChannel(channelId: number, userId: string, chatTab: ChatTab) {
  try {
    const conditions: SQL<unknown>[] = [
      eq(schema.messages.channelId, channelId),
      eq(schema.messages.isReply, false)
    ]

    if (chatTab === 'Pins') {
      conditions.push(eq(schema.messages.isPinned, true))
    }

    if (chatTab === 'Files') {
      conditions.push(gt(schema.messages.attachmentCount, 0))
    }

    if (chatTab === 'Bot') {
      conditions.push(eq(schema.messages.fromBot, true))
    }

    if (chatTab === 'Saved') {
      return await getSavedMessages(userId)
    }

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
        // isSaved: true
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
        attachments: true
      },
      where: and(...conditions),
      // limit: 20,
      orderBy: desc(schema.messages.createdAt),
      limit: 20
    })

    return results.reverse()
  } catch (err) {
    console.error('Error getting messages from channel:', err)
  }
}

async function getSavedMessages(userId: string) {
  try {
    const savedMessages = await db.query.savedMessagesTable
      .findMany({
        where: eq(schema.savedMessagesTable.userId, userId),
        orderBy: asc(schema.savedMessagesTable.messageId),
        columns: {},
        with: {
          message: {
            extras: {
              isSaved: sql<boolean>`EXISTS (
              SELECT 1 FROM ${schema.savedMessagesTable}
              WHERE message_id = ${schema.messages.id}
              AND user_id = ${userId}
            )`.as('isSaved')
            },
            columns: {
              contentEmbedding: false
            },
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
          }
        }
      })
      .then((saved) => saved.map((s) => s.message))

    return savedMessages
  } catch (err) {
    console.error('Error getting saved messages:', err)
  }
}
