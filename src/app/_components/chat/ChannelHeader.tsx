'use client'

import Link from 'next/link'
import {
  Bell,
  Menu,
  Search,
  MessageSquare,
  FileText,
  Pin,
  Bookmark,
  MoreHorizontal
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import { useUI } from '~/app/hooks/ui/useUI'
import { type ChatTab } from '~/app/store/features/ui/types'

const headerTabs: Record<ChatTab, { icon: React.ReactNode; label: ChatTab }> = {
  Messages: { icon: <MessageSquare className="mr-2 h-4 w-4" />, label: 'Messages' },
  Files: { icon: <FileText className="mr-2 h-4 w-4" />, label: 'Files' },
  Pins: { icon: <Pin className="mr-2 h-4 w-4" />, label: 'Pins' },
  Saved: { icon: <Bookmark className="mr-2 h-4 w-4" />, label: 'Saved' }
}

export default function ChannelHeader() {
  const { currentTab, switchTab, setWorkspaceSearchOpen } = useUI()
  return (
    <header className="flex h-14 items-center gap-4 border-b border-gray-700 bg-background bg-gray-800 px-4 text-white lg:px-6">
      <Button variant="channel" size="icon" className="shrink-0">
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle navigation menu</span>
      </Button>
      <div className="flex flex-1 items-center gap-4 md:gap-6">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="channel" size="sm" className="flex items-center gap-2">
              {headerTabs[currentTab].icon} {headerTabs[currentTab].label}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[180px]">
            {Object.values(headerTabs).map((tab) => (
              <DropdownMenuItem onClick={() => switchTab(tab.label)} key={tab.label}>
                {tab.icon}
                {tab.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex items-center gap-4">
        <Button
          onClick={() => setWorkspaceSearchOpen(true)}
          variant="channel"
          size="icon"
          className="shrink-0"
        >
          <Search className="h-5 w-5" />
          <span className="sr-only">Search</span>
        </Button>
        <Button variant="channel" size="icon" className="shrink-0">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
        </Button>
      </div>
    </header>
  )
}
