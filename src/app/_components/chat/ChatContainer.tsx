'use client'

import { useRef, useState } from 'react'
import { ChatMessage } from './ChatMessage'
import { Button } from '~/components/ui/button'
import { api } from '../../../trpc/react'
import { useSession } from 'next-auth/react'
import { useUI } from '~/app/hooks/ui/useUI'
import { useChannelContext } from '~/app/hooks/ui/useChannelContext'
import { Plus, Gift, Smile, Paperclip, Grid } from 'lucide-react'
import { Textarea } from '~/components/ui/textarea'
import { useFileAttachmentContext } from '~/app/hooks/ui/useFileAttachmentContext'

export function MessageInput() {
  const [content, setContent] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const { files, setFiles } = useFileAttachmentContext()

  // const [files, setFiles] = useState<File[]>([])
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([])
  const { setFileUploadModalOpen, fileUploadModalOpen } = useUI()

  // Get tRPC utils
  const getUploadUrl = api.messages.getSignedS3UploadUrl.useMutation()

  const uploadToS3 = async () => {
    if (!files.length) return

    setIsUploading(true)
    const uploadedFileUrls: string[] = []

    try {
      await Promise.all(
        files.map(async (file) => {
          // Get pre-signed URL
          const data = await getUploadUrl.mutateAsync({
            fileName: file.name,
            fileType: file.type
          })

          if (!data) {
            throw new Error('Failed to get pre-signed URL')
          }

          console.log(data)

          // Upload to S3
          const uploadResponse = await fetch(data.uploadUrl, {
            method: 'PUT',
            body: file,
            headers: {
              'Content-Type': file.type
            }
          })

          if (!uploadResponse.ok) {
            throw new Error(`Failed to upload ${file.name}`)
          }

          console.log(uploadResponse)

          uploadedFileUrls.push(data.fileUrl)
        })
      )

      setUploadedUrls(uploadedFileUrls)
      setFiles([]) // Clear files after successful upload
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setIsUploading(false)
    }
  }

  console.log('uploadedUrls', uploadedUrls)

  // For the send message function
  const sendMessage = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (files.length) {
        await uploadToS3()
      }
    }
  }

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    console.log('Selected files:', files)
    if (!files) return

    for (const file of files) {
      setFiles((prev) => [...prev, file])
    }
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 border-t border-gray-800 bg-gray-800 p-0">
      <div className="flex items-center gap-2 bg-gray-800 p-4">
        <Button
          variant="ghost"
          onClick={() => setFileUploadModalOpen(true)}
          // onClick={handleButtonClick}
          size="icon"
          className="relative text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
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
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Message #startups"
            className="!border-1 min-h-[40px] resize-none overflow-hidden !border-gray-700 bg-zinc-800 p-2 text-zinc-100 placeholder:text-zinc-400 focus-visible:ring-0"
            onKeyDown={sendMessage}
          />
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <Gift className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <Smile className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <Grid className="h-5 w-5" />
          </Button>
        </div>
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

export function ChatContainer() {
  const { messages, refetchMessages } = useChannelContext()
  // console.log(messages)
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
              <ChatMessage key={message.id} message={message} />
            ))}
          </>
        )}
      </div>
    </div>
  )
}
