import { useRef, useEffect, useState } from 'react'
import { Button } from '~/components/ui/button'
import { Paperclip, CornerDownLeft, Mic } from 'lucide-react'
import { ChatInput } from '~/components/ui/chat/chat-input'
import { useFileAttachmentContext } from '~/app/hooks/ui/useFileAttachmentContext'
import { useSession } from 'next-auth/react'
import { useUI } from '~/app/hooks/ui/useUI'
import { api } from '~/trpc/react'
import { useDebouncedState } from '@mantine/hooks'

export default function MessageEditor({
  sendMessage,
  setMessageContent,
  messageContent
}: {
  sendMessage: () => Promise<number>
  setMessageContent: React.Dispatch<React.SetStateAction<string>>
  messageContent: string
}) {
  const { files, uploadToS3 } = useFileAttachmentContext()
  const { data: session } = useSession()

  const { setFileUploadModalOpen, selectedChannelName, selectedChannelId } = useUI()

  // Create a debounced version of messageContent
  const [debouncedContent, setDebouncedContent] = useDebouncedState('', 400)

  // Store the current mutation promise to allow cancellation
  const currentMutation = useRef<AbortController | null>(null)

  // State for predicted text
  const [predictedText, setPredictedText] = useState('')

  // Reference to track if Tab was pressed
  const tabPressed = useRef(false)

  const predictNextMessage = api.integrations.predictNextMessage.useMutation({
    onSuccess: (data) => {
      if (data.suggestedMessage) {
        console.log('Suggested message:', data.suggestedMessage)
        // Only set prediction if it's different from current content
        if (data.suggestedMessage !== debouncedContent) {
          setPredictedText(data.suggestedMessage)
        } else {
          setPredictedText('')
        }
      }
    }
  })

  useEffect(() => {
    setDebouncedContent(messageContent)
    console.log('Debounced content:', debouncedContent)
    console.log('Message content:', messageContent)
  }, [messageContent])

  useEffect(() => {
    if (!messageContent || !debouncedContent) return
    if (predictNextMessage.isPending) return
    predictNextMessage.mutate({
      currentText: debouncedContent,
      channelId: selectedChannelId
    })
  }, [debouncedContent])

  useEffect(() => {
    if (!messageContent) {
      setPredictedText('')
    }
  }, [messageContent])

  // async function handleMessage(e: React.KeyboardEvent<HTMLTextAreaElement>): Promise<void> {
  //   try {
  //     if (!session?.user.id || !messageContent) return

  //     if (e?.key === 'Enter' && !e.shiftKey) {
  //       e.preventDefault()
  //       const newMessage = await sendMessage()

  //       if (!newMessage) return
  //       if (files.length) {
  //         await uploadToS3(newMessage)
  //       }
  //     }
  //   } catch (error) {
  //     console.error('Error sending message:', error)
  //   }
  // }

  async function handleMessage(e: React.KeyboardEvent<HTMLTextAreaElement>): Promise<void> {
    try {
      if (!session?.user.id || !messageContent) return

      if (e.key === 'Tab' && predictedText) {
        e.preventDefault()
        tabPressed.current = true
        setMessageContent((prev) => prev + predictedText)
        setPredictedText('')
        return
      }

      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        const newMessage = await sendMessage()

        if (!newMessage) return
        if (files.length) {
          await uploadToS3(newMessage)
        }
        // Clear prediction after sending
        setPredictedText('')
      }
    } catch (error) {
      console.error('Error handling message:', error)
    }
  }

  async function submitMessage(): Promise<void> {
    try {
      if (!session?.user.id || !messageContent) return
      const newMessage = await sendMessage()
      if (!newMessage) return
      if (files.length) {
        await uploadToS3(newMessage)
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  return (
    <div className="bg-gray-800 p-3">
      <div className="relative rounded-lg border border-gray-600 focus-within:ring-1 focus-within:ring-blue-500">
        <ChatInput
          value={messageContent}
          onKeyDown={async (e) => await handleMessage(e)}
          onChange={(e) => setMessageContent(e.target.value)}
          placeholder={`Send a message to ${selectedChannelName}...`}
          className="scrollbar-thin rounded-lg border-0 !text-lg text-zinc-100 shadow-none focus-visible:ring-0"
        />

        {predictedText && (
          <div className="pointer-events-none absolute inset-0 rounded-lg">
            <div className="px-3 py-1 text-lg">
              <span className="invisible mr-1">{messageContent}</span>
              <span className="text-zinc-100 opacity-40">{predictedText}</span>
            </div>
          </div>
        )}

        <div className="flex items-center p-3 pt-0">
          <Button
            onClick={() => setFileUploadModalOpen(true)}
            variant="channel"
            size="icon"
            className="relative"
          >
            <Paperclip className="size-4 stroke-slate-50" />
            {files.length ? (
              <div className="absolute -right-1 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500">
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
              await submitMessage()
            }}
            variant="sendMessage"
            disabled={!messageContent}
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
