export type ChatTab = 'Messages' | 'Files' | 'Pins'

export type UIState = {
  currentTab: ChatTab
  selectedPostId: string | null
  selectedChannelId: number
  selectedChannelName: string | null
  selectedDMUserId: string | null
  channelSheetOpen: boolean
}
