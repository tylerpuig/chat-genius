import { InferSelectModel, InferInsertModel } from 'drizzle-orm'
import * as schema from '~/server/db/schema'

export type ChatMessage = InferSelectModel<typeof schema.messages>
