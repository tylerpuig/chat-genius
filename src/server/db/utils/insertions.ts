import { sql } from 'drizzle-orm'
import { eq, and, ne, or, isNull } from 'drizzle-orm'
import { db } from '~/server/db'
import * as schema from '~/server/db/schema'

export async function incrementMessageReplyCount(messageId: number): Promise<void> {
  try {
    await db
      .update(schema.messages)
      .set({
        replyCount: sql`${schema.messages.replyCount} + 1`
      })
      .where(eq(schema.messages.id, messageId))
  } catch (err) {
    console.error('Error incrementing message reply count:', err)
  }
}

export async function setMessageAttachmentCount(messageId: number, count: number): Promise<void> {
  try {
    await db
      .update(schema.messages)
      .set({
        attachmentCount: count
      })
      .where(eq(schema.messages.id, messageId))
  } catch (err) {
    console.error('Error incrementing message attachment count:', err)
  }
}

export async function createPrivateConversationsForNewUser(newUserId: string): Promise<void> {
  try {
    // await db.transaction(async (tx) => {
    // 1. Get all existing user IDs except the new user that don't already have a conversation
    const existingUsers = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .leftJoin(
        schema.conversationsTable,
        or(
          and(
            eq(schema.users.id, schema.conversationsTable.user1Id),
            eq(schema.conversationsTable.user2Id, newUserId)
          ),
          and(
            eq(schema.users.id, schema.conversationsTable.user2Id),
            eq(schema.conversationsTable.user1Id, newUserId)
          )
        )
      )
      .where(and(ne(schema.users.id, newUserId), isNull(schema.conversationsTable.id)))

    if (!existingUsers.length) return

    // 2. Prepare channel insertion data
    const channelValues = existingUsers.map(() => ({
      name: '',
      createdById: newUserId,
      description: '',
      isPrivate: true,
      isConversation: true
    }))

    // 3. Batch insert channels
    const newChannels = await db
      .insert(schema.channels)
      .values(channelValues)
      .returning({ id: schema.channels.id })

    // 4. Prepare channel members data
    const channelMembersValues = newChannels.flatMap((channel) => [
      {
        channelId: channel.id,
        userId: newUserId,
        isAdmin: true
      },
      {
        channelId: channel.id,
        userId: existingUsers[newChannels.indexOf(channel)]!.id,
        isAdmin: true
      }
    ])

    // 5. Batch insert channel members
    await db.insert(schema.channelMembers).values(channelMembersValues)

    // 6. Prepare conversations data
    const conversationValues = newChannels.map((channel, index) => ({
      user1Id: newUserId,
      user2Id: existingUsers[index]!.id,
      channelId: channel.id
    }))

    // 7. Batch insert conversations
    await db.insert(schema.conversationsTable).values(conversationValues)

    // })
  } catch (err) {
    console.error('Error creating private conversations for new user:', err)
  }
}
