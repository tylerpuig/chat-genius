type UserSubscriptions = {
  channels: Set<number>
  privateMessages: Set<number>
  lastActive: number
}

export type NewChannelMessage = {
  id: number
  content: string
  channelId: number
  userId: string
  createdAt: Date
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
    return this.subscriptions.get(userId)?.channels?.has(channelId) ?? false
  }

  // Get all channels a user is subscribed to
  getUserChannels(userId: string): number[] {
    return Array.from(this.subscriptions.get(userId)?.channels ?? [])
  }
}
