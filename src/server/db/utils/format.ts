import * as dbQueryUtils from './queries'
import { createMessageTextEmbedding } from './openai'

export async function formatNewChannelMessageEmbeddingContext(
  userId: string,
  messageContent: string,
  channelId: number,
  messageId: number
): Promise<void> {
  try {
    const latestMessages = (await dbQueryUtils.getLatestMessagesFromChannel(channelId, 4)) ?? []
    const userName = (await dbQueryUtils.getUserNameFromId(userId)) ?? ''
    const userLatestMessages = (await dbQueryUtils.getLatestMessagesFromUser(userId, 4)) ?? []

    const latestMessagesContext = latestMessages.map((m) => {
      return {
        message: m.content,
        from: m.user?.name ?? '',
        createdAt: normalizeTimetamp(m.createdAt)
      }
    })

    const userLatestMessagesContext = userLatestMessages.map((m) => {
      return {
        message: m.content,
        from: m.user?.name ?? '',
        createdAt: normalizeTimetamp(m.createdAt)
      }
    })

    const messageWithContext = `
    from: ${userName}
    message: ${messageContent}
    previous_context: ${JSON.stringify(userLatestMessagesContext, null, 2)}
    conversation_context: ${JSON.stringify(latestMessagesContext, null, 2)}
    timestamp: ${normalizeTimetamp(new Date())}`

    await createMessageTextEmbedding(messageId, messageWithContext)
  } catch (err) {
    console.log(err)
  }
}

export function normalizeTimetamp(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    hour: 'numeric',
    minute: '2-digit',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour12: true
  }
  return date.toLocaleString('en-US', options)
}
