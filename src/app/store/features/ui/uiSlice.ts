import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { UIState, ChatTab, UIView } from './types'

const initialState: UIState = {
  currentTab: 'Messages',
  selectedPostId: null,
  selectedChannelId: 0,
  selectedChannelName: null,
  selectedDMUserId: null,
  channelSheetOpen: false,
  uiView: 'channel'
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
    setSelectedChannelId: (state, action: PayloadAction<number>) => {
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
    },
    setUIView: (state, action: PayloadAction<UIView>) => {
      state.uiView = action.payload
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
  setChannelSheetOpen,
  setUIView
} = uiSlice.actions

export default uiSlice.reducer
