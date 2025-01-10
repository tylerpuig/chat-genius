export type ChatTab = 'Messages' | 'Files' | 'Pins' | 'Saved'
export type UIView = 'channel' | 'conversation'

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
}
