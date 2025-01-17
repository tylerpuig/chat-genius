import { InferSelectModel, InferInsertModel } from 'drizzle-orm'
import * as schema from '~/server/db/schema'

export type ChatMessage = InferSelectModel<typeof schema.messages>
export type User = InferSelectModel<typeof schema.users>
export type ConversationUser = Omit<
  InferSelectModel<typeof schema.users>,
  'password' | 'emailVerified' | 'email' | 'userNameEmbedding'
>
export type MessageAttachmentInsertion = InferInsertModel<typeof schema.messageAttachmentsTable>
