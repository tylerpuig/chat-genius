'use client'

import { useEffect, useState } from 'react'
import { Search, User, MessageSquare, File, X } from 'lucide-react'
import { Dialog, DialogContent } from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { api } from '~/trpc/react'
import { useDebouncedState } from '@mantine/hooks'
import { useUI } from '~/app/hooks/ui/useUI'
import { downloadFile } from '../sheets/MessageAttachments'
import { ScrollArea, ScrollBar } from '~/components/ui/scroll-area'
import { formatDistanceToNow } from 'date-fns'
import { type WorkSpaceSearchResults } from '~/trpc/types'

import React from 'react'

function ColorLoader() {
  return (
    <div className="flex w-full items-center">
      <svg className="h-2 w-full" viewBox="0 0 100 4">
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0066cc">
              <animate attributeName="offset" values="-1; 1" dur="2s" repeatCount="indefinite" />
            </stop>
            <stop offset="50%" stopColor="#00bfff">
              <animate
                attributeName="offset"
                values="-0.5; 1.5"
                dur="2s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="100%" stopColor="#1e3a8a">
              <animate attributeName="offset" values="0; 2" dur="2s" repeatCount="indefinite" />
            </stop>
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="100" height="4" fill="url(#gradient)" rx="2" ry="2" />
      </svg>
    </div>
  )
}

export default ColorLoader

export function WorkspaceSearchDialog() {
  const [searchQuery, setSearchQuery] = useDebouncedState('', 300)
  const [cachedSearchResults, setCachedSearchResults] = useState<WorkSpaceSearchResults>()

  const {
    workspaceSearchOpen,
    setWorkspaceSearchOpen,
    setSelectedChannelId,
    setSelectedChannelName,
    setIsConversation,
    setConversationUser,
    setUserProfileChatConfig,
    userProfileChatConfig
  } = useUI()

  const searchResults = api.search.getWorkspaceSearchResultsBySimilarity.useQuery(
    {
      query: searchQuery
    },
    {
      enabled: workspaceSearchOpen
    }
  )

  const generateAttachmentDownloadUrl = api.messages.getMessageAttachmentDownloadUrl.useMutation()

  useEffect(() => {
    setSearchQuery('')
  }, [workspaceSearchOpen])

  useEffect(() => {
    if (searchResults.data) {
      setCachedSearchResults(searchResults.data)
    }
  }, [searchResults.data])

  return (
    <Dialog open={workspaceSearchOpen} onOpenChange={setWorkspaceSearchOpen}>
      <DialogContent className="max-h-[90vh] border-0 bg-gray-900 text-gray-100 sm:max-w-[425px] md:max-h-[600px]">
        <div className="mt-2 flex items-center border-b border-gray-700 pb-4">
          <Input
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="mt-2 flex-1 border-none bg-gray-800 text-gray-100 placeholder-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>

        <div className="w-full">
          {searchResults.isPending && <ColorLoader />}
          <div className="mt-4 space-y-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-400">Users</h3>
            <div className="space-y-2">
              {cachedSearchResults && (
                <ScrollArea type="scroll" className="max-h-32 min-h-2 flex-1 rounded-md">
                  {cachedSearchResults?.users.map((user) => (
                    <div
                      onClick={async () => {
                        if (!user.channelId) return
                        setSelectedChannelId(user.channelId)

                        setUserProfileChatConfig({
                          ...userProfileChatConfig,
                          userId: user.id
                        })
                        setSelectedChannelName(user.name)
                        setIsConversation(true)
                        setConversationUser(user)
                        setWorkspaceSearchOpen(false)
                      }}
                      className="flex cursor-pointer items-center rounded-md p-2 hover:bg-gray-800"
                    >
                      <User className="mr-2 h-5 w-5 text-blue-400" />
                      <span>{user.name ?? ''}</span>
                    </div>
                  ))}
                  <ScrollBar orientation="horizontal" className="w-full" />
                </ScrollArea>
              )}
            </div>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-400">Messages</h3>
            <div className="flex">
              {/* Added wrapper div with flex */}
              <ScrollArea type="scroll" className="max-h-48 min-h-2 flex-1 rounded-md">
                <div className="space-y-2">
                  {cachedSearchResults &&
                    cachedSearchResults?.messages.map((message) => (
                      <div
                        onClick={() => {
                          setSelectedChannelId(message.channelId)
                          setWorkspaceSearchOpen(false)
                        }}
                        className="flex cursor-pointer items-center rounded-md p-2 hover:bg-gray-800"
                      >
                        <MessageSquare className="mr-2 h-5 w-5 text-blue-400" />
                        <div className="space-x-2 break-all">
                          <span>{message.content?.slice(0, 50) ?? ''}</span>
                          <span>({formatDistanceToNow(message?.createdAt)})</span>
                        </div>
                      </div>
                    ))}
                </div>
                <ScrollBar orientation="horizontal" className="w-full" />
              </ScrollArea>
            </div>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-400">Files</h3>
            <ScrollArea type="scroll" className="max-h-32 min-h-2 flex-1 rounded-md">
              <div className="space-y-2">
                {cachedSearchResults &&
                  cachedSearchResults?.files.map((file) => (
                    <div
                      onClick={async () => {
                        const download = await generateAttachmentDownloadUrl.mutateAsync({
                          attachmentId: file.id
                        })
                        if (!download?.downloadUrl) return

                        await downloadFile(download.downloadUrl, file.fileName)
                      }}
                      className="flex cursor-pointer items-center rounded-md p-2 hover:bg-gray-800"
                    >
                      <File className="mr-2 h-5 w-5 text-blue-400" />
                      <span className="" onClick={() => console.log(file)}>
                        {file.fileName ?? ''}
                      </span>
                    </div>
                  ))}
              </div>
              <ScrollBar orientation="horizontal" className="w-full" />
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
