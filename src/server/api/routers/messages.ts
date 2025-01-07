import { z } from 'zod'
import EventEmitter, { on } from 'events'
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'
import { eq, and, or, ne, sql } from 'drizzle-orm'
import * as schema from '~/server/db/schema'
import { env } from '~/env'
import { Pool, type PoolClient } from 'pg'
import { observable } from '@trpc/server/observable'

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
let listenerClient: PoolClient | null = null
// Initialize the Postgres listener
async function initializePostgresListener() {
  if (postgresInitialized) return

  // Use a single client for all listeners
  listenerClient = await pool.connect()

  try {
    // Listen for all message notifications
    await listenerClient.query('LISTEN new_message')
    await listenerClient.query('LISTEN message_reaction')

    listenerClient.on('notification', (msg: { channel?: string; payload?: string }) => {
      if (!msg.payload) return
      console.log(msg)

      const payload = JSON.parse(msg.payload)

      // Route different notifications to different events
      switch (msg.channel) {
        case 'new_message':
          ee.emit('newMessage', payload as PostgresChatNotification)
          break
        case 'message_reaction':
          if (payload.type === 'INSERT') {
            ee.emit('reactionAdded', payload)
          } else if (payload.type === 'DELETE') {
            ee.emit('reactionRemoved', payload)
          }
          break
      }
    })

    console.log('PostgreSQL listeners initialized')
  } catch (err) {
    console.error('Error setting up PostgreSQL listeners:', err)
    listenerClient.release()
  }
}

export const messagesRouter = createTRPCRouter({
  onMessage: protectedProcedure
    .input(
      z.object({
        channelId: z.number()
      })
    )
    .subscription(async function* ({ signal }) {
      // return observable<PostgresChatNotification>((emit) => {
      //   const newMessageHandler = (data: PostgresChatNotification) => {
      //     emit.next(data)
      //   }

      //   const reactionAddedHandler = (data: any) => {
      //     console.log('Reaction added', data)
      //     emit.next(data)
      //   }

      //   const reactionRemovedHandler = (data: any) => {
      //     console.log('Reaction removed', data)
      //     emit.next(data)
      //   }

      //   // Subscribe to all events
      //   ee.on('newMessage', newMessageHandler)
      //   ee.on('reactionAdded', reactionAddedHandler)
      //   ee.on('reactionRemoved', reactionRemovedHandler)

      //   // Cleanup function
      //   return () => {
      //     ee.off('newMessage', newMessageHandler)
      //     ee.off('reactionAdded', reactionAddedHandler)
      //     ee.off('reactionRemoved', reactionRemovedHandler)
      //   }
      // })
      // AsyncIterator for the new message events
      for await (const [data] of on(ee, 'newMessage', {
        signal: signal
      })) {
        const newMessage = data as PostgresChatNotification
        yield newMessage
      }
      // for await (const [data] of on(ee, 'reactionAdded', {
      //   signal: signal
      // })) {
      //   console.log('Reaction added', data)
      //   const newMessage = data as PostgresChatNotification
      //   yield newMessage
      // }
      // for await (const [data] of on(ee, 'reactionRemoved', {
      //   signal: signal
      // })) {
      //   console.log('Reaction removed', data)
      //   const newMessage = data as PostgresChatNotification
      //   yield newMessage
      // }
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
      const messages = await ctx.db.query.messages.findMany({
        where: eq(schema.messages.channelId, channelId),
        with: {
          user: true,
          reactions: true
        }
      })
      return messages
    }),
  createMessageReaction: protectedProcedure
    .input(
      z.object({
        messageId: z.number(),
        emoji: z.string()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const newReaction = await ctx.db
        .insert(schema.messageReactions)
        .values({ messageId: input.messageId, emoji: input.emoji, userId: ctx.session.user.id })
        .returning()

      return newReaction
    }),
  removeMessageReaction: protectedProcedure
    .input(
      z.object({
        messageId: z.number(),
        emoji: z.string()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const deletedReaction = await ctx.db
        .delete(schema.messageReactions)
        .where(
          and(
            eq(schema.messageReactions.messageId, input.messageId),
            eq(schema.messageReactions.emoji, input.emoji)
          )
        )

      return deletedReaction
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

        if (userIds.length) {
          // Add other users as channel members
          await tx.insert(schema.channelMembers).values(
            userIds.map((userId) => ({
              channelId: newChannel.id,
              userId: userId,
              isAdmin: false
            }))
          )
        }

        return newChannel
      })
    }),
  getOnlineUsers: protectedProcedure.query(async ({ ctx }) => {
    const onlineUsers = await ctx.db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        avatar: schema.users.image
      })
      .from(schema.users)
      .where(ne(schema.users.id, ctx.session.user.id))

    return onlineUsers
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
  }),
  getUsersInChannel: protectedProcedure
    .input(z.object({ channelId: z.number() }))
    .query(async ({ ctx, input }) => {
      const channelInfo = await ctx.db.query.channels
        .findFirst({
          where: eq(schema.channels.id, input.channelId)
        })
        .execute()

      if (!channelInfo) {
        return []
      }

      if (channelInfo.isPrivate) {
        const members = await ctx.db
          .select({
            image: schema.users.image,
            name: schema.users.name
          })
          .from(schema.channelMembers)
          .where(eq(schema.channelMembers.channelId, input.channelId))
          .leftJoin(schema.users, eq(schema.channelMembers.userId, schema.users.id))

        return members
      }

      // If the channel is public, return all users
      const users = await ctx.db
        .select({
          image: schema.users.image,
          name: schema.users.name
        })
        .from(schema.users)

      return users
    })
})

// Initialize the PostgreSQL trigger
async function initializePostgresTrigger() {
  const client = await pool.connect()
  try {
    // Create notification trigger
    await client.query(`
      CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS trigger AS $$
DECLARE
    channel_members_cursor CURSOR FOR
        SELECT cm.user_id
        FROM channel_member cm
        WHERE cm.channel_id = NEW.channel_id;
    member_user_id varchar(255);
    message_data json;
BEGIN
    -- Construct the message data
    message_data := json_build_object(
        'id', NEW.id,
        'content', NEW.content,
        'channelId', NEW.channel_id,
        'userId', NEW.user_id,
        'createdAt', NEW.created_at
    );

    -- Notify each channel member
    OPEN channel_members_cursor;
    LOOP
        FETCH channel_members_cursor INTO member_user_id;
        EXIT WHEN NOT FOUND;

        -- Don't notify the sender
        IF member_user_id != NEW.user_id THEN
            PERFORM pg_notify(
                'new_message_' || member_user_id,
                message_data::text
            );
        END IF;
    END LOOP;
    CLOSE channel_members_cursor;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER message_inserted
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
  try {
    await initializePostgresListener()
    // await initializeReactionListener()
  } catch (err) {
    console.error('Error initializing PostgreSQL listener:', err)
  } finally {
    postgresInitialized = true
  }
}
initializeMessaging()
