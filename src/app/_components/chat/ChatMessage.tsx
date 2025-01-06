"use client";

import React from "react";
import { formatDistanceToNow } from "date-fns";
import {
  MoreHorizontal,
  MessageSquare,
  Bookmark,
  Repeat2,
  ThumbsUp,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

interface Reaction {
  emoji: string;
  count: number;
  userHasReacted: boolean;
}

interface Reply {
  id: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  timestamp: Date;
}

interface ChatMessageProps {
  id: string;
  author: {
    name: string;
    avatar: string;
  };
  content: string;
  timestamp: Date;
  reactions?: Reaction[];
  replies?: Reply[];
  isPinned?: boolean;
}

export function ChatMessage({
  author,
  content,
  timestamp,
  reactions = [],
  replies = [],
  isPinned = false,
}: ChatMessageProps) {
  return (
    <div className="group flex gap-4 px-4 py-2 hover:bg-gray-800/50">
      <Avatar className="h-10 w-10">
        <AvatarImage src={author.avatar} alt={author.name} />
        <AvatarFallback>{author.name[0]}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-100">{author.name}</span>
          <span className="text-sm text-gray-400">
            {formatDistanceToNow(timestamp, { addSuffix: true })}
          </span>
          {isPinned && (
            <span className="rounded bg-blue-900/30 px-2 py-0.5 text-xs text-blue-400">
              Pinned
            </span>
          )}
        </div>

        <div className="mt-1 text-gray-300">{content}</div>

        {reactions.length > 0 && (
          <div className="mt-2 flex gap-2">
            {reactions.map((reaction, index) => (
              <button
                key={index}
                className={`flex items-center gap-1 rounded-full px-2 py-1 text-sm ${
                  reaction.userHasReacted
                    ? "bg-blue-600/30 text-blue-400"
                    : "bg-gray-700/50 text-gray-300"
                } transition-colors hover:bg-blue-600/40`}
              >
                <span>{reaction.emoji}</span>
                <span>{reaction.count}</span>
              </button>
            ))}
          </div>
        )}

        {replies.length > 0 && (
          <button className="mt-2 flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300">
            <MessageSquare className="h-4 w-4" />
            {replies.length} {replies.length === 1 ? "reply" : "replies"}
          </button>
        )}
      </div>

      <div className="flex items-start gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-400 hover:text-gray-300"
        >
          <ThumbsUp className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-400 hover:text-gray-300"
        >
          <Repeat2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-400 hover:text-gray-300"
        >
          <Bookmark className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-gray-300"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 border-gray-800 bg-gray-900"
          >
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
  );
}
