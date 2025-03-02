export type ChatTab = 'Messages' | 'Files' | 'Pins' | 'Saved' | 'Bot'
export type UIView = 'channel' | 'conversation'
import { type ConversationUser } from '~/server/db/types'

export type UserProfileChatConfig = {
  userId: string
  sheetOpen: boolean
}

export type UserAgentChatConfig = {
  agentId: string
  toUserId: string
  dialogOpen: boolean
}

export type UserVoiceChatConfig = {
  toUserId: string
  dialogOpen: boolean
}

export type UIState = {
  currentTab: ChatTab
  selectedMessageId: number
  selectedChannelId: number
  selectedChannelName: string | null
  selectedDMUserId: string | null
  channelSheetOpen: boolean
  messageReplySheetOpen: boolean
  uiView: UIView
  selectedParentMessageId: number | null
  fileUploadModalOpen: boolean
  messageAttachmentsSheetOpen: boolean
  conversationUser: ConversationUser | null
  isConversation: boolean
  manageUserProfileSheetOpen: boolean
  workspaceSearchOpen: boolean
  appSidebarOpen: boolean
  userProfileChatConfig: UserProfileChatConfig
  chatSummaryOpen: boolean
  userAgentChatConfig: UserAgentChatConfig
  userVoiceChatConfig: UserVoiceChatConfig
  userAvatarEditorOpen: boolean
}
