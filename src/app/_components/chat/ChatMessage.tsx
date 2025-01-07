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
// import { type ChatMessage } from '~/server/db/types'
import { type ChatMessageData } from '~/trpc/types'

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

export function ChatMessage({ content, createdAt, user }: ChatMessageData) {
  return (
    <div className="group px-4 py-2 hover:bg-gray-800/50">
      <div className="flex gap-4">
        <Avatar className="h-10 w-10">
          <AvatarImage src={user?.avatar ?? ''} alt={user?.name ?? ''} />
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
              <Button
                variant="channel"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-gray-300"
              >
                <Repeat2 className="h-4 w-4" />
              </Button>
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

          {/* {reactions.length > 0 && (
            <div className="mt-2 flex gap-2">
              {reactions.map((reaction, index) => (
                <button
                  key={index}
                  className={`flex items-center gap-1 rounded-full px-2 py-1 text-sm ${
                    reaction.userHasReacted
                      ? 'bg-blue-600/30 text-blue-400'
                      : 'bg-gray-700/50 text-gray-300'
                  } transition-colors hover:bg-blue-600/40`}
                >
                  <span>{reaction.emoji}</span>
                  <span>{reaction.count}</span>
                </button>
              ))}
            </div>
          )} */}

          {/* {replies.length > 0 && (
            <button className="mt-2 flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300">
              <MessageSquare className="h-4 w-4" />
              {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
            </button>
          )} */}
        </div>
      </div>
    </div>
  )
}
