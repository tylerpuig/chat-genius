import { RouterOutputs } from './react'

export type ChatMessageData = NonNullable<
  RouterOutputs['messages']['getMessagesFromChannel']
>[number]

export type ChatMessageReplyData = NonNullable<
  RouterOutputs['messages']['getMessageReplies']
>['replies'][number]
