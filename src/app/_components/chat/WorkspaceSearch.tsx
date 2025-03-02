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
import { LineaerGradientLoader } from '../state/loading/LineaderGradient'

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
      enabled: workspaceSearchOpen && searchQuery !== ''
    }
  )

  const generateAttachmentDownloadUrl = api.messages.getMessageAttachmentDownloadUrl.useMutation()

  useEffect(() => {
    setSearchQuery('')
    setCachedSearchResults(undefined)
  }, [workspaceSearchOpen])

  useEffect(() => {
    if (searchResults.data) {
      setCachedSearchResults(searchResults.data)
    }
  }, [searchResults.data])

  return (
    <Dialog open={workspaceSearchOpen} onOpenChange={setWorkspaceSearchOpen}>
      <DialogContent className="max-h-[90vh] border-0 bg-gray-900 text-gray-100 sm:max-w-[625px] md:max-h-[800px]">
        <div className="mt-2 flex items-center border-b border-gray-700 pb-4">
          <Input
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="mt-2 flex-1 border-none bg-gray-800 text-gray-100 placeholder-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>

        <div className="w-full">
          {searchResults.isLoading && <LineaerGradientLoader />}
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
              <ScrollArea type="always" className="max-h-72 min-h-2 flex-1 rounded-md">
                <div className="px-2">
                  {cachedSearchResults &&
                    cachedSearchResults?.messages.map((message) => (
                      <div
                        onClick={() => {
                          setSelectedChannelId(message.channelId)
                          setWorkspaceSearchOpen(false)
                        }}
                        className="cursor-pointer items-center rounded-md p-2 hover:bg-gray-800"
                      >
                        {/* <MessageSquare className="mr-2 h-5 w-5 text-blue-400" /> */}
                        <div className="flex items-center space-y-2 break-all border-b">
                          <User className="mr-2 h-5 w-5 text-blue-400" />
                          <span className="mr-2">{message.name ?? ''}</span>
                          <span>{`#${message.channelName ?? ''}`}</span>
                        </div>
                        <div className="space-y-2 break-all">
                          <span>{message.content ?? ''}</span>
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
