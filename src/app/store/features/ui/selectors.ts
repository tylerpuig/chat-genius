import { RootState } from '../../index'

export const selectCurrentTab = (state: RootState) => state.ui.currentTab
export const selectSelectedPostId = (state: RootState) => state.ui.selectedPostId
export const selectSelectedChannelId = (state: RootState) => state.ui.selectedChannelId
export const selectSelectedChannelName = (state: RootState) => state.ui.selectedChannelName
export const selectSelectedDMUserId = (state: RootState) => state.ui.selectedDMUserId
export const selectChannelSheetOpen = (state: RootState) => state.ui.channelSheetOpen
export const selectUIView = (state: RootState) => state.ui.uiView
export const selectMessageReplySheetOpen = (state: RootState) => state.ui.messageReplySheetOpen
export const selectSelectedParentMessageId = (state: RootState) => state.ui.selectedParentMessageId
