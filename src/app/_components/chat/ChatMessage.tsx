'use client'

import React from 'react'
import {
  MoreHorizontal,
  MessageSquare,
  Bookmark,
  Repeat2,
  ThumbsUp,
  Reply as ReplyIcon
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import { type ChatMessageData } from '~/trpc/types'
// import EmojiPicker from 'emoji-picker-react'
import ChatReactions, { EmojiPicker } from './ChatReactions'

type Reaction = {
  emoji: string
  count: number
  userHasReacted: boolean
}

type Reply = {
  id: string
  authorName: string
  authorAvatar: string
  content: string
  timestamp: Date
}

const reactions = [
  { emoji: '👍', count: 3, userHasReacted: true },
  { emoji: '🚀', count: 2, userHasReacted: false }
]

const replies = [
  {
    id: '1.1',
    authorName: 'Alex Kim',
    authorAvatar: '/placeholder.svg?height=40&width=40',
    content: 'I can take a look at it',
    timestamp: new Date(Date.now() - 1000 * 60 * 10)
  }
]

export function ChatMessage({ content, user, id, reactions }: ChatMessageData) {
  return (
    <div className="group px-4 py-2 hover:bg-gray-800/50">
      <div className="flex gap-4">
        <Avatar className="h-10 w-10">
          <AvatarImage src={user.image ?? ''} alt={user?.name ?? ''} />
          <AvatarFallback>{user?.name?.[0] ?? ''}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-100">{user?.name || ''}</span>
              {/* <span className="text-sm text-gray-400">{timestamp.toISOString()}</span> */}
              {/* {isPinned && (
                <span className="rounded bg-blue-900/30 px-2 py-0.5 text-xs text-blue-400">
                  Pinned
                </span>
              )} */}
            </div>

            <div className="flex flex-shrink-0 items-start gap-1">
              <Button
                variant="channel"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-gray-300"
              >
                <ReplyIcon className="h-4 w-4" />
              </Button>
              <EmojiPicker messageId={id} />
              {/* <Button
                variant="channel"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-gray-300"
              >
                <Repeat2 className="h-4 w-4" />
              </Button> */}
              <Button
                variant="channel"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-gray-300"
              >
                <Bookmark className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="channel"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-gray-300"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 border-gray-800 bg-gray-900">
                  <DropdownMenuItem className="text-gray-300 hover:text-gray-100">
                    Copy Message Link
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-gray-300 hover:text-gray-100">
                    Pin to Channel
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-400 hover:text-red-300">
                    Delete Message
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="mt-1 break-words text-gray-300">{content}</div>

          <ChatReactions reactions={reactions} id={id} />

          <div className="flex justify-between">
            {replies.length > 0 && (
              <button className="mt-2 flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300">
                <MessageSquare className="h-4 w-4" />
                {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
