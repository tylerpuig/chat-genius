import React, { useEffect, useRef, useState } from 'react'
import { createContext, useContext, ReactNode } from 'react'
import { api } from '~/trpc/react'
import { type ChatMessageData } from '~/trpc/types'
import { useUI } from './useUI'
import { type ChannelMessageType } from '~/server/api/utils/subscriptionManager'

type ChannelContext = {
  messages: ChatMessageData[]
  refetchMessages: () => void
  messagesEndRef: React.RefObject<HTMLDivElement>
  replyMessagesEndRef: React.RefObject<HTMLDivElement>
}

const MessagesContext = createContext<ChannelContext>({
  messages: [],
  refetchMessages: () => {},
  messagesEndRef: React.createRef<HTMLDivElement>(),
  replyMessagesEndRef: React.createRef<HTMLDivElement>()
})

const SCROLL_NOTIFICATION_KEYS = new Set<ChannelMessageType>(['NEW_MESSAGE', 'NEW_REPLY'])

export function ChannelProvider({ children }: { children: ReactNode }) {
  const {
    selectedChannelId,
    setSelectedChannelId,
    setSelectedChannelName,
    currentTab,
    messageReplySheetOpen
  } = useUI()

  const channels = api.messages.getChannels.useQuery(undefined, {
    enabled: !selectedChannelId
  })

  const [currentNotificationType, setCurrentNotificationType] =
    useState<ChannelMessageType>('NEW_MESSAGE')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const replyMessagesEndRef = useRef<HTMLDivElement>(null)

  function scrollToBottomMainMessages(): void {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  function scrollToBottomReplyMessages(): void {
    replyMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (!selectedChannelId && channels?.data?.[0]?.id) {
      setSelectedChannelId(channels.data[0]?.id)
      setSelectedChannelName(channels.data[0]?.name)
    }
  }, [channels.data])

  const { data: messages, refetch } = api.messages.getMessagesFromChannel.useQuery({
    channelId: selectedChannelId,
    chatTab: currentTab
  })

  useEffect(() => {
    if (currentNotificationType === 'NEW_MESSAGE' && messagesEndRef.current) {
      scrollToBottomMainMessages()
    }

    if (currentNotificationType === 'NEW_REPLY' && replyMessagesEndRef.current) {
      scrollToBottomReplyMessages()
    }
  }, [messages])

  function refetchMessages(): void {
    refetch()
  }
  api.messages.onMessage.useSubscription(
    {
      channelId: selectedChannelId
    },
    {
      onData: (data) => {
        setCurrentNotificationType(data.type)
        refetchMessages()
      }
    }
  )

  return (
    <MessagesContext.Provider
      value={{
        messages: messages || [],
        refetchMessages,
        messagesEndRef,
        replyMessagesEndRef
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
