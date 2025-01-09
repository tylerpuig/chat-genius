'use client'

import Layout from './_components/Layout'
import { WorkspaceSidebar } from './_components/WorkspaceSidebar'
import { ChatContainer, ChatInput } from './_components/chat/ChatContainer'
import { NewChannelSheet } from './_components/sheets/NewChannel'
import { ViewMessageRepliesSheet } from './_components/sheets/MessageReplies'
import { useUI } from '~/app/hooks/ui/useUI'
import { type UIView } from '~/app/store/features/ui/types'
import ChatTabs from './_components/chat/ChatTabs'

const homeComponents: Record<UIView, JSX.Element> = {
  channel: <ChannelView />,
  conversation: <></>
}

function HomeComponentToRender() {
  const { uiView } = useUI()
  return homeComponents[uiView] || <ChatContainer />
}

function ChannelView() {
  return (
    <>
      <ChatContainer />
      <ChatInput />
    </>
  )
}

export default function ClientHomeWrapper() {
  return (
    <div className="flex h-screen">
      <WorkspaceSidebar />
      <div className="flex-1">
        <Layout>
          <div className="flex h-full flex-col">
            <ChatTabs />
            <div className="relative flex flex-1 flex-col overflow-hidden">
              <HomeComponentToRender />
            </div>
          </div>
          <NewChannelSheet />
          <ViewMessageRepliesSheet />
        </Layout>
      </div>
    </div>
  )
}
