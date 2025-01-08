'use client'

import { MessagesSquare, FolderOpen, Pin, LogOut } from 'lucide-react'
import { cn } from '~/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { signOut } from 'next-auth/react'
import { useUI } from '~/app/hooks/ui/useUI'
import { type ChatTab } from '~/app/store/features/ui/types'
import { AvatarStack } from './AvatarStack'
import { Skeleton } from '~/components/ui/skeleton'

type NavItemProps = {
  icon: React.ReactNode
  label: ChatTab
  isActive?: boolean
}

const TABS: NavItemProps[] = [
  { icon: <MessagesSquare className="h-4 w-4" />, label: 'Messages', isActive: true },
  { icon: <FolderOpen className="h-4 w-4" />, label: 'Files' },
  { icon: <Pin className="h-4 w-4" />, label: 'Pins' }
]

function NavItem({ icon, label, isActive }: NavItemProps) {
  const { switchTab } = useUI()
  return (
    <button
      onClick={() => switchTab(label)}
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
  const { selectedChannelName } = useUI()

  return (
    <>
      {!selectedChannelName ? (
        <>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            {'# '} <Skeleton className="h-4 w-16" />
          </h2>
        </>
      ) : (
        <h2 className="text-lg font-semibold text-white">{'# ' + (selectedChannelName || '')}</h2>
      )}
    </>
  )
}

export default function ChatTabs() {
  const { currentTab, selectedChannelName } = useUI()
  return (
    <div className="flex flex-col gap-1 bg-gray-900/40 p-2">
      <div className="flex items-center justify-between px-3 py-2">
        <DisplayCurrentChannelName />
        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none">
            <Avatar className="h-8 w-8 border border-blue-600/50 hover:border-blue-500">
              {/* <AvatarImage src="/placeholder.svg" /> */}
              <AvatarFallback className="bg-blue-950 text-blue-200">AI</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 border-gray-800 bg-gray-900">
            <DropdownMenuItem
              className="cursor-pointer text-white focus:bg-blue-800 focus:text-white"
              onClick={async () => {
                await signOut()
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="-mb-[2px] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {TABS.map((tab) => (
            <NavItem
              key={tab.label}
              icon={tab.icon}
              label={tab.label}
              isActive={tab.label === currentTab}
            />
          ))}
        </div>

        <AvatarStack />
      </div>
    </div>
  )
}
