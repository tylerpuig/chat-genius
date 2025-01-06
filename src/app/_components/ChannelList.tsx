"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Hash, Plus } from "lucide-react";
import { Button } from "~/components/ui/button";
// import { Input } from "";
// import { ScrollArea } from "@/components/ui/scroll-area";

interface Channel {
  id: string;
  name: string;
}

const CHANNEL_LIST = [
  { name: "# general", id: "1" },

  { name: "# random", id: "2" },
  { name: "# development", id: "3" },
];

for (let i = 4; i < 100; i++) {
  CHANNEL_LIST.push({ name: `# random${i}`, id: i.toString() });
}

export default function ChannelList() {
  const [channels, setChannels] = useState<Channel[]>([...CHANNEL_LIST]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [newChannelName, setNewChannelName] = useState("");

  const toggleChannels = () => {
    setIsExpanded(!isExpanded);
  };

  const addChannel = () => {
    if (newChannelName.trim()) {
      setChannels([
        ...channels,
        { id: Date.now().toString(), name: newChannelName.trim() },
      ]);
      setNewChannelName("");
    }
  };

  return (
    <div className="text-gray-300">
      <Button
        variant="blue"
        className="mb-2 w-full justify-start"
        onClick={toggleChannels}
      >
        {isExpanded ? (
          <ChevronDown className="mr-2" />
        ) : (
          <ChevronRight className="mr-2" />
        )}
        Channels
      </Button>
      {isExpanded && (
        <>
          {/* <ScrollArea className="mb-4 h-[300px]"> */}
          {channels.map((channel) => (
            <Button
              key={channel.id}
              variant="channel"
              className="mb-1 w-full justify-start"
            >
              <Hash className="mr-2 h-4 w-4" />
              {channel.name}
            </Button>
          ))}
          {/* </ScrollArea> */}
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="New channel name"
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              className="border-gray-700 bg-gray-800 text-gray-300 placeholder-gray-500"
            />
            <Button
              onClick={addChannel}
              size="icon"
              variant="blue"
              className="border-gray-700 bg-gray-800 hover:bg-gray-700"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
