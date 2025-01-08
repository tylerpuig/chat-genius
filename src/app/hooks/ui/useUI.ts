import { useSelector } from 'react-redux'
import { useAppDispatch } from '../useAppDispatch'
import {
  selectCurrentTab,
  selectSelectedPostId,
  selectSelectedChannelId,
  selectSelectedDMUserId,
  selectSelectedChannelName,
  selectChannelSheetOpen,
  selectUIView
} from '../../store/features/ui/selectors'
import {
  setCurrentTab,
  setSelectedPostId,
  setSelectedChannelId,
  setSelectedDMUserId,
  setSelectedChannelName,
  setChannelSheetOpen,
  setUIView
} from '../../store/features/ui/uiSlice'
import type { ChatTab, UIView } from '../../store/features/ui/types'

export const useUI = () => {
  const dispatch = useAppDispatch()

  const currentTab = useSelector(selectCurrentTab)
  const selectedPostId = useSelector(selectSelectedPostId)
  const selectedChannelId = useSelector(selectSelectedChannelId)
  const selectedChannelName = useSelector(selectSelectedChannelName)
  const selectedDMUserId = useSelector(selectSelectedDMUserId)
  const channelSheetOpen = useSelector(selectChannelSheetOpen)
  const uiView = useSelector(selectUIView)

  return {
    // State
    currentTab,
    selectedPostId,
    selectedChannelId,
    selectedDMUserId,
    selectedChannelName,
    channelSheetOpen,
    uiView,

    // Actions
    switchTab: (tab: ChatTab) => dispatch(setCurrentTab(tab)),
    selectPost: (postId: string | null) => dispatch(setSelectedPostId(postId)),
    setSelectedChannelId: (channelId: number) => dispatch(setSelectedChannelId(channelId)),
    setSelectedChannelName: (channelName: string | null) =>
      dispatch(setSelectedChannelName(channelName)),
    selectDMUser: (userId: string | null) => dispatch(setSelectedDMUserId(userId)),
    setChannelSheetOpen: (open: boolean) => dispatch(setChannelSheetOpen(open)),
    setUIView: (view: UIView) => dispatch(setUIView(view))
  }
}
