import { useRef, useEffect, useState } from 'react'
import { Button } from '~/components/ui/button'
import { Paperclip, CornerDownLeft, Mic, Sparkles } from 'lucide-react'
import { ChatInput } from '~/components/ui/chat/chat-input'
import { useFileAttachmentContext } from '~/app/hooks/ui/useFileAttachmentContext'
import { useSession } from 'next-auth/react'
import { useUI } from '~/app/hooks/ui/useUI'
import { api } from '~/trpc/react'
import { useDebouncedState } from '@mantine/hooks'
import { UserMention } from './UserMention'
// import { ScrollArea } from '~/components/ui/scroll-area'

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
  const [autoCompleteOn, setAutoCompleteOn] = useState(true)

  // Create a debounced version of messageContent
  const [debouncedContent, setDebouncedContent] = useDebouncedState('', 400)

  // State for predicted text
  const [predictedText, setPredictedText] = useState('')
  const [showUserList, setShowUserList] = useState(false)

  // Reference to track if Tab was pressed
  const tabPressed = useRef(false)

  const [cursorPosition, setCursorPosition] = useState(0)

  // Add this handler for cursor position
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageContent(e.target.value)
    setCursorPosition(e.target.selectionStart || 0)
  }

  const predictNextMessage = api.integrations.predictNextMessage.useMutation({
    onSuccess: (data) => {
      if (data.suggestedMessage) {
        console.log('Suggested message:', data.suggestedMessage)
        // Only set prediction if it's different from current content
        if (data.suggestedMessage !== debouncedContent) {
          if (!messageContent || !debouncedContent) return
          setPredictedText(data.suggestedMessage)
        } else {
          setPredictedText('')
        }
      }
    }
  })

  useEffect(() => {
    // Only proceed if not ending with (bot)
    if (messageContent.trim().endsWith('(bot)')) {
      setDebouncedContent('') // Reset debounced content when we just have the bot mention
      return
    }

    // Check if we have text after the (bot) mention
    const botMentionIndex = messageContent.indexOf('(bot)')
    if (botMentionIndex !== -1) {
      // Get the text that comes after "(bot)"
      const textAfterBot = messageContent.slice(botMentionIndex + 5).trim()
      if (textAfterBot) {
        setDebouncedContent(textAfterBot)
      } else {
        setDebouncedContent('')
      }
    } else {
      // If no bot mention, proceed as normal
      setDebouncedContent(messageContent)
    }
  }, [messageContent])

  useEffect(() => {
    if (!autoCompleteOn || !messageContent || !debouncedContent) {
      return
    }

    const botMentionIndex = messageContent.indexOf('(bot)')
    if (debouncedContent.trim().startsWith('@') && botMentionIndex !== -1) return

    // Cancel previous mutation if it's still running
    if (predictNextMessage.isPending) {
      predictNextMessage.reset()
    }

    predictNextMessage.mutate({
      currentText: debouncedContent,
      channelId: selectedChannelId
    })

    return () => {
      if (predictNextMessage.isPending) {
        predictNextMessage.reset()
      }
    }
  }, [debouncedContent, autoCompleteOn])

  useEffect(() => {
    if (!messageContent) {
      setPredictedText('')
      setDebouncedContent('')
      // Reset any pending mutation
      if (predictNextMessage.isPending) {
        predictNextMessage.reset()
      }
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
          onChange={handleChange}
          placeholder={`Send a message to ${selectedChannelName}...`}
          className="!scrollbar-thumb-rounded-full rounded-lg border-0 !text-lg text-zinc-100 shadow-none scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-600 focus-visible:ring-0"
        />

        {predictedText && !showUserList && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg">
            <div className="whitespace-pre-wrap break-words px-4 py-1 text-lg">
              <span className="invisible">{messageContent}</span>
              <span className="text-zinc-100 opacity-40">{predictedText}</span>
            </div>
          </div>
        )}

        <UserMention
          showUserList={showUserList}
          setShowUserList={setShowUserList}
          messageContent={messageContent}
          setMessageContent={setMessageContent}
          cursorPosition={cursorPosition}
        />

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
            onClick={() => {
              if (autoCompleteOn) {
                setPredictedText('')
                setDebouncedContent('')
              }
              setAutoCompleteOn((prev) => !prev)
            }}
            variant="channel"
            size="icon"
          >
            <Sparkles
              className={`size-4 ${autoCompleteOn ? 'stroke-blue-400' : 'stroke-slate-50'}`}
            />
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
