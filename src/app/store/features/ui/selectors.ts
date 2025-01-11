import { RootState } from '../../index'

export const selectCurrentTab = (state: RootState) => state.ui.currentTab
export const selectSelectedMessageId = (state: RootState) => state.ui.selectedMessageId
export const selectSelectedChannelId = (state: RootState) => state.ui.selectedChannelId
export const selectSelectedChannelName = (state: RootState) => state.ui.selectedChannelName
export const selectSelectedDMUserId = (state: RootState) => state.ui.selectedDMUserId
export const selectChannelSheetOpen = (state: RootState) => state.ui.channelSheetOpen
export const selectUIView = (state: RootState) => state.ui.uiView
export const selectMessageReplySheetOpen = (state: RootState) => state.ui.messageReplySheetOpen
export const selectSelectedParentMessageId = (state: RootState) => state.ui.selectedParentMessageId
export const selectFileUploadModalOpen = (state: RootState) => state.ui.fileUploadModalOpen
export const selectMessageAttachmentsSheetOpen = (state: RootState) =>
  state.ui.messageAttachmentsSheetOpen
export const selectConversationUser = (state: RootState) => state.ui.conversationUser
export const selectIsConversation = (state: RootState) => state.ui.isConversation
export const selectManageUserProfileSheetOpen = (state: RootState) =>
  state.ui.manageUserProfileSheetOpen
export const selectWorkspaceSearchOpen = (state: RootState) => state.ui.workspaceSearchOpen
export const selectAppSidebarOpen = (state: RootState) => state.ui.appSidebarOpen
