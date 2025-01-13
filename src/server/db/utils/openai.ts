import OpenAI from 'openai'
import { db } from '~/server/db'
import { eq } from 'drizzle-orm'
import * as schema from '~/server/db/schema'
import { z } from 'zod'

const OPENAI_EMBEDDING_MODEL = 'text-embedding-3-large'
const OPENAI_CHAT_MODEL = 'gpt-4o-mini-2024-07-18'
const OPENAI_EMBEDDING_DIMENSIONS = 1536
const openAIClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function createMessageTextEmbedding(messageId: number, text: string): Promise<void> {
  try {
    const response = await openAIClient.embeddings.create({
      model: OPENAI_EMBEDDING_MODEL,
      input: text,
      dimensions: OPENAI_EMBEDDING_DIMENSIONS
    })

    const embedding = response.data[0]?.embedding
    if (!embedding) return

    await db
      .update(schema.messages)
      .set({ contentEmbedding: embedding })
      .where(eq(schema.messages.id, messageId))
  } catch (err) {
    console.error('Error creating message text embedding:', err)
  }
}

async function genRandomChannelMessage(
  userCtx: string,
  messagesCtx: string
): Promise<string | undefined> {
  try {
    const response = await openAIClient.chat.completions.create({
      model: OPENAI_CHAT_MODEL,
      messages: [
        {
          role: 'system',
          content: `This is the #finance channel where the finance team discusses quarterly 
    forecasts, budget planning, and financial metrics. The team is currently focused on:
    - Q2 2025 budget planning and forecasting
    - Implementing new financial reporting automation
    - Reviewing departmental spending trends
    - Discussing potential areas for cost optimization
    - Analyzing cash flow projections for upcoming expansion plans

    The conversation should maintain a casual and natural tone. The finananical terms should be easilty understandable by a non-financial person.

    Generate a single message from one of the team members that naturally continues this conversation. 
The message should:
- Only be around 20 - 30 words
- Be relevant to the ongoing discussion
- Include specific details or numbers when appropriate
- Reflect the speaker's role
- Maintain a conversational tone
- Occasionally ask questions or request input from others
- Sometimes reference specific financial metrics, tools, or processes
- Don't put any placeholders

- Here are the previous messages from the user:
${userCtx}

Here are the previous messages from the channel:
${messagesCtx}


    `
        }
      ]
    })

    const message = response.choices[0]?.message?.content
    if (!message) return
    return message

    // await db
    //   .update(schema.messages)
    //   .set({ contentEmbedding: embedding })
    //   .where(eq(schema.messages.id, messageId))
  } catch (err) {
    console.error('Error creating message text embedding:', err)
  }
}

async function getAllUsers() {
  try {
    const users = await db.query.users.findMany({
      columns: {
        name: true,
        id: true
      }
    })
    return users
  } catch (err) {
    console.error('Error getting all users:', err)
  }
}

export async function seedChannelWithMessages(iterations: number): Promise<void> {
  const channelId = 59

  const userPreviousMessages: Record<string, string[]> = {}
  const channelMessages: string[] = []

  try {
    const allUsers = await getAllUsers()
    if (!allUsers?.length) return

    for (let i = 0; i < iterations; i++) {
      const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)]
      if (!randomUser) continue
      const userId = randomUser.id

      if (!userPreviousMessages[userId]) {
        userPreviousMessages[userId] = []
      }
      const usersPrevMessages = userPreviousMessages[userId]
      if (usersPrevMessages.length > 10) {
        usersPrevMessages.shift()
      }

      const userCtx = usersPrevMessages.join('\n')
      const message = await genRandomChannelMessage(userCtx, channelMessages.join('\n'))
      if (!message) continue
      console.log('new message', message, 'from', randomUser.name)

      channelMessages.push(message)
      userPreviousMessages[userId].push(message)

      if (channelMessages.length > 20) {
        channelMessages.shift()
      }

      //   save the message to the database
      const embedding = await createMessageEmbedding(message)
      if (!embedding) continue

      await db.insert(schema.messages).values({
        userId,
        content: message,
        channelId,
        contentEmbedding: embedding
      })
    }
  } catch (err) {
    console.error('Error seeding channel with messages:', err)
  }
}

export async function createMessageEmbedding(input: string): Promise<number[] | undefined> {
  try {
    const response = await openAIClient.embeddings.create({
      model: OPENAI_EMBEDDING_MODEL,
      input,
      dimensions: OPENAI_EMBEDDING_DIMENSIONS
    })

    return response.data[0]?.embedding
  } catch (err) {
    console.log(err)
  }
}

export async function generateSuggestedMessage(
  currentText: string,
  userMessagesCtx: string,
  channelMessagesCtx: string
): Promise<string | undefined> {
  try {
    const response = await openAIClient.chat.completions.create({
      model: OPENAI_CHAT_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant that suggests a message to the user based on their current text and previous chat history.

          Here are the previous messages from the user. Try to mimic their tone and style:
          ${userMessagesCtx}

          Here are the previous messages from the channel for context.
          ${channelMessagesCtx}

          Your response should be a single message that attempts to predict the next text that the user should write based on their current text and previous chat history. Your response is not allowed to have the current text in it, only the suggested next string of the sentence.

          Only try to finish the current sentence, do not add other sentences. Your resposne should try to answer another question or statement that is most relevant to the user's current text.

          The response should always prioritize the previous messages (try to answer them)
          -Follow up on previous messages ideally for the message with the highest similarity          `
        },
        {
          role: 'user',
          content: `${currentText}`
        }
      ]
    })

    return response.choices[0]?.message?.content || ''
  } catch (err) {
    console.log(err)
  }
}

const askProfileOutputSchema = z.object({
  response: z.string()
})

export async function generateUserProfileResponse(
  pastMessageContext: string,
  userQuery: string
): Promise<string | undefined> {
  try {
    console.log('pastMessageContext', pastMessageContext)
    console.log('userQuery', userQuery)
    const response = await openAIClient.chat.completions.create({
      model: OPENAI_CHAT_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant that helps users with their queries. You should represent your message in the same style as the user's message. 

          Your response should be a single message that attempts to answer the user's question.

          Here are the previous messages from the user:
          ${pastMessageContext}

          If there is no relevant information in the previous messages, you can say "I don't have any information about that."
          `
        },
        {
          role: 'user',
          content: `${userQuery}`
        }
      ]
    })

    return response.choices[0]?.message?.content || ''
  } catch (err) {
    console.log(err)
  }
}
