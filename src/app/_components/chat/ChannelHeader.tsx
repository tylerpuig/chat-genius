'use client'

import { Bell, Search, MessageSquare, FileText, Pin, Bookmark, Bot } from 'lucide-react'
import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import { useUI } from '~/app/hooks/ui/useUI'
import { type ChatTab } from '~/app/store/features/ui/types'
import { SidebarTrigger } from '~/components/ui/sidebar'

const headerTabs: Record<ChatTab, { icon: React.ReactNode; label: ChatTab }> = {
  Messages: { icon: <MessageSquare className="mr-2 h-4 w-4" />, label: 'Messages' },
  Files: { icon: <FileText className="mr-2 h-4 w-4" />, label: 'Files' },
  Pins: { icon: <Pin className="mr-2 h-4 w-4" />, label: 'Pins' },
  Saved: { icon: <Bookmark className="mr-2 h-4 w-4" />, label: 'Saved' },
  Bot: { icon: <Bot className="mr-2 h-4 w-4" />, label: 'Bot' }
}

export default function ChannelHeader() {
  const { currentTab, switchTab, setWorkspaceSearchOpen } = useUI()

  return (
    <header className="sticky top-0 flex h-14 items-center gap-4 border-b border-gray-700 bg-background bg-gray-800 px-4 text-white lg:px-6">
      <SidebarTrigger className="shrink-0" variant="channel">
        {/* <Button variant="channel" size="icon" className="shrink-0">
          <ArrowLeftFromLine className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button> */}
      </SidebarTrigger>
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
