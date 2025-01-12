import { db } from '~/server/db'
import { eq, count, sql } from 'drizzle-orm'
import { users } from '~/server/db/schema'
import { type ChatMessageData } from '~/trpc/types'

type UserSubscriptions = {
  channels: Set<number>
  privateMessages: Set<number>
  lastActive: number
}

export type NewChannelMessage = {
  id: number
  channelId: number
  userId: string
  createdAt: Date
  messageType:
    | 'NEW_MESSAGE'
    | 'NEW_REPLY'
    | 'NEW_PIN'
    | 'REMOVE_PIN'
    | 'SAVE_MESSAGE'
    | 'UNSAVE_MESSAGE'
    | 'DELETE_MESSAGE'
    | 'NEW_REACTION'
    | 'REMOVE_REACTION'
}

// In-memory store for active channel subscriptions
export class UserSubscriptionManager {
  private subscriptions = new Map<string, UserSubscriptions>()

  // Add a user to a channel
  subscribe(userId: string, channelId: number) {
    if (!this.subscriptions.has(userId)) {
      this.subscriptions.set(userId, {
        channels: new Set(),
        privateMessages: new Set(),
        lastActive: Date.now()
      })
    }
    const userSubs = this.subscriptions.get(userId)
    if (!userSubs) return

    // Add channel to user subscriptions
    userSubs.channels.add(channelId)
  }

  // Remove a user from a channel
  unsubscribe(userId: string, channelId: number) {
    this.subscriptions.get(userId)?.channels?.delete(channelId)
    // Clean up if user has no more subscriptions
    if (!this.subscriptions.get(userId)?.channels?.size) {
      this.subscriptions.delete(userId)
    }
  }

  // Get all users subscribed to a channel
  getChannelSubscribers(channelId: number): string[] {
    const subscribers: string[] = []
    for (const [userId, subscriptions] of this.subscriptions.entries()) {
      if (subscriptions.channels.has(channelId)) {
        subscribers.push(userId)
      }
    }
    return subscribers
  }

  // Check if a user is subscribed to a channel
  isSubscribed(userId: string, channelId: number): boolean {
    const isSubbed = this.subscriptions.get(userId)?.channels?.has(channelId) ?? false
    if (isSubbed) {
      void updateUserLastOnline(userId)
    }

    return isSubbed
  }

  // Get all channels a user is subscribed to
  getUserChannels(userId: string): number[] {
    return Array.from(this.subscriptions.get(userId)?.channels ?? [])
  }
}

async function updateUserLastOnline(userId: string): Promise<void> {
  try {
    // const backInTime = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)
    await db.update(users).set({ lastOnline: new Date() }).where(eq(users.id, userId))
  } catch (err) {
    console.error('Error updating user online status:', err)
  }
}

// Run every every minute to mark a random user as online
// setInterval(async () => {
//   await markRandomUserOnline()
// }, 5_000)

async function markRandomUserOnline(): Promise<void> {
  try {
    const userCount = await db
      .select({
        count: count(users.id)
      })
      .from(users)

    if (!userCount?.[0]?.count) return
    const randomUserId = Math.floor(Math.random() * userCount?.[0]?.count)

    const allUsers = await db
      .select({
        id: users.id
      })
      .from(users)

    if (!allUsers?.length || allUsers.length < randomUserId || !allUsers?.[randomUserId]?.id) return

    await updateUserLastOnline(allUsers?.[randomUserId]?.id)
  } catch (err) {
    console.error('Error updating user online status:', err)
  }
}
