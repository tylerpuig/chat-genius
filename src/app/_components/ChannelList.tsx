'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, Hash, Plus } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Button } from '~/components/ui/button'
import { api } from '~/trpc/react'
import { useUI } from '~/app/hooks/ui/useUI'

export default function ChannelList() {
  const { data: channels, refetch: refetchChannels } = api.messages.getChannels.useQuery()
  const {
    setChannelSheetOpen,
    channelSheetOpen,
    selectedChannelId,
    setSelectedChannelId,
    setSelectedChannelName
  } = useUI()
  const [isChannelsExpanded, setIsChannelsExpanded] = useState(true)
  const [isDMsExpanded, setIsDMsExpanded] = useState(true)

  useEffect(() => {
    refetchChannels()
  }, [channelSheetOpen])

  const toggleChannels = () => {
    setIsChannelsExpanded(!isChannelsExpanded)
  }

  const toggleDMs = () => {
    setIsDMsExpanded(!isDMsExpanded)
  }

  if (!channels) return null

  return (
    <div className="text-gray-300">
      <Button variant="sidebar" className="mb-2 w-full justify-start" onClick={toggleChannels}>
        {isChannelsExpanded ? <ChevronDown className="mr-2" /> : <ChevronRight className="mr-2" />}
        Channels
      </Button>
      {isChannelsExpanded && (
        <>
          {channels.map((channel) => (
            <Button
              onClick={() => {
                setSelectedChannelId(channel.id)
                setSelectedChannelName(channel.name)
              }}
              key={channel.id}
              variant="channel"
              className={`mb-1 w-full justify-start ${selectedChannelId === channel.id ? 'bg-gray-700' : ''}`}
            >
              <Hash className="mr-2 h-4 w-4" />
              {channel.name}
            </Button>
          ))}
        </>
      )}

      <Button
        onClick={() => setChannelSheetOpen(true)}
        variant="sidebar"
        className="w-full justify-start border-gray-700 hover:bg-gray-600"
      >
        <div className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <div>Create Channel</div>
        </div>
      </Button>

      <Button variant="sidebar" className="mb-2 w-full justify-start" onClick={toggleDMs}>
        {isDMsExpanded ? <ChevronDown className="mr-2" /> : <ChevronRight className="mr-2" />}
        Messages
      </Button>
      {isDMsExpanded && (
        <>
          <OnlineUserList />
        </>
      )}
    </div>
  )
}

type UserStatusProps = {
  name: string
  imageUrl?: string
  isOnline?: boolean
  className?: string
  conversationId?: number | null
}

function OnlineUserList() {
  const userList = api.messages.getOnlineUsers.useQuery()
  const { setSelectedChannelId } = useUI()

  const createConversation = api.conversations.createConversation.useMutation({
    onSuccess: (data) => {
      if (data?.newConversationId) {
        setSelectedChannelId(data.newConversationId)
      }
    }
  })

  if (!userList.data) return null

  return (
    <div className="flex flex-col gap-4">
      {userList.data.map((user) => (
        <div
          onClick={() => {
            if (!user.conversationId) {
              createConversation.mutate({ toUserId: user.id })
            } else {
              setSelectedChannelId(user.conversationId)
            }
          }}
        >
          <UserStatus
            key={user.id}
            name={user.name || ''}
            imageUrl={user.avatar || ''}
            isOnline
            className="flex-shrink-0 rounded-md"
            conversationId={user.conversationId}
          />
        </div>
      ))}
    </div>
  )
}

export function UserStatus({
  name,
  imageUrl,
  isOnline = false,
  className = '',
  conversationId
}: UserStatusProps) {
  const { selectedChannelId } = useUI()
  return (
    <div
      className={`relative flex cursor-pointer items-center px-3 ${className} p-1 hover:bg-gray-700 ${selectedChannelId === conversationId ? 'bg-gray-700' : ''}`}
    >
      <div className="relative">
        <Avatar className="h-8 w-8 border-0 border-border">
          <AvatarImage src={imageUrl} alt={name} />
          <AvatarFallback className="text-md">{name}</AvatarFallback>
        </Avatar>
        <div
          className={`absolute -bottom-0 -right-0 h-2.5 w-2.5 rounded-full ${
            isOnline ? 'bg-emerald-500' : 'bg-zinc-500'
          }`}
          aria-hidden="true"
        />
      </div>
      <span className="ml-3 block truncate">{name}</span>
    </div>
  )
}
