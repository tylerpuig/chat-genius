import { useEffect, createContext, useContext, ReactNode } from 'react'
import { api } from '~/trpc/react'
import { type ChatMessageData } from '~/trpc/types'
import { useUI } from './useUI'

type ChannelContext = {
  messages: ChatMessageData[]
  refetchMessages: () => void
}

const MessagesContext = createContext<ChannelContext>({
  messages: [],
  refetchMessages: () => {}
})

export function ChannelProvider({ children }: { children: ReactNode }) {
  const { selectedChannelId, setSelectedChannelId } = useUI()

  const channels = api.messages.getChannels.useQuery(undefined, {
    enabled: !selectedChannelId
  })

  useEffect(() => {
    if (!selectedChannelId && channels?.data?.[0]?.id) {
      setSelectedChannelId(channels.data[0]?.id)
    }
  }, [channels.data])

  const { data: messages, refetch } = api.messages.getMessagesFromChannel.useQuery({
    channelId: selectedChannelId
  })

  function refetchMessages(): void {
    refetch()
  }

  return (
    <MessagesContext.Provider
      value={{
        messages: messages || [],
        refetchMessages
      }}
    >
      {children}
    </MessagesContext.Provider>
  )
}

// Custom hook to use the messages context
export function useChannelContext() {
  return useContext(MessagesContext)
}
