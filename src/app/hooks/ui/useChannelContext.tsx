import { useEffect, useState, useMemo } from 'react'
import { createContext, useContext, ReactNode } from 'react'
import { api } from '~/trpc/react'
import type { ChatMessageData, ChatMessageReplyData } from '~/trpc/types'
import { useUI } from './useUI'

type ChannelContext = {
  messages: ChatMessageData[]
  refetchMessages: () => void
  messageReplies: ChatMessageReplyData[]
  messageReplyParentMessage: ChatMessageData | undefined
  isPendingMessageReplies: boolean
}

const MessagesContext = createContext<ChannelContext>({
  messages: [],
  refetchMessages: () => {},
  messageReplies: [],
  isPendingMessageReplies: false,
  messageReplyParentMessage: undefined
})

export function ChannelProvider({ children }: { children: ReactNode }) {
  const {
    selectedChannelId,
    setSelectedChannelId,
    setSelectedChannelName,
    currentTab,
    selectedParentMessageId,
    messageReplySheetOpen
  } = useUI()
  const [messageCache, setMessageCache] = useState<ChatMessageData[]>([])
  const [messageRepliesCache, setMessageRepliesCache] = useState<ChatMessageReplyData[]>([])
  const [messageReplyParentMessageCache, setMessageReplyParentMessageCache] =
    useState<ChatMessageData>()

  const channels = api.messages.getChannels.useQuery(undefined, {
    enabled: !selectedChannelId
  })

  useEffect(() => {
    if (!selectedChannelId && channels?.data?.[0]?.id) {
      setSelectedChannelId(channels.data[0]?.id)
      setSelectedChannelName(channels.data[0]?.name)
    }
  }, [channels.data])

  const { data: messages, refetch: refetchChannelMessages } =
    api.messages.getMessagesFromChannel.useQuery({
      channelId: selectedChannelId,
      chatTab: currentTab
    })

  // console.log(selectedChannelId, messages)

  const getLatestMessages = api.messages.getLatestMessagesFromChannel.useMutation()
  // const getLatestMessageReplies = api.messages.getLatestMessageReply.useMutation()
  // const getMessageReactions = api.messages.getMessageReactions.useMutation()

  // useEffect(() => {
  //   // if (!messages?.length) return
  //   setMessageCache(messages || [])
  // }, [messages])

  // const {
  //   data: messageReplyData,
  //   isPending: isPendingMessageReplies,
  //   refetch: refetchReplies
  // } = api.messages.getMessageReplies.useQuery(
  //   {
  //     messageId: selectedParentMessageId || 0
  //   },
  //   {
  //     enabled: selectedParentMessageId !== 0 && messageReplySheetOpen
  //   }
  // )

  // useEffect(() => {
  //   console.log(messageReplyData)
  //   // if (!messageReplyData?.replies?.length) return
  //   if (messageReplyData?.replies) {
  //     setMessageRepliesCache(messageReplyData.replies)
  //   }
  //   if (messageReplyData?.mainMessage) {
  //     setMessageReplyParentMessageCache(messageReplyData.mainMessage)
  //   }
  // }, [messageReplyData, messageReplySheetOpen])

  function refetchMessages(): void {
    // refetchReplies()
    refetchChannelMessages()
    // if (!messages || !messages.length) return
    // getLatestMessages.mutate({
    //   channelId: selectedChannelId,
    //   chatTab: currentTab,
    //   lastReadMessageId: messageCache.at(-1)?.id!
    // })
  }

  async function getLatestMessage() {
    // refetch()
    // if (!messages || !messages.length) return
    const messageIds = messageCache.map((message) => message.id)
    const maxNum = Math.max(...messageIds)
    const latestMessages = await getLatestMessages.mutateAsync({
      channelId: selectedChannelId,
      chatTab: currentTab,
      lastReadMessageId: maxNum
    })
    return latestMessages
  }
  api.messages.onMessage.useSubscription(
    {
      channelId: selectedChannelId
    },
    {
      onData: async (data) => {
        refetchMessages()
        // try {
        //   // const latestMessages =
        //   // if (!latestMessages?.length) return
        //   switch (data.messageType) {
        //     case 'NEW_MESSAGE':
        //       const newMessages = await getLatestMessage()
        //       const set = new Set([...messageCache, ...(newMessages ?? [])])
        //       setMessageCache([...set])
        //       break
        //     case 'NEW_REPLY':
        //       // if (!selectedParentMessageId) return
        //       // const newReplies = await getLatestMessageReplies.mutateAsync({
        //       //   parentMessageId: selectedParentMessageId,
        //       //   lastReadMessageId: messageRepliesCache.at(-1)?.messageId!
        //       // })

        //       // console.log(newReplies)

        //       // if (newReplies?.replies) {
        //       //   setMessageRepliesCache((prev) => [...prev, ...newReplies.replies])
        //       // }
        //       // if (newReplies?.mainMessage) {
        //       //   setMessageReplyParentMessageCache(newReplies.mainMessage)
        //       // }

        //       // update the message cache with new reply count
        //       updateMessageReplyCount(data.id, messageCache, setMessageCache)
        //       break
        //     case 'NEW_PIN':
        //       updatePin(data.id, messageCache, setMessageCache, 'PIN')
        //       break
        //     case 'REMOVE_PIN':
        //       updatePin(data.id, messageCache, setMessageCache, 'UNPIN')
        //       break
        //     case 'SAVE_MESSAGE':
        //       updateSavedMessage(data.id, messageCache, setMessageCache, 'SAVE')
        //       break
        //     case 'UNSAVE_MESSAGE':
        //       updateSavedMessage(data.id, messageCache, setMessageCache, 'UNSAVE')
        //       break
        //     case 'DELETE_MESSAGE':
        //       setMessageCache((prev) => prev.filter((message) => message.id !== data.id))
        //       break
        //     case 'NEW_REACTION':
        //       // const newReactions = await getMessageReactions.mutateAsync({
        //       //   messageId: data.id
        //       // })
        //       // updateMessageReactions(data.id, messageCache, newReactions, setMessageCache, 'ADD')
        //       break
        //     case 'REMOVE_REACTION':
        //       updateMessageReactions(data.id, messageCache, [], setMessageCache, 'REMOVE')
        //       break
        //     default:
        //       break
        //   }
        // } catch (err) {
        //   console.error('Error in onMessage subscription:', err)
        // }
        // refetchMessages()
      }
    }
  )

  return (
    <MessagesContext.Provider
      value={{
        // messages: messageCache || [],
        messages: messages || [],
        refetchMessages,
        messageReplies: messageRepliesCache || [],
        isPendingMessageReplies: false,
        messageReplyParentMessage: messageReplyParentMessageCache
      }}
    >
      {children}
    </MessagesContext.Provider>
  )
}

function updatePin(
  messageId: number,
  messageCache: ChatMessageData[],
  setMessageCache: React.Dispatch<React.SetStateAction<ChatMessageData[]>>,
  type: 'PIN' | 'UNPIN'
): void {
  try {
    const messagesCopy = [...messageCache]
    const mainMessage = messagesCopy.find((message) => message.id === messageId)
    if (!mainMessage) return
    mainMessage.isPinned = type === 'PIN'
    setMessageCache(messagesCopy)
  } catch (err) {
    console.error('Error adding new pin:', err)
  }
}

function updateMessageReactions(
  messageId: number,
  messageCache: ChatMessageData[],
  reactions: { messageId: number; userId: string; emoji: string }[] = [],
  setMessageCache: React.Dispatch<React.SetStateAction<ChatMessageData[]>>,
  type: 'ADD' | 'REMOVE'
): void {
  try {
    const messagesCopy = structuredClone(messageCache)
    const mainMessage = messagesCopy.find((message) => message.id === messageId)
    if (!mainMessage) return
    if (type === 'ADD') {
      mainMessage.reactions = [...mainMessage.reactions, ...reactions]
      setMessageCache(messagesCopy)
    } else {
      mainMessage.reactions = mainMessage.reactions.filter(
        (reaction) => !reactions.some((r) => r.messageId === reaction.messageId)
      )
      setMessageCache(messagesCopy)
    }
  } catch (err) {
    console.error('Error updating message reactions:', err)
  }
}

function updateSavedMessage(
  messageId: number,
  messageCache: ChatMessageData[],
  setMessageCache: React.Dispatch<React.SetStateAction<ChatMessageData[]>>,
  type: 'SAVE' | 'UNSAVE'
): void {
  try {
    const messagesCopy = [...messageCache]
    const mainMessage = messagesCopy.find((message) => message.id === messageId)
    if (!mainMessage) return
    mainMessage.isSaved = type === 'SAVE'
    setMessageCache(messagesCopy)
  } catch (err) {
    console.error('Error adding new pin:', err)
  }
}

function updateMessageReplyCount(
  messageId: number,
  messageCache: ChatMessageData[],
  setMessageCache: React.Dispatch<React.SetStateAction<ChatMessageData[]>>
): void {
  try {
    setMessageCache((prevCache) =>
      prevCache.map((message) =>
        message.id === messageId ? { ...message, replyCount: message.replyCount + 1 } : message
      )
    )
  } catch (err) {
    console.error('Error updating message reply count:', err)
  }
}

// Custom hook to use the messages context
export function useChannelContext() {
  return useContext(MessagesContext)
}
