'use client'

import { useRef, useEffect } from 'react'
import { Button } from '~/components/ui/button'
import { Sheet, SheetContent } from '~/components/ui/sheet'
import { api } from '~/trpc/react'
import { useSession } from 'next-auth/react'
import { useUI } from '~/app/hooks/ui/useUI'
import { ChatMessage } from '~/app/_components/chat/ChatMessage'
import { useChannelContext } from '~/app/hooks/ui/useChannelContext'
import { Skeleton } from '~/components/ui/skeleton'

export function ViewMessageRepliesSheet() {
  const { messageReplySheetOpen, setMessageReplySheetOpen, selectedParentMessageId } = useUI()
  const { messages } = useChannelContext()

  const {
    data: messageData,
    refetch,
    isPending
  } = api.messages.getMessageReplies.useQuery({
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
        <SheetContent
          useXButton={false}
          className="scrollbar-overlay flex h-full flex-col break-words border-gray-700 bg-gray-900 p-0 text-gray-200"
        >
          <div className="scrollbar-overlay flex-1 overflow-y-auto">
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
          </div>
          <ChatInput />
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
    <div className="sticky bottom-0 left-0 right-0 -mt-3 border-t border-gray-800 bg-gray-900 p-4">
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
    <div className="flex items-center">
      <div className="h-px flex-grow bg-gray-700" />
      <span className="px-4 text-sm text-gray-400">
        {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
      </span>
      <div className="h-px flex-grow bg-gray-700" />
    </div>
  )
}
