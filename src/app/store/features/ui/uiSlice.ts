import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { UIState, ChatTab } from './types'

const initialState: UIState = {
  currentTab: 'Messages',
  selectedPostId: null,
  selectedChannelId: null,
  selectedChannelName: null,
  selectedDMUserId: null,
  channelSheetOpen: false
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setCurrentTab: (state, action: PayloadAction<ChatTab>) => {
      state.currentTab = action.payload
    },
    setSelectedPostId: (state, action: PayloadAction<string | null>) => {
      state.selectedPostId = action.payload
    },
    setSelectedChannelId: (state, action: PayloadAction<string | null>) => {
      state.selectedChannelId = action.payload
    },
    setSelectedChannelName: (state, action: PayloadAction<string | null>) => {
      state.selectedChannelName = action.payload
    },
    setSelectedDMUserId: (state, action: PayloadAction<string | null>) => {
      state.selectedDMUserId = action.payload
    },
    // Reset all selections
    resetSelections: (state) => {
      state.selectedPostId = null
      state.selectedDMUserId = null
    },
    setChannelSheetOpen: (state, action: PayloadAction<boolean>) => {
      state.channelSheetOpen = action.payload
    }
  }
})

export const {
  setCurrentTab,
  setSelectedPostId,
  setSelectedChannelId,
  setSelectedDMUserId,
  setSelectedChannelName,
  resetSelections,
  setChannelSheetOpen
} = uiSlice.actions

export default uiSlice.reducer
