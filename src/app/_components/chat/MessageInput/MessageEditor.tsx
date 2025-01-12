import { useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Button } from '~/components/ui/button'
import { Paperclip, CornerDownLeft, Mic } from 'lucide-react'

import { ChatInput } from '~/components/ui/chat/chat-input'
import { useFileAttachmentContext } from '~/app/hooks/ui/useFileAttachmentContext'
import { useSession } from 'next-auth/react'
import { useUI } from '~/app/hooks/ui/useUI'

interface ToolbarButtonProps {
  isActive: boolean
  onClick: () => void
  children: React.ReactNode
}

export default function MessageEditor({
  sendMessage,
  setMessageContent,
  messageContent
}: {
  sendMessage: () => Promise<number>
  setMessageContent: React.Dispatch<React.SetStateAction<string>>
  messageContent: string
}) {
  const { files, handleFileChange, uploadToS3 } = useFileAttachmentContext()
  const { data: session } = useSession()

  const { setFileUploadModalOpen, selectedChannelName } = useUI()

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleMessage(e?: React.KeyboardEvent<HTMLTextAreaElement>): Promise<void> {
    try {
      if (!session?.user.id || !messageContent) return
      console.log('Sending message:', messageContent)

      if (e?.key === 'Enter' && !e.shiftKey) {
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
    <div className="absolute bottom-0 left-0 right-0 z-10 bg-gray-800 p-3">
      <div className="relative rounded-lg border border-gray-600 focus-within:ring-1 focus-within:ring-blue-500">
        <ChatInput
          value={messageContent}
          onKeyDown={async (e) => await handleMessage(e)}
          onChange={(e) => setMessageContent(e.target.value)}
          placeholder="Send a message..."
          className="scrollbar-thin rounded-lg border-0 !text-lg text-zinc-100 shadow-none focus-visible:ring-0"
        />

        <div className="flex items-center p-3 pt-0">
          <Button onClick={() => setFileUploadModalOpen(true)} variant="channel" size="icon">
            <input type="file" onChange={handleFileChange} ref={fileInputRef} className="hidden" />
            <Paperclip className="size-4 stroke-slate-50" />
            {files.length ? (
              <div className="absolute -top-1 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500">
                <span className="text-xs font-medium text-white">{files.length}</span>
              </div>
            ) : null}
            <span className="sr-only">Attach file</span>
          </Button>

          <Button variant="channel" size="icon">
            <Mic className="size-4 stroke-slate-50" />
            <span className="sr-only">Use Microphone</span>
          </Button>

          <Button
            onClick={async () => {
              await handleMessage()
            }}
            variant="sendMessage"
            //   disabled={!input || isLoading}
            size="sm"
            className="ml-auto gap-1.5 bg-gray-700 text-white"
          >
            Send Message
            <CornerDownLeft className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
