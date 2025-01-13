import dotenv from 'dotenv'
import OpenAI from 'openai'

dotenv.config({
  path: '../.env'
})

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

async function main() {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini-2024-07-18',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant.'
        },
        {
          role: 'user',
          content: 'Say this is a test'
        }
      ]
    })
    console.log(response.choices[0]?.message?.content)
  } catch (err) {
    console.log(err)
  }
}

// main()
