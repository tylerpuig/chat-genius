import OpenAI from 'openai'
import { db } from '~/server/db'
import { eq } from 'drizzle-orm'
import * as schema from '~/server/db/schema'
import { z } from 'zod'
import { zodResponseFormat } from 'openai/helpers/zod'
import { ee } from '~/server/api/routers/messages'

const OPENAI_EMBEDDING_MODEL = 'text-embedding-3-large'
const OPENAI_CHAT_MODEL = 'gpt-4o-mini-2024-07-18'
const OPENAI_EMBEDDING_DIMENSIONS = 1536
const openAIClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function createMessageTextEmbedding(
  messageId: number,
  text: string
): Promise<number[] | undefined> {
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

    return response.data[0]?.embedding
  } catch (err) {
    console.error('Error creating message text embedding:', err)
  }
}

async function genRandomChannelMessage(
  userCtx: string,
  messagesCtx: string,
  userStatus: string
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
- Only be around 20 - 50 words. If the previous user's message was longer, this response should be longer, and vice versa
- Be relevant to the ongoing discussion
- Include specific details or numbers when appropriate
- Reflect the speaker's role
- Maintain a conversational tone
- Occasionally ask questions or request input from others
- Sometimes reference specific financial metrics, tools, or processes
- Don't put any placeholders
- It's important that there's a diversity of messages, so don't just follow the same format as the previous messages, unless explicitly asked to do so
- You can use emojis if that fits the user style
- Make your response a mixture of questions and discoveries (e.g., "What's the current trend in the market?" or "I just finished the report for Q2") based on previous messages of the user
- If the previous message has an emoji, don't include it in your response
- COME UP WITH DIFFERENT INTROS instead of HEY TEAM. YOU DON'T ALWAYS NEED AN INTRO
- IF YOUR PRVIOUS MESSAGE HAS A QUESTION AT THE END, DO NOT ASK A QUESTION AT THE END OF YOUR RESPONSE

- Here are the previous messages from the user:
${userCtx}

If you don't see any previous messages, create a new "style" for the user by differentiating them from the rest of the users. For example, you can use emojis or different colors to differentiate the user. Don't use too many emojis if other messages have emojis.

Here are the previous messages from the channel:
${messagesCtx}

    `
        }
      ]
    })

    //     -Form your response in the same style as the user's message.
    // -The user's status is: ${userStatus}

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
        id: true,
        userStatus: true
      }
    })
    return users
  } catch (err) {
    console.error('Error getting all users:', err)
  }
}

export async function seedChannelWithMessages(iterations: number): Promise<void> {
  const channelId = 2

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
      const message = await genRandomChannelMessage(
        userCtx,
        channelMessages.join('\n'),
        randomUser.userStatus!
      )
      if (!message) continue
      console.log('new message', message, 'from', randomUser.name)

      channelMessages.push(message)
      userPreviousMessages[userId].push(message)

      if (channelMessages.length > 30) {
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

      const subscriptionMessage = {
        id: 1,
        channelId,
        userId: '',
        type: 'NEW_MESSAGE'
      }

      ee.emit('newMessage', subscriptionMessage)
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
      ],
      prediction: {
        type: 'content',
        content: currentText
      }
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
    // console.log('pastMessageContext', pastMessageContext)
    // console.log('userQuery', userQuery)
    const response = await openAIClient.beta.chat.completions.parse({
      model: OPENAI_CHAT_MODEL,
      messages: [
        {
          role: 'system',
          content: `
          You are an AI agent that is representing a user. You should represent your message in the same style as the user's message.

          ${pastMessageContext}

          Your response should be a single message that attempts to answer the user's question.

          You are allowed to "make up" information that is not in the previous messages exactly, but it has to be relevant to the user's question.

          Your answer should depend on the context of the previous messages from the user. If there is no relevant information in the previous messages, you can say "I don't have any information about that."          
          `
        },
        {
          role: 'user',
          content: `${userQuery}`
        }
      ],
      response_format: zodResponseFormat(askProfileOutputSchema, 'response')
    })

    return response.choices[0]?.message.parsed?.response || ''
  } catch (err) {
    console.log(err)
  }
}

const askUserStatusOutputSchema = z.object({
  response: z.string()
})

export async function generateRandomUserStatus(): Promise<string | undefined> {
  try {
    const response = await openAIClient.beta.chat.completions.parse({
      model: OPENAI_CHAT_MODEL,
      temperature: 1.0,
      top_p: 0.9,
      messages: [
        {
          role: 'user',
          content: `Generate me a random status message for a social media app. This will be for other to see. Must be under 200 characters.`
        }
      ],
      response_format: zodResponseFormat(askUserStatusOutputSchema, 'response')
    })

    return response.choices[0]?.message.parsed?.response || ''
  } catch (err) {
    console.log(err)
  }
}

export async function generateEmbeddingFromText(
  text: string,
  dimensions: number
): Promise<number[] | undefined> {
  try {
    const response = await openAIClient.embeddings.create({
      model: OPENAI_EMBEDDING_MODEL,
      input: text,
      dimensions: dimensions
    })

    return response.data[0]?.embedding
  } catch (err) {
    console.log(err)
  }
}
