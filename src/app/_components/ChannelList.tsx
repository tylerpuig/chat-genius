'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, Hash, Plus } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { api } from '~/trpc/react'
import { useUI } from '~/app/hooks/ui/useUI'

type ChannelInfo = {
  id: string
  name: string
}

const CHANNEL_LIST = [
  { name: '# general', id: '1' },

  { name: '# random', id: '2' },
  { name: '# development', id: '3' }
]

for (let i = 4; i < 5; i++) {
  CHANNEL_LIST.push({ name: `# random${i}`, id: i.toString() })
}

export default function ChannelList() {
  const { data: channels, refetch: refetchChannels } = api.messages.getChannels.useQuery()
  const { setChannelSheetOpen, channelSheetOpen, selectedChannelId, setSelectedChannelId } = useUI()
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

  const addChannel = () => {
    // if (newChannelName.trim()) {
    //   setChannels([...channels, { id: Date.now().toString(), name: newChannelName.trim() }])
    //   setNewChannelName('')
    // }
  }

  return (
    <div className="text-gray-300">
      <Button variant="sidebar" className="mb-2 w-full justify-start" onClick={toggleChannels}>
        {isChannelsExpanded ? <ChevronDown className="mr-2" /> : <ChevronRight className="mr-2" />}
        Channels
      </Button>
      {isChannelsExpanded && (
        <>
          {/* <ScrollArea className="mb-4 h-[300px]"> */}
          {channels.map((channel) => (
            <Button
              onClick={() => {
                setSelectedChannelId(channel.id)
              }}
              key={channel.id}
              variant="channel"
              className={`mb-1 w-full justify-start ${selectedChannelId === channel.id ? 'bg-gray-700' : ''}`}
            >
              <Hash className="mr-2 h-4 w-4" />
              {channel.name}
            </Button>
          ))}
          {/* </ScrollArea> */}
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
        DMs
      </Button>
      {isDMsExpanded && (
        <>
          {/* <ScrollArea className="mb-4 h-[300px]"> */}
          {channels.map((channel) => (
            <Button key={channel.id} variant="channel" className="mb-1 w-full justify-start">
              <Hash className="mr-2 h-4 w-4" />
              {channel.name}
            </Button>
          ))}
        </>
      )}
    </div>
  )
}
