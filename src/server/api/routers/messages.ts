import { z } from 'zod'
import EventEmitter, { on } from 'events'
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { eq, and, or, ne } from 'drizzle-orm'
import * as schema from '~/server/db/schema'
import { env } from '~/env'
import { Pool } from 'pg'

// PostgreSQL pool
const pool = new Pool({
  connectionString: env.DATABASE_URL
})

// Event emitter to bridge Postgres notifications to tRPC
const ee = new EventEmitter()

type PostgresChatNotification = {
  id: number
  content: string
  channelId: number
  userId: string
  createdAt: Date
}

let postgresInitialized = false
// Initialize the Postgres listener
async function initializePostgresListener() {
  if (postgresInitialized) return
  const client = await pool.connect()
  try {
    await client.query('LISTEN new_message')

    client.on('notification', (msg: { payload?: string }) => {
      console.log(msg)
      if (msg.payload) {
        const payload = JSON.parse(msg.payload)
        ee.emit('newMessage', payload)
      }
    })

    console.log('PostgreSQL listener initialized')
  } catch (err) {
    console.error('Error setting up PostgreSQL listener:', err)
    client.release()
  }
}

export const messagesRouter = createTRPCRouter({
  onMessage: protectedProcedure
    .input(
      z.object({
        channelId: z.number()
      })
    )
    .subscription(async function* ({ input, ctx, signal }) {
      // AsyncIterator for the new message events

      for await (const [data] of on(ee, 'newMessage', {
        signal: signal
      })) {
        const newMessage = data as PostgresChatNotification
        yield newMessage
      }
    }),
  sendMessage: protectedProcedure
    .input(z.object({ userId: z.string(), content: z.string(), channelId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const { userId, content, channelId } = input
      const newMessage = await ctx.db
        .insert(schema.messages)
        .values({
          userId,
          content,
          channelId
        })
        .returning()
      return newMessage
    }),
  getMessagesFromChannel: protectedProcedure
    .input(z.object({ channelId: z.number() }))
    .query(async ({ input, ctx }) => {
      const { channelId } = input
      const messages = await ctx.db
        .select({
          id: schema.messages.id,
          content: schema.messages.content,
          createdAt: schema.messages.createdAt,
          user: {
            name: schema.users.name,
            avatar: schema.users.image
          }
        })
        .from(schema.messages)
        .leftJoin(schema.users, eq(schema.messages.userId, schema.users.id))
        .where(eq(schema.messages.channelId, channelId))
      return messages
    }),
  createChannel: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string(),
        userId: z.string(),
        isPrivate: z.boolean(),
        userIds: z.array(z.string())
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { name, description, userId, isPrivate, userIds } = input

      return await ctx.db.transaction(async (tx) => {
        const [newChannel] = await tx
          .insert(schema.channels)
          .values({ name, createdById: userId, description, isPrivate })
          .returning()
        if (!newChannel) {
          throw new Error('Failed to create channel')
        }

        // Add creator as channel member and admin
        await tx.insert(schema.channelMembers).values({
          channelId: newChannel.id,
          userId: userId,
          isAdmin: true // Creator should probably be an admin
        })

        // Add other users as channel members
        await tx.insert(schema.channelMembers).values(
          userIds.map((userId) => ({
            channelId: newChannel.id,
            userId: userId,
            isAdmin: false
          }))
        )

        return newChannel
      })
    }),
  getChannels: protectedProcedure.query(async ({ ctx }) => {
    const userChannels = await ctx.db
      .select({
        id: schema.channels.id,
        name: schema.channels.name,
        description: schema.channels.description,
        isPrivate: schema.channels.isPrivate,
        createdAt: schema.channels.createdAt,
        // Use a left join to get isAdmin, which might be null for public channels
        isAdmin: schema.channelMembers.isAdmin
      })
      .from(schema.channels)
      .leftJoin(
        schema.channelMembers,
        and(
          eq(schema.channels.id, schema.channelMembers.channelId),
          eq(schema.channelMembers.userId, ctx.session.user.id)
        )
      )
      .where(
        or(
          // Include channel if it's public
          eq(schema.channels.isPrivate, false),
          // OR if user is a member (for private channels)
          eq(schema.channelMembers.userId, ctx.session.user.id)
        )
      )

    return userChannels
  }),
  getUsers: protectedProcedure.query(async ({ ctx }) => {
    const users = await ctx.db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        avatar: schema.users.image
      })
      .from(schema.users)
      .where(ne(schema.users.id, ctx.session.user.id))

    return users
  })
})

// Initialize the PostgreSQL trigger
async function initializePostgresTrigger() {
  const client = await pool.connect()
  try {
    // Create notification trigger
    await client.query(`
      CREATE OR REPLACE FUNCTION notify_new_message() RETURNS TRIGGER AS $$
      BEGIN
        PERFORM pg_notify(
          'new_message',
          json_build_object(
            'id', NEW.id,
            'content', NEW.content,
            'channelId', NEW.channel_id,
            'userId', NEW.user_id,
            'createdAt', NEW.created_at
          )::text
        );
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS message_notify_trigger ON message;
      
      CREATE TRIGGER message_notify_trigger
        AFTER INSERT ON message
        FOR EACH ROW
        EXECUTE FUNCTION notify_new_message();
    `)

    console.log('PostgreSQL trigger initialized')
  } finally {
    client.release()
  }
}

// Initialize everything
export async function initializeMessaging() {
  // await initializePostgresTrigger()
  await initializePostgresListener()
}
initializeMessaging()
