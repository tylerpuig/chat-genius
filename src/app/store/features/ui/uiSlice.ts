import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { UIState, ChatTab, UIView } from './types'
import { type ConversationUser } from '~/server/db/types'

const initialState: UIState = {
  currentTab: 'Messages',
  selectedMessageId: 0,
  selectedChannelId: 0,
  selectedChannelName: null,
  selectedDMUserId: null,
  channelSheetOpen: false,
  messageReplySheetOpen: false,
  uiView: 'channel',
  selectedParentMessageId: null,
  fileUploadModalOpen: false,
  messageAttachmentsSheetOpen: false,
  conversationUser: null,
  isConversation: false
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setCurrentTab: (state, action: PayloadAction<ChatTab>) => {
      state.currentTab = action.payload
    },
    setSelectedMessageId: (state, action: PayloadAction<number>) => {
      state.selectedMessageId = action.payload
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
      state.selectedDMUserId = null
    },
    setChannelSheetOpen: (state, action: PayloadAction<boolean>) => {
      state.channelSheetOpen = action.payload
    },
    setUIView: (state, action: PayloadAction<UIView>) => {
      state.uiView = action.payload
    },
    setMessageReplySheetOpen: (state, action: PayloadAction<boolean>) => {
      state.messageReplySheetOpen = action.payload
    },
    setSelectedParentMessageId: (state, action: PayloadAction<number | null>) => {
      state.selectedParentMessageId = action.payload
    },
    setFileUploadModalOpen: (state, action: PayloadAction<boolean>) => {
      state.fileUploadModalOpen = action.payload
    },
    setMessageAttachmentsSheetOpen: (state, action: PayloadAction<boolean>) => {
      state.messageAttachmentsSheetOpen = action.payload
    },
    setConversationUser: (state, action: PayloadAction<ConversationUser | null>) => {
      state.conversationUser = action.payload
    },
    setIsConversation: (state, action: PayloadAction<boolean>) => {
      state.isConversation = action.payload
    }
  }
})

export const {
  setCurrentTab,
  setSelectedMessageId,
  setSelectedChannelId,
  setSelectedDMUserId,
  setSelectedChannelName,
  resetSelections,
  setChannelSheetOpen,
  setUIView,
  setMessageReplySheetOpen,
  setSelectedParentMessageId,
  setFileUploadModalOpen,
  setMessageAttachmentsSheetOpen,
  setConversationUser,
  setIsConversation
} = uiSlice.actions

export default uiSlice.reducer
