'use client'
import { Sidebar, SidebarContent, SidebarFooter } from '~/components/ui/sidebar'
import ChannelList from './ChannelList'
import { NavUser } from './NavUser'
import { useSession } from 'next-auth/react'

export function AppSidebar() {
  const { data: session } = useSession()
  if (!session || !session.user) return null

  return (
    <Sidebar className="border-gray-800 bg-gray-900">
      <SidebarContent className="!scrollbar-overlay !h-full !overflow-y-auto !overflow-x-hidden bg-gray-900">
        <div className="h-screen text-gray-100">
          <div className="p-4">
            <ChannelList />
          </div>
        </div>
      </SidebarContent>
      <SidebarFooter className="!bg-gray-900">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
