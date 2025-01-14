'use client'

import { MessagesSquare, FolderOpen, Pin, Bookmark, Bot } from 'lucide-react'
import { cn } from '~/lib/utils'
import { useUI } from '~/app/hooks/ui/useUI'
import { type ChatTab } from '~/app/store/features/ui/types'
import { AvatarStack } from './AvatarStack'
import { Skeleton } from '~/components/ui/skeleton'
import { useChannelContext } from '~/app/hooks/ui/useChannelContext'
import { SidebarTrigger } from '~/components/ui/sidebar'
import { ConversationAvatar } from './ConversationAvatar'
import { Badge } from '~/components/ui/badge'
import ChannelHeader from './ChannelHeader'

type NavItemProps = {
  icon: React.ReactNode
  label: ChatTab
  isActive?: boolean
}

const TABS: NavItemProps[] = [
  { icon: <MessagesSquare className="h-4 w-4" />, label: 'Messages', isActive: true },
  { icon: <FolderOpen className="h-4 w-4" />, label: 'Files' },
  { icon: <Pin className="h-4 w-4" />, label: 'Pins' },
  { icon: <Bookmark className="h-4 w-4" />, label: 'Saved' },
  { icon: <Bot className="h-4 w-4" />, label: 'Bot' }
]

function ConversationHeader() {
  const { isConversation } = useUI()
  return (
    <>
      {isConversation && (
        <div className="mb-2 flex w-full transform rounded-lg bg-gray-900 p-2 duration-700 animate-in [--tw-enter-opacity:0.05]">
          <div className="space-y-4">
            <ConversationAvatar />
          </div>
        </div>
      )}
    </>
  )
}

function NavItem({ icon, label, isActive }: NavItemProps) {
  const { switchTab } = useUI()
  const { refetchMessages } = useChannelContext()
  return (
    <button
      onClick={async () => {
        switchTab(label)
        await new Promise((resolve) => setTimeout(resolve, 100))
        refetchMessages()
      }}
      className={cn(
        'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors',
        'hover:bg-blue-800',
        isActive ? 'bg-blue-800 text-white' : 'text-white'
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

function DisplayCurrentChannelName() {
  const { selectedChannelName, isConversation } = useUI()

  return <div></div>
}

export default function ChatTabs() {
  const { currentTab, setWorkspaceSearchOpen } = useUI()
  return <ChannelHeader />
}
