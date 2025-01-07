'use client'

import { useEffect } from 'react'
import { useUI } from '~/app/hooks/ui/useUI'
import { api } from '~/trpc/react'
import Layout from './_components/Layout'
import { WorkspaceSidebar } from './_components/WorkspaceSidebar'
import { ChatContainer, ChatInput } from './_components/chat/ChatContainer'
import { NewChannelSheet } from './_components/sheets/NewChannel'
import ChatTabs from './_components/chat/ChatTabs'

export default function ClientHomeWrapper() {
  const { selectedChannelId, setSelectedChannelId } = useUI()

  const { data: messages, refetch } = api.messages.getMessagesFromChannel.useQuery({
    channelId: selectedChannelId
  })

  const channels = api.messages.getChannels.useQuery(undefined, {
    enabled: !selectedChannelId
  })

  useEffect(() => {
    if (!selectedChannelId && channels?.data?.[0]?.id) {
      setSelectedChannelId(channels.data[0]?.id)
    }
  }, [channels.data])

  function refetchMessages(): void {
    refetch()
  }

  return (
    <div className="flex h-screen">
      <WorkspaceSidebar />
      <div className="flex-1">
        <Layout>
          <div className="flex h-full flex-col">
            <ChatTabs />
            <div className="relative flex flex-1 flex-col overflow-hidden">
              <ChatContainer messages={messages} refetchMessages={refetchMessages} />
              <ChatInput refetchMessages={refetchMessages} />
            </div>
          </div>
          <NewChannelSheet />
        </Layout>
      </div>
    </div>
  )
}
