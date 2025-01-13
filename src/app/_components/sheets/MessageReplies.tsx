'use client'

import { useEffect, useState } from 'react'
import { Sheet, SheetContent } from '~/components/ui/sheet'
import { api } from '~/trpc/react'
import { useSession } from 'next-auth/react'
import { useUI } from '~/app/hooks/ui/useUI'
import { ChatMessage } from '~/app/_components/chat/ChatMessage'
import { useChannelContext } from '~/app/hooks/ui/useChannelContext'
import { Skeleton } from '~/components/ui/skeleton'
import MessageEditor from '../chat/MessageInput/MessageEditor'

export function ViewMessageRepliesSheet() {
  const {
    messageReplySheetOpen,
    setMessageReplySheetOpen,
    selectedParentMessageId,
    selectedChannelId
  } = useUI()
  const { messages } = useChannelContext()
  const { data: session } = useSession()
  const [replyContent, setReplyContent] = useState('')

  const { refetchMessages, replyMessagesEndRef } = useChannelContext()

  const createMessageReplyMutation = api.messages.createMessageReply.useMutation({
    onSuccess: () => {
      refetchMessages()
    },
    onSettled: () => {
      setReplyContent('')
    }
  })

  const {
    data: messageData,
    refetch,
    isPending
  } = api.messages.getMessageReplies.useQuery({
    parentMessageId: selectedParentMessageId || 0
  })

  useEffect(() => {
    if (!messageReplySheetOpen) return
    refetch()
  }, [messages])

  async function sendMessage(): Promise<number> {
    try {
      if (!session?.user.id || !replyContent || !selectedParentMessageId) return 0

      const newMessage = await createMessageReplyMutation.mutateAsync({
        content: replyContent,
        channelId: selectedChannelId,
        messageId: selectedParentMessageId
      })

      return newMessage?.messageId || 0
    } catch (error) {
      console.error('Error sending message:', error)
    }
    return 0
  }

  return (
    <div className="scrollbar-overlay">
      <Sheet
        open={messageReplySheetOpen}
        onOpenChange={(open) => {
          setMessageReplySheetOpen(open)
        }}
      >
        <SheetContent
          useXButton={false}
          className="scrollbar-overlay flex h-full flex-col break-words border-gray-700 bg-gray-900 p-0 text-gray-200"
        >
          <div className="scrollbar-overlay flex-1 overflow-auto pb-20">
            {!isPending ? (
              <div>
                {messageData?.mainMessage && (
                  <div className="">
                    <ChatMessage
                      key={messageData?.mainMessage?.id}
                      message={messageData?.mainMessage}
                      isReply
                    />
                  </div>
                )}
              </div>
            ) : (
              <MainMessageLoader />
            )}

            <ReplySeparator replyCount={messageData?.mainMessage?.replyCount || 0} />
            {messageData?.replies && (
              <div className="pt-2">
                {messageData?.replies.map((message) => (
                  <ChatMessage key={message.messageId} message={message.message} isReply />
                ))}
              </div>
            )}
            <div ref={replyMessagesEndRef} />
          </div>
          {/* <ChatInput /> */}
          <MessageEditor
            sendMessage={sendMessage}
            messageContent={replyContent}
            setMessageContent={setReplyContent}
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}

function MainMessageLoader() {
  return (
    <div className="flex items-center space-x-4 p-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
  )
}

function ReplySeparator({ replyCount }: { replyCount: number }) {
  return (
    <div className="flex items-center">
      <div className="h-px flex-grow bg-gray-700" />
      <span className="px-4 text-sm text-gray-400">
        {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
      </span>
      <div className="h-px flex-grow bg-gray-700" />
    </div>
  )
}
