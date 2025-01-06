'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Hash, Plus } from 'lucide-react'
import { Button } from '~/components/ui/button'
// import { Input } from "";
// import { ScrollArea } from "@/components/ui/scroll-area";

interface Channel {
  id: string
  name: string
}

const CHANNEL_LIST = [
  { name: '# general', id: '1' },

  { name: '# random', id: '2' },
  { name: '# development', id: '3' }
]

for (let i = 4; i < 100; i++) {
  CHANNEL_LIST.push({ name: `# random${i}`, id: i.toString() })
}

export default function ChannelList() {
  const [channels, setChannels] = useState<Channel[]>([...CHANNEL_LIST])
  const [isChannelsExpanded, setIsChannelsExpanded] = useState(true)
  const [isDMsExpanded, setIsDMsExpanded] = useState(true)
  const [newChannelName, setNewChannelName] = useState('')

  const toggleChannels = () => {
    setIsChannelsExpanded(!isChannelsExpanded)
  }

  const toggleDMs = () => {
    setIsDMsExpanded(!isDMsExpanded)
  }

  const addChannel = () => {
    if (newChannelName.trim()) {
      setChannels([...channels, { id: Date.now().toString(), name: newChannelName.trim() }])
      setNewChannelName('')
    }
  }

  return (
    <div className="text-gray-300">
      <Button variant="blue" className="mb-2 w-full justify-start" onClick={toggleChannels}>
        {isChannelsExpanded ? <ChevronDown className="mr-2" /> : <ChevronRight className="mr-2" />}
        Channels
      </Button>
      {isChannelsExpanded && (
        <>
          {/* <ScrollArea className="mb-4 h-[300px]"> */}
          {channels.map((channel) => (
            <Button key={channel.id} variant="channel" className="mb-1 w-full justify-start">
              <Hash className="mr-2 h-4 w-4" />
              {channel.name}
            </Button>
          ))}
          {/* </ScrollArea> */}
        </>
      )}

      <Button variant="blue" className="mb-2 w-full justify-start" onClick={toggleDMs}>
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

      <Button
        onClick={addChannel}
        variant="blue"
        className="w-full justify-start border-gray-700 bg-gray-700 hover:bg-gray-600"
      >
        <div className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <div>Create Channel</div>
        </div>
      </Button>
    </div>
  )
}
