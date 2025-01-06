"use client";

import React from "react";
import { ChatMessage } from "./ChatMessage";
import { Button } from "~/components/ui/button";

const SAMPLE_MESSAGES = [
  {
    id: "1",
    author: {
      name: "Sarah Chen",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    content:
      "Just pushed the new feature to staging. Can someone review the PR?",
    timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
    reactions: [
      { emoji: "👍", count: 3, userHasReacted: true },
      { emoji: "🚀", count: 2, userHasReacted: false },
    ],
    replies: [
      {
        id: "1.1",
        authorName: "Alex Kim",
        authorAvatar: "/placeholder.svg?height=40&width=40",
        content: "I can take a look at it",
        timestamp: new Date(Date.now() - 1000 * 60 * 10),
      },
    ],
    isPinned: true,
  },
  {
    id: "2",
    author: {
      name: "Marcus Johnson",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    content:
      "The new dark theme looks amazing! Great work on the color palette.",
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    reactions: [
      { emoji: "🎨", count: 4, userHasReacted: true },
      { emoji: "💯", count: 2, userHasReacted: false },
    ],
  },
];

for (let i = 3; i < 100; i++) {
  SAMPLE_MESSAGES.push({
    id: i.toString(),
    author: {
      name: "Marcus Johnson",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    content:
      "The new dark theme looks amazing! Great work on the color palette.",
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    reactions: [
      { emoji: "🎨", count: 4, userHasReacted: true },
      { emoji: "💯", count: 2, userHasReacted: false },
    ],
  });
}

export function ChatInput() {
  return (
    <div className="absolute bottom-0 left-0 right-0 border-t border-gray-800 bg-gray-900 p-4">
      <div className="flex items-center gap-4">
        <input
          type="text"
          placeholder="Type a message..."
          className="flex-1 rounded-lg bg-gray-800 px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
        <Button
          variant="default"
          className="bg-blue-600 text-gray-100 hover:bg-blue-700"
        >
          Send
        </Button>
      </div>
    </div>
  );
}

export function ChatContainer() {
  return (
    <div className="absolute inset-0 bottom-[73px] flex flex-col overflow-hidden bg-gray-900">
      <div className="scrollbar-overlay flex-1 overflow-y-auto scroll-smooth">
        {SAMPLE_MESSAGES.map((message) => (
          <ChatMessage key={message.id} {...message} />
        ))}
      </div>
    </div>
  );
}
