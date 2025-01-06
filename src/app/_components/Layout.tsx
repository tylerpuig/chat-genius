import React from 'react'
import ResizableSidebar from './Sidebar'
import ChannelList from './ChannelList'

type LayoutProps = {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      <ResizableSidebar>
        <div className="p-4">
          <ul>
            <ChannelList />
          </ul>
        </div>
      </ResizableSidebar>

      <main className="flex-1 overflow-hidden bg-gray-800">{children}</main>
    </div>
  )
}

export default Layout
