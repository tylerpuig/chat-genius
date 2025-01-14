'use client'

import { useRef } from 'react'
import { ChatMessage } from './ChatMessage'
import { Button } from '~/components/ui/button'
import { api } from '../../../trpc/react'
import { useSession } from 'next-auth/react'
import { useUI } from '~/app/hooks/ui/useUI'
import { useChannelContext } from '~/app/hooks/ui/useChannelContext'
import { Paperclip, ChevronUp } from 'lucide-react'
import { Textarea } from '~/components/ui/textarea'
import { useFileAttachmentContext } from '~/app/hooks/ui/useFileAttachmentContext'
import PrivateConversationHeader from '~/app/_components/user/profile/PrivateConversationHeader'

export function MessageInput({
  sendMessage,
  setMessageContent,
  messageContent
}: {
  sendMessage: () => Promise<number>
  setMessageContent: React.Dispatch<React.SetStateAction<string>>
  messageContent: string
}) {
  // const [messageContent, setMessageContent] = useState('')
  const { files, handleFileChange, uploadToS3 } = useFileAttachmentContext()
  const { data: session } = useSession()

  const { setFileUploadModalOpen, selectedChannelName } = useUI()

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleMessage(e: React.KeyboardEvent<HTMLTextAreaElement>): Promise<void> {
    try {
      if (!session?.user.id || !messageContent) return

      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        const newMessage = await sendMessage()

        if (!newMessage) return
        if (files.length) {
          await uploadToS3(newMessage)
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 border-t border-gray-700 bg-gray-800 p-0">
      <div className="flex items-center gap-2 bg-gray-800 px-4 py-2">
        <Button
          variant="channel"
          onClick={() => setFileUploadModalOpen(true)}
          size="icon"
          className="relative text-zinc-200 hover:text-zinc-100"
        >
          <input type="file" onChange={handleFileChange} ref={fileInputRef} className="hidden" />
          <Paperclip className="!h-5 !w-5" />
          {files.length ? (
            <div className="absolute -top-1 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500">
              <span className="text-xs font-medium text-white">{files.length}</span>
            </div>
          ) : null}
        </Button>

        <div className="flex-1">
          <Textarea
            ref={inputRef}
            contentEditable={true}
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            placeholder={`Message #${selectedChannelName}`}
            className="!border-1 h-[56px] min-h-0 resize-none overflow-hidden !border-gray-700 bg-zinc-800 px-2 py-1 !text-base text-zinc-100 placeholder:text-zinc-400 focus-visible:ring-0"
            onKeyDown={async (e) => await handleMessage(e)}
          />
        </div>

        <div className="flex items-center gap-1"></div>
      </div>
    </div>
  )
}

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

const LoadMoreButton = () => {
  return (
    <button
      // onClick={onClick}
      className="flex -translate-x-1/2 transform items-center justify-center space-x-2 rounded-full bg-blue-800 px-2 py-[.2rem] text-sm text-blue-100 opacity-75 shadow-lg transition-colors duration-200 ease-in-out hover:bg-blue-800 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-opacity-50"
      aria-label="Load more messages"
    >
      <span>Previous</span>
      <ChevronUp className="h-4 w-4" />
    </button>
  )
}
export function ChatContainer() {
  const {
    messages,
    messagesEndRef,
    handleTopMessageScroll,
    isNearTopMessages,
    loadAdditionalMessages
  } = useChannelContext()
  const { isConversation } = useUI()

  return (
    <div className="flex h-full flex-col bg-gray-900">
      <div onScroll={handleTopMessageScroll} className="!scrollbar-overlay flex-1 overflow-y-auto">
        {isNearTopMessages && messages.length > 19 && !isConversation && (
          <div
            onClick={() => {
              loadAdditionalMessages()
            }}
            className="absolute left-1/2 top-1 z-40"
          >
            <LoadMoreButton />
          </div>
        )}
        {isConversation && (
          <div className="sticky top-0 z-40">
            <PrivateConversationHeader />
          </div>
        )}
        {messages && (
          <>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} className="h-4" />
          </>
        )}
      </div>
    </div>
  )
}
