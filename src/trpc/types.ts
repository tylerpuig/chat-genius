import { RouterOutputs } from './react'

export type ChatMessageData = NonNullable<
  RouterOutputs['messages']['getMessagesFromChannel']
>[number]
