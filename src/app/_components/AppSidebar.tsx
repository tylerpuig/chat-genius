import { Sidebar, SidebarContent, SidebarFooter } from '~/components/ui/sidebar'
import ChannelList from './ChannelList'
import { NavUser } from './NavUser'

export function AppSidebar() {
  return (
    <Sidebar className="border-gray-800 bg-gray-900">
      <SidebarContent className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-700 !h-full !overflow-y-auto !overflow-x-hidden bg-gray-900">
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
