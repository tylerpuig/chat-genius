'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '~/components/ui/sheet'
import { Textarea } from '~/components/ui/textarea'
import { Switch } from '~/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { api } from '~/trpc/react'
import { useSession } from 'next-auth/react'
import { useUI } from '~/app/hooks/ui/useUI'
import { ChatMessage } from '~/app/_components/chat/ChatMessage'
import { useChannelContext } from '~/app/hooks/ui/useChannelContext'

export function ViewMessageRepliesSheet() {
  const { messageReplySheetOpen, setMessageReplySheetOpen, selectedParentMessageId } = useUI()
  const { messages } = useChannelContext()

  const { data: replies, refetch } = api.messages.getMessageReplies.useQuery({
    messageId: selectedParentMessageId || 0
  })

  useEffect(() => {
    refetch()
  }, [messages])

  return (
    <div className="">
      <Sheet
        open={messageReplySheetOpen}
        onOpenChange={(open) => {
          setMessageReplySheetOpen(open)
        }}
      >
        <SheetContent className="scrollbar-overlay overflow-x-hidden border-gray-700 bg-gray-900 px-0 py-0 text-gray-200">
          {/* <SheetHeader>
          <SheetTitle className="text-gray-200">Create a new channel</SheetTitle>
          <SheetDescription className="text-gray-400">
            Set up a new channel for your team to collaborate.
          </SheetDescription>
        </SheetHeader> */}
          {replies?.mainMessage && (
            <div className="pt-4">
              <ChatMessage key={replies?.mainMessage?.id} message={replies?.mainMessage} isReply />
            </div>
          )}
          <ReplySeparator replyCount={replies?.mainMessage?.replyCount || 0} />
          {replies?.replies && (
            <div className="pt-2">
              {replies?.replies.map((message) => (
                <ChatMessage key={message.messageId} message={message.message} isReply />
              ))}
            </div>
          )}
          <ChatInput />
        </SheetContent>
      </Sheet>
    </div>
  )
}

export function ChatInput() {
  const { selectedChannelId, selectedParentMessageId } = useUI()
  const { refetchMessages } = useChannelContext()

  const createMessageReply = api.messages.createMessageReply.useMutation({
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
    <div className="sticky bottom-0 left-0 right-0 border-t border-gray-800 bg-gray-900 p-4">
      <div className="flex items-center gap-4">
        <input
          ref={messageContentRef}
          type="text"
          placeholder="Type a message..."
          className="flex-1 rounded-lg bg-gray-800 px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
        <Button
          onClick={() => {
            if (
              messageContentRef.current?.value &&
              session.data?.user.id &&
              selectedParentMessageId
            ) {
              createMessageReply.mutate({
                content: messageContentRef.current.value,
                channelId: selectedChannelId,
                messageId: selectedParentMessageId
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

function ReplySeparator({ replyCount }: { replyCount: number }) {
  return (
    <div className="my-4 flex items-center">
      <div className="h-px flex-grow bg-gray-700" />
      <span className="px-4 text-sm text-gray-400">
        {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
      </span>
      <div className="h-px flex-grow bg-gray-700" />
    </div>
  )
}
