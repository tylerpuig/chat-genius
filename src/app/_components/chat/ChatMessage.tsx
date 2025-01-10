'use client'

import React from 'react'
import { MessageSquare, Bookmark, Reply as ReplyIcon, MoreVertical, FileIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import { type ChatMessageData } from '~/trpc/types'
import ChatReactions, { EmojiPicker } from './ChatReactions'
import { useUI } from '~/app/hooks/ui/useUI'
import { formatDistanceToNow, format } from 'date-fns'
import { api } from '~/trpc/react'
import { useSession } from 'next-auth/react'

type ChatMessageProps = {
  message: ChatMessageData
  isReply?: boolean
}

export function ChatMessage({ message, isReply = false }: ChatMessageProps) {
  if (!message) return null
  const { data: session } = useSession()
  const { content, user, id, reactions, replyCount } = message

  const { selectedChannelId, currentTab } = useUI()

  const { setMessageReplySheetOpen, messageReplySheetOpen, setSelectedParentMessageId } = useUI()

  const pinMessage = api.messages.pinMessage.useMutation()
  const unPinMessage = api.messages.unPinMessage.useMutation()
  const deleteMessage = api.messages.deleteMessage.useMutation()
  const saveMessage = api.messages.saveMessage.useMutation()
  const unSaveMessage = api.messages.unSaveMessage.useMutation()

  return (
    <div className="group px-4 py-2 hover:bg-gray-800/50">
      <div className="flex gap-4">
        <Avatar className="h-10 w-10">
          <AvatarImage src={user.image ?? ''} alt={user?.name ?? ''} />
          <AvatarFallback>{user?.name?.[0] ?? ''}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className={`... ${isReply ? 'max-w-[100px]' : 'max-w-[200px]'} truncate font-semibold text-gray-100`}
              >
                {user?.name || ''}
              </span>
              <span className="text-sm text-gray-400">
                {!isReply ? (
                  <>{formatDistanceToNow(message?.createdAt, { addSuffix: true })}</>
                ) : (
                  <>{format(message?.createdAt, 'h:mm a')}</>
                )}
              </span>
              {/* {isPinned && (
                <span className="rounded bg-blue-900/30 px-2 py-0.5 text-xs text-blue-400">
                  Pinned
                </span>
              )} */}
            </div>

            <div className="flex flex-wrap items-start gap-1">
              {!isReply && (
                <Button
                  onClick={() => {
                    if (messageReplySheetOpen) return
                    setSelectedParentMessageId(id)
                    setMessageReplySheetOpen(true)
                  }}
                  variant="channel"
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-gray-300"
                >
                  <ReplyIcon className="h-4 w-4" />
                </Button>
              )}
              <EmojiPicker messageId={id} />

              <Button
                onClick={() => {
                  if (message?.isSaved) {
                    unSaveMessage.mutate({
                      messageId: id,
                      channelId: selectedChannelId
                    })
                  } else {
                    saveMessage.mutate({
                      messageId: id,
                      channelId: selectedChannelId
                    })
                  }
                }}
                variant="channel"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-gray-300"
              >
                <Bookmark
                  className={`h-4 w-4 ${message?.isSaved ? 'fill-blue-400 stroke-blue-400' : ''}`}
                />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="channel"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-gray-300"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 border-gray-800 bg-gray-900">
                  <DropdownMenuItem className="text-gray-300 hover:text-gray-100">
                    Copy Message Link
                  </DropdownMenuItem>
                  {!isReply && (
                    <DropdownMenuItem
                      onClick={() => {
                        if (!message?.isPinned) {
                          pinMessage.mutate({
                            messageId: id,
                            channelId: selectedChannelId
                          })
                        } else {
                          unPinMessage.mutate({
                            messageId: id,
                            channelId: selectedChannelId
                          })
                        }
                      }}
                      className="text-gray-300 hover:text-gray-100"
                    >
                      {message?.isPinned ? 'Unpin' : 'Pin to Channel'}
                    </DropdownMenuItem>
                  )}
                  {session?.user?.id === message?.userId && (
                    <DropdownMenuItem
                      onClick={() => {
                        deleteMessage.mutate({
                          messageId: id,
                          channelId: selectedChannelId
                        })
                      }}
                      className="text-red-400 hover:text-red-300"
                    >
                      Delete Message
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="mt-1 break-words text-gray-300">
            <p className="break-all">{content}</p>
          </div>

          <ChatReactions reactions={reactions} id={id} />
          <div className="flex space-x-4">
            {!isReply && replyCount > 0 && (
              <div className="flex justify-between">
                <button
                  onClick={() => {
                    if (messageReplySheetOpen) return
                    setSelectedParentMessageId(id)

                    setMessageReplySheetOpen(true)
                  }}
                  className="mt-2 flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
                >
                  <MessageSquare className="h-4 w-4" />
                  {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                </button>
              </div>
            )}
            {message?.attachments?.length > 0 && (
              <div className="flex justify-between">
                <button
                  onClick={() => {
                    if (messageReplySheetOpen) return
                    setSelectedParentMessageId(id)

                    setMessageReplySheetOpen(true)
                  }}
                  className="mt-2 flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
                >
                  <FileIcon className="h-4 w-4" />
                  {message?.attachments?.length}{' '}
                  {message?.attachments?.length === 1 ? 'attachment' : 'attachments'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
