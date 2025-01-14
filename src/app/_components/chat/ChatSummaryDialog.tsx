'use client'
import { useState } from 'react'
import MarkdownPreview from '@uiw/react-markdown-preview'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { api } from '~/trpc/react'
import { useDebouncedState } from '@mantine/hooks'
import { useUI } from '~/app/hooks/ui/useUI'
import { ScrollArea, ScrollBar } from '~/components/ui/scroll-area'
import { formatDistanceToNow } from 'date-fns'
import { type WorkSpaceSearchResults } from '~/trpc/types'
import { LineaerGradientLoader } from '~/app/_components/state/loading/LineaderGradient'

import React from 'react'

export function ChatSummaryDialog() {
  const [completion, setCompletion] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const { selectedChannelId, chatSummaryOpen, setChatSummaryOpen } = useUI()

  const getChatSummary = api.integrations.summarizeMessagesInChannel.useMutation({
    onSuccess: (data) => {
      if (data.summary) {
        setCompletion(data.summary)
      }
    }
  })

  return (
    <Dialog
      open={chatSummaryOpen}
      onOpenChange={(open) => {
        setChatSummaryOpen(open)
        setCompletion('')
      }}
    >
      <DialogContent className="max-h-[90vh] border-0 bg-gray-900 text-gray-100 sm:max-w-[825px] md:max-h-[800px]">
        <div className="w-full">
          <DialogHeader>
            <DialogTitle>Chat Summary</DialogTitle>
            <DialogDescription className="text-gray-400">
              We'll find the most relevant messages in your chat and summarize them for you.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="">
              <div className="mt-2 flex items-center border-b border-gray-700 pb-4">
                <Input
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      getChatSummary.mutate({
                        channelId: selectedChannelId,
                        userQuery: searchQuery
                      })
                    }
                  }}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="mt-2 flex-1 border-none bg-gray-800 text-gray-100 placeholder-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>
            <Button
              onClick={() => {
                getChatSummary.mutate({ channelId: selectedChannelId, userQuery: searchQuery })
              }}
              type="submit"
              className="bg-blue-700 text-blue-100 hover:bg-blue-600"
              disabled={getChatSummary.isPending}
            >
              {getChatSummary.isPending ? <>Summarizing...</> : 'Get Summary'}
            </Button>
          </div>

          <div className="duration-900 animate-in slide-in-from-top">
            {completion && (
              // <ScrollArea className="h-64 flex-1 transform-gpu rounded-md">
              <div className="max-h-[500px] !overflow-y-auto scrollbar-thin">
                <MarkdownPreview source={completion} style={{ padding: 10 }} className="" />
              </div>
              // </ScrollArea>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
