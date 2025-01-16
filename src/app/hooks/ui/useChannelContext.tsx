import React, { useEffect, useRef, useState } from 'react'
import { createContext, useContext, ReactNode } from 'react'
import { api } from '~/trpc/react'
import type { ChatMessageData, OnlineUserList } from '~/trpc/types'
import { useUI } from './useUI'
import { type ChannelMessageType } from '~/server/api/utils/subscriptionManager'

type ChannelContext = {
  messages: ChatMessageData[]
  refetchMessages: () => void
  messagesEndRef: React.RefObject<HTMLDivElement>
  replyMessagesEndRef: React.RefObject<HTMLDivElement>
  userList: OnlineUserList
  handleTopMessageScroll: (e: React.UIEvent<HTMLDivElement>) => void
  isNearTopMessages: boolean
  loadAdditionalMessages: () => void
}

const MessagesContext = createContext<ChannelContext>({
  messages: [],
  refetchMessages: () => {},
  messagesEndRef: React.createRef<HTMLDivElement>(),
  replyMessagesEndRef: React.createRef<HTMLDivElement>(),
  userList: [],
  handleTopMessageScroll: () => {},
  isNearTopMessages: false,
  loadAdditionalMessages: () => {}
})

export function ChannelProvider({ children }: { children: ReactNode }) {
  const { selectedChannelId, setSelectedChannelId, setSelectedChannelName, currentTab } = useUI()

  const [allMessages, setAllMessages] = useState<ChatMessageData[]>([])
  const [isNearTopMessages, setIsNearTopMessages] = useState(false)

  const channels = api.messages.getChannels.useQuery(undefined, {
    enabled: !selectedChannelId
  })

  const [msgLimit, setMsgLimit] = useState(20)

  const userList = api.messages.getOnlineUsers.useQuery()

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

  const { data: messages, refetch } = api.messages.getMessagesFromChannel.useQuery(
    {
      channelId: selectedChannelId,
      chatTab: currentTab,
      limit: msgLimit
    },
    {
      enabled: true
    }
  )

  function handleTopMessageScroll(e: React.UIEvent<HTMLDivElement>): void {
    try {
      const target = e.target as HTMLDivElement
      const isNearTop = target.scrollTop < 100 // Adjust this threshold as needed
      setIsNearTopMessages(isNearTop)
    } catch (error) {
      console.error('Error handling scroll event:', error)
    }
  }

  useEffect(() => {
    setMsgLimit(20)
    ;(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      scrollToBottomMainMessages()
    })()
  }, [selectedChannelId, currentTab])

  useEffect(() => {
    if (messages) {
      setAllMessages(messages)
    }
  }, [messages])

  // useEffect(() => {
  //   if (currentNotificationType === 'NEW_MESSAGE' && messagesEndRef.current) {
  //     // setTimeout(() => {
  //     //   scrollToBottomMainMessages()
  //     // }, 500)
  //     // scrollToBottomMainMessages()
  //   }

  //   if (currentNotificationType === 'NEW_REPLY' && replyMessagesEndRef.current) {
  //     scrollToBottomReplyMessages()
  //   }
  // }, [currentNotificationType])

  function refetchMessages(): void {
    refetch()
  }
  function loadAdditionalMessages(): void {
    setMsgLimit((prev) => prev + 20)
  }

  const RELOAD_KEYS = new Set<ChannelMessageType>([
    'DELETED_MESSAGE',
    'SAVE_MESSAGE',
    'UNSAVE_MESSAGE',
    'PIN_MESSAGE',
    'UNPIN_MESSAGE',
    'NEW_MESSAGE',
    'NEW_REPLY',
    'NEW_REACTION',
    'DELETED_REACTION'
  ])

  api.messages.onMessage.useSubscription(
    {
      channelId: selectedChannelId
    },
    {
      onData: async (data) => {
        // setCurrentNotificationType(data.type)
        if (RELOAD_KEYS.has(data.type)) {
          refetch()
        }

        if (data.type === 'NEW_MESSAGE') {
          await new Promise((resolve) => setTimeout(resolve, 1_000))
          scrollToBottomMainMessages()
        }

        if (data.type === 'NEW_REPLY') {
          await new Promise((resolve) => setTimeout(resolve, 1_000))
          scrollToBottomReplyMessages()
        }
        // refetchMessages()
      }
    }
  )

  return (
    <MessagesContext.Provider
      value={{
        messages: allMessages || [],
        refetchMessages,
        messagesEndRef,
        replyMessagesEndRef,
        userList: userList.data || [],
        handleTopMessageScroll,
        isNearTopMessages,
        loadAdditionalMessages
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
