'use client'

import { useRef } from 'react'
import { ChatMessage } from './ChatMessage'
import { Button } from '~/components/ui/button'
import { api } from '../../../trpc/react'
import { useSession } from 'next-auth/react'
import { useUI } from '~/app/hooks/ui/useUI'
import { useChannelContext } from '~/app/hooks/ui/useChannelContext'

export function ChatInput() {
  const { selectedChannelId } = useUI()
  const { refetchMessages } = useChannelContext()

  const sendMessage = api.messages.sendMessage.useMutation({
    onSuccess: () => {
      refetchMessages()
    },
    onSettled: () => {
      if (messageContentRef.current) {
        messageContentRef.current.value = ''
      }
    }
  })
  const messageContentRef = useRef<HTMLInputElement>(null)
  const session = useSession()
  return (
    <div className="absolute bottom-0 left-0 right-0 border-t border-gray-800 bg-gray-900 p-4">
      <div className="flex items-center gap-4">
        <input
          ref={messageContentRef}
          type="text"
          placeholder="Type a message..."
          className="flex-1 rounded-lg bg-gray-800 px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
        <Button
          onClick={() => {
            if (messageContentRef.current?.value && session.data?.user.id) {
              sendMessage.mutate({
                content: messageContentRef.current.value,
                channelId: selectedChannelId,
                userId: session.data?.user.id
              })
            }
          }}
          variant="default"
          className="bg-blue-600 text-gray-100 hover:bg-blue-700"
        >
          Send
        </Button>
      </div>
    </div>
  )
}

export function ChatContainer() {
  const { messages, refetchMessages } = useChannelContext()
  const { selectedChannelId } = useUI()
  api.messages.onMessage.useSubscription(
    {
      channelId: selectedChannelId
    },
    {
      onData: () => {
        refetchMessages()
      }
    }
  )

  return (
    <div className="absolute inset-0 bottom-[73px] flex flex-col overflow-hidden bg-gray-900">
      <div className="scrollbar-overlay flex-1 overflow-y-auto scroll-smooth">
        {messages && (
          <>
            {messages.map((message) => (
              <ChatMessage key={message.id} {...message} />
            ))}
          </>
        )}
      </div>
    </div>
  )
}
