import { useSelector } from 'react-redux'
import { useAppDispatch } from '../useAppDispatch'
import {
  selectCurrentTab,
  selectSelectedPostId,
  selectSelectedChannelId,
  selectSelectedDMUserId,
  selectSelectedChannelName,
  selectChannelSheetOpen
} from '../../store/features/ui/selectors'
import {
  setCurrentTab,
  setSelectedPostId,
  setSelectedChannelId,
  setSelectedDMUserId,
  setSelectedChannelName,
  setChannelSheetOpen
} from '../../store/features/ui/uiSlice'
import type { ChatTab } from '../../store/features/ui/types'

export const useUI = () => {
  const dispatch = useAppDispatch()

  const currentTab = useSelector(selectCurrentTab)
  const selectedPostId = useSelector(selectSelectedPostId)
  const selectedChannelId = useSelector(selectSelectedChannelId)
  const selectedChannelName = useSelector(selectSelectedChannelName)
  const selectedDMUserId = useSelector(selectSelectedDMUserId)
  const channelSheetOpen = useSelector(selectChannelSheetOpen)

  return {
    // State
    currentTab,
    selectedPostId,
    selectedChannelId,
    selectedDMUserId,
    selectedChannelName,
    channelSheetOpen,

    // Actions
    switchTab: (tab: ChatTab) => dispatch(setCurrentTab(tab)),
    selectPost: (postId: string | null) => dispatch(setSelectedPostId(postId)),
    selectChannel: (channelId: string | null) => dispatch(setSelectedChannelId(channelId)),
    setSelectedChannelName: (channelName: string | null) =>
      dispatch(setSelectedChannelName(channelName)),
    selectDMUser: (userId: string | null) => dispatch(setSelectedDMUserId(userId)),
    setChannelSheetOpen: (open: boolean) => dispatch(setChannelSheetOpen(open))
  }
}
