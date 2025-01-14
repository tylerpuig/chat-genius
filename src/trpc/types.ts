import { RouterOutputs } from './react'

export type ChatMessageData = NonNullable<
  RouterOutputs['messages']['getMessagesFromChannel']
>['messages'][number]

export type OnlineUserList = RouterOutputs['messages']['getOnlineUsers']
export type WorkSpaceSearchResults =
  RouterOutputs['search']['getWorkspaceSearchResultsBySimilarity']
