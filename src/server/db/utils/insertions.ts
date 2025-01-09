import { sql } from 'drizzle-orm'
import { eq } from 'drizzle-orm'
import { db } from '~/server/db'
import * as schema from '~/server/db/schema'

export async function incrementMessageReplyCount(messageId: number) {
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
