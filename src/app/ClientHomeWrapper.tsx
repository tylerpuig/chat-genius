'use client'

import Layout from './_components/Layout'
import { WorkspaceSidebar } from './_components/WorkspaceSidebar'
import { ChatContainer, ChatInput } from './_components/chat/ChatContainer'
import { NewChannelSheet } from './_components/sheets/NewChannel'
import ChatTabs from './_components/chat/ChatTabs'

export default function ClientHomeWrapper() {
  return (
    <div className="flex h-screen">
      <WorkspaceSidebar />
      <div className="flex-1">
        <Layout>
          <div className="flex h-full flex-col">
            <ChatTabs />
            <div className="relative flex flex-1 flex-col overflow-hidden">
              <ChatContainer />
              <ChatInput />
            </div>
          </div>
          <NewChannelSheet />
        </Layout>
      </div>
    </div>
  )
}
