import { relations, sql } from 'drizzle-orm'
import { boolean } from 'drizzle-orm/pg-core'
import {
  index,
  integer,
  pgTableCreator,
  primaryKey,
  text,
  timestamp,
  varchar,
  pgTable
} from 'drizzle-orm/pg-core'
import { type AdapterAccount } from 'next-auth/adapters'

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
// export const pgTable = pgTableCreator((name) => `chat-genius_${name}`)

export const users = pgTable('user', {
  id: varchar('id', { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull(),
  password: varchar('password', { length: 255 }),
  emailVerified: timestamp('email_verified', {
    mode: 'date',
    withTimezone: true
  }).default(sql`CURRENT_TIMESTAMP`),
  image: varchar('image', { length: 2048 })
})

export const channels = pgTable(
  'channel',
  {
    id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
    name: varchar('name', { length: 256 }).notNull(),
    description: text('description'),
    isPrivate: boolean('is_private').default(false).notNull(),
    isConversation: boolean('is_conversation').default(false).notNull(),
    createdById: varchar('created_by', { length: 255 })
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).$onUpdate(() => new Date())
  },
  (channel) => [
    index('channel_created_by_idx').on(channel.createdById),
    index('channel_name_idx').on(channel.name)
  ]
)

export const conversationsTable = pgTable(
  'conversation',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    user1Id: varchar('user1_id', { length: 255 })
      .notNull()
      .references(() => users.id),
    user2Id: varchar('user2_id', { length: 255 })
      .notNull()
      .references(() => users.id),
    channelId: integer('channel_id'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).$onUpdate(() => new Date())
  },
  (conversation) => [
    // Index for finding conversations for a specific user
    index('conversation_user1_idx').on(conversation.user1Id),
    index('conversation_user2_idx').on(conversation.user2Id)
  ]
)

// Add relation to existing users table
export const usersRelations = relations(users, ({ many }) => ({
  channels: many(channelMembers),
  messages: many(messages),
  accounts: many(accounts),
  conversations: many(conversationsTable)
  // sentPrivateMessages: many(privateMessages, { relationName: 'fromUser' }),
  // receivedPrivateMessages: many(privateMessages, { relationName: 'toUser' })
}))

// export const usersRelations = relations(users, ({ many }) => ({}));

export const accounts = pgTable(
  'account',
  {
    userId: varchar('user_id', { length: 255 })
      .notNull()
      .references(() => users.id),
    type: varchar('type', { length: 255 }).$type<AdapterAccount['type']>().notNull(),
    provider: varchar('provider', { length: 255 }).notNull(),
    providerAccountId: varchar('provider_account_id', {
      length: 255
    }).notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: varchar('token_type', { length: 255 }),
    scope: varchar('scope', { length: 255 }),
    id_token: text('id_token'),
    session_state: varchar('session_state', { length: 255 })
  },
  (account) => [
    primaryKey({
      columns: [account.provider, account.providerAccountId]
    }),
    index('account_user_id_idx').on(account.userId)
  ]
)

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] })
}))

export const sessions = pgTable(
  'session',
  {
    sessionToken: varchar('session_token', { length: 255 }).notNull().primaryKey(),
    userId: varchar('user_id', { length: 255 })
      .notNull()
      .references(() => users.id),
    expires: timestamp('expires', {
      mode: 'date',
      withTimezone: true
    }).notNull()
  },
  (session) => [index('session_user_id_idx').on(session.userId)]
)

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] })
}))

export const verificationTokens = pgTable(
  'verification_token',
  {
    identifier: varchar('identifier', { length: 255 }).notNull(),
    token: varchar('token', { length: 255 }).notNull(),
    expires: timestamp('expires', {
      mode: 'date',
      withTimezone: true
    }).notNull()
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
)

export const messages = pgTable(
  'message',
  {
    id: integer('id').unique().primaryKey().generatedAlwaysAsIdentity(),
    content: text('content').notNull(),
    channelId: integer('channel_id')
      .notNull()
      .references(() => channels.id),
    userId: varchar('user_id', { length: 255 })
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).$onUpdate(() => new Date())
  },
  (message) => [
    index('message_channel_id_idx').on(message.channelId),
    index('message_user_id_idx').on(message.userId)
  ]
)

export const channelMembers = pgTable(
  'channel_member',
  {
    channelId: integer('channel_id')
      .notNull()
      .references(() => channels.id),
    userId: varchar('user_id', { length: 255 })
      .notNull()
      .references(() => users.id),
    isAdmin: boolean('is_admin').default(false).notNull(),
    joinedAt: timestamp('joined_at', { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull()
  },
  (member) => [
    primaryKey({ columns: [member.channelId, member.userId] }),
    index('channel_member_channel_id_idx').on(member.channelId),
    index('channel_member_user_id_idx').on(member.userId)
  ]
)

// Relations
export const channelsRelations = relations(channels, ({ many, one }) => ({
  members: many(channelMembers),
  messages: many(messages),
  creator: one(users, {
    fields: [channels.createdById],
    references: [users.id]
  }),
  reactions: many(messageReactions)
}))

export const messagesRelations = relations(messages, ({ one, many }) => ({
  channel: one(channels, {
    fields: [messages.channelId],
    references: [channels.id]
  }),
  user: one(users, { fields: [messages.userId], references: [users.id] }),
  reactions: many(messageReactions)
}))

export const channelMembersRelations = relations(channelMembers, ({ one, many }) => ({
  channel: one(channels, {
    fields: [channelMembers.channelId],
    references: [channels.id]
  }),
  user: one(users, { fields: [channelMembers.userId], references: [users.id] }),
  reactions: many(messageReactions) // Add the reactions relation
}))

export const messageReactions = pgTable(
  'message_reaction',
  {
    messageId: integer('message_id')
      .notNull()
      .references(() => messages.id, { onDelete: 'cascade' }),
    userId: varchar('user_id', { length: 255 })
      .notNull()
      .references(() => users.id),
    emoji: varchar('emoji', { length: 32 }).notNull()
  },
  (reaction) => [
    primaryKey({ columns: [reaction.messageId, reaction.userId, reaction.emoji] }),
    index('message_reaction_message_emoji_idx').on(reaction.messageId, reaction.emoji)
  ]
)

export const messageReactionsRelations = relations(messageReactions, ({ one }) => ({
  message: one(messages, {
    fields: [messageReactions.messageId],
    references: [messages.id]
  }),
  user: one(users, {
    fields: [messageReactions.userId],
    references: [users.id]
  })
}))
