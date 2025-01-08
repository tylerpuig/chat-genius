'use client'

import { useState } from 'react'
import { Smile } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { api } from '~/trpc/react'
import { type ChatMessageData } from '~/trpc/types'
import { useSession } from 'next-auth/react'
import { useChannelContext } from '~/app/hooks/ui/useChannelContext'
import { useUI } from '~/app/hooks/ui/useUI'

const emojis = [
  '😀',
  '😂',
  '😍',
  '🤔',
  '😎',
  '🙌',
  '👍',
  '🎉',
  '🔥',
  '❤️',
  '🌈',
  '🍕',
  '🎸',
  '🚀',
  '💡'
]

export default function ChatReactions({
  reactions,
  id
}: {
  reactions: ChatMessageData['reactions']
  id: number
}) {
  const { selectedChannelId } = useUI()
  const { data: session } = useSession()
  const { refetchMessages } = useChannelContext()

  const removeReaction = api.messages.removeMessageReaction.useMutation({
    onSuccess: () => {
      refetchMessages()
    }
  })

  const addReaction = api.messages.createMessageReaction.useMutation({
    onSuccess: () => {
      refetchMessages()
    }
  })

  const reactionCount = reactions.reduce(
    (acc, reaction) => {
      acc[reaction.emoji] = (acc[reaction.emoji] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  // Get unique reactions while preserving all their data
  const uniqueReactionsMap = new Map(reactions.map((reaction) => [reaction.emoji, reaction]))

  // Take first 3 reactions with all their data
  const reactionsToRender = Array.from(uniqueReactionsMap.values()).slice(0, 3)

  function hasUserReactedWithEmoji(emoji: string): boolean {
    try {
      return reactions.some(
        (reaction) => reaction.emoji === emoji && reaction.userId === session?.user.id // Changed !== to ===
      )
    } catch (err) {}

    return false
  }
  return (
    <>
      {reactions.length > 0 && (
        <div className="mt-2 flex gap-2">
          {reactionsToRender.map((reaction, index) => (
            <button
              onClick={() => {
                if (!hasUserReactedWithEmoji(reaction.emoji)) {
                  addReaction.mutate({
                    messageId: id,
                    emoji: reaction.emoji,
                    channelId: selectedChannelId
                  })
                } else {
                  removeReaction.mutate({
                    messageId: id,
                    emoji: reaction.emoji,
                    channelId: selectedChannelId
                  })
                }
              }}
              key={index}
              className={`flex items-center gap-1 rounded-full px-2 text-sm ${
                hasUserReactedWithEmoji(reaction.emoji)
                  ? 'bg-blue-600/30 text-blue-400'
                  : 'bg-gray-700/50 text-gray-300'
              } transition-colors hover:bg-blue-600/40`}
            >
              <span>{reaction.emoji}</span>
              <span>{reactionCount?.[reaction.emoji] || 0}</span>
            </button>
          ))}
        </div>
      )}
      {/* <EmojiPicker messageId={id} /> */}
    </>
  )
}

export function EmojiPicker({ messageId }: { messageId: number }) {
  const [isOpen, setIsOpen] = useState(false)
  const { selectedChannelId } = useUI()
  const { refetchMessages } = useChannelContext()

  const addReaction = api.messages.createMessageReaction.useMutation({
    onSuccess: () => {
      refetchMessages()
    },
    onSettled: () => {
      setIsOpen(false)
    }
  })

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="channel" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-300">
          <Smile className="h-4 w-4" />
        </Button>
        {/* <Button
          variant="emoji"
          size={null}
          className="text-gray-400 hover:text-gray-300 focus:ring-0 focus:ring-offset-0"
        >
          <Smile className="h-7 w-7" />
          <span className="sr-only">Add emoji</span>
        </Button> */}
      </PopoverTrigger>
      <PopoverContent className="w-64 border-gray-700 bg-gray-800 p-2" sideOffset={5}>
        <div className="grid grid-cols-5 gap-2">
          {emojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                addReaction.mutate({
                  messageId: messageId,
                  emoji: emoji,
                  channelId: selectedChannelId
                })
              }}
              className="rounded p-1 text-2xl transition-colors duration-200 hover:bg-gray-700"
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
