import { RootState } from '../../index'

export const selectCurrentTab = (state: RootState) => state.ui.currentTab
export const selectSelectedPostId = (state: RootState) => state.ui.selectedPostId
export const selectSelectedChannelId = (state: RootState) => state.ui.selectedChannelId
export const selectSelectedChannelName = (state: RootState) => state.ui.selectedChannelName
export const selectSelectedDMUserId = (state: RootState) => state.ui.selectedDMUserId
