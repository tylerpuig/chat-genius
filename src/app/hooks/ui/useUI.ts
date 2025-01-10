import { useSelector } from 'react-redux'
import { useAppDispatch } from '../useAppDispatch'
import * as uiSelectors from '../../store/features/ui/selectors'
import * as uiSlice from '../../store/features/ui/uiSlice'
import type { ChatTab, UIView } from '../../store/features/ui/types'
import { type ConversationUser } from '~/server/db/types'

export const useUI = () => {
  const dispatch = useAppDispatch()

  const currentTab = useSelector(uiSelectors.selectCurrentTab)
  const selectedMessageId = useSelector(uiSelectors.selectSelectedMessageId)
  const selectedChannelId = useSelector(uiSelectors.selectSelectedChannelId)
  const selectedChannelName = useSelector(uiSelectors.selectSelectedChannelName)
  const selectedDMUserId = useSelector(uiSelectors.selectSelectedDMUserId)
  const channelSheetOpen = useSelector(uiSelectors.selectChannelSheetOpen)
  const uiView = useSelector(uiSelectors.selectUIView)
  const messageReplySheetOpen = useSelector(uiSelectors.selectMessageReplySheetOpen)
  const selectedParentMessageId = useSelector(uiSelectors.selectSelectedParentMessageId)
  const fileUploadModalOpen = useSelector(uiSelectors.selectFileUploadModalOpen)
  const messageAttachmentsSheetOpen = useSelector(uiSelectors.selectMessageAttachmentsSheetOpen)
  const conversationUser = useSelector(uiSelectors.selectConversationUser)
  const isConversation = useSelector(uiSelectors.selectIsConversation)
  const manageUserProfileSheetOpen = useSelector(uiSelectors.selectManageUserProfileSheetOpen)

  return {
    // State
    currentTab,
    selectedMessageId,
    selectedChannelId,
    selectedDMUserId,
    selectedChannelName,
    channelSheetOpen,
    uiView,
    messageReplySheetOpen,
    selectedParentMessageId,
    fileUploadModalOpen,
    messageAttachmentsSheetOpen,
    conversationUser,
    isConversation,
    manageUserProfileSheetOpen,

    // Actions
    switchTab: (tab: ChatTab) => dispatch(uiSlice.setCurrentTab(tab)),
    setSelectedMessageId: (messageId: number) => dispatch(uiSlice.setSelectedMessageId(messageId)),
    setSelectedChannelId: (channelId: number) => dispatch(uiSlice.setSelectedChannelId(channelId)),
    setSelectedChannelName: (channelName: string | null) =>
      dispatch(uiSlice.setSelectedChannelName(channelName)),
    selectDMUser: (userId: string | null) => dispatch(uiSlice.setSelectedDMUserId(userId)),
    setChannelSheetOpen: (open: boolean) => dispatch(uiSlice.setChannelSheetOpen(open)),
    setUIView: (view: UIView) => dispatch(uiSlice.setUIView(view)),
    setMessageReplySheetOpen: (open: boolean) => dispatch(uiSlice.setMessageReplySheetOpen(open)),
    setSelectedParentMessageId: (messageId: number | null) =>
      dispatch(uiSlice.setSelectedParentMessageId(messageId)),
    setFileUploadModalOpen: (open: boolean) => dispatch(uiSlice.setFileUploadModalOpen(open)),
    setMessageAttachmentsSheetOpen: (open: boolean) =>
      dispatch(uiSlice.setMessageAttachmentsSheetOpen(open)),
    setConversationUser: (user: ConversationUser | null) =>
      dispatch(uiSlice.setConversationUser(user)),
    setIsConversation: (isConversation: boolean) =>
      dispatch(uiSlice.setIsConversation(isConversation)),
    setManageUserProfileSheetOpen: (open: boolean) =>
      dispatch(uiSlice.setManageUserProfileSheetOpen(open))
  }
}
