'use client'

import * as React from 'react'
import { Search, User, MessageSquare, File, X } from 'lucide-react'
import { Dialog, DialogContent } from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { api } from '~/trpc/react'
import { useDebouncedState } from '@mantine/hooks'
import { useUI } from '~/app/hooks/ui/useUI'
import { downloadFile } from '../sheets/MessageAttachments'

export function WorkspaceSearchDialog() {
  const [searchQuery, setSearchQuery] = useDebouncedState('', 300)

  const {
    workspaceSearchOpen,
    setWorkspaceSearchOpen,
    setSelectedChannelId,
    setSelectedChannelName,
    setIsConversation,
    setConversationUser
  } = useUI()

  const searchResults = api.messages.getWorkspaceSearchResults.useQuery({
    query: searchQuery
  })

  const generateAttachmentDownloadUrl = api.messages.getMessageAttachmentDownloadUrl.useMutation()

  const createConversation = api.conversations.createConversation.useMutation()

  return (
    <Dialog open={workspaceSearchOpen} onOpenChange={setWorkspaceSearchOpen}>
      <DialogContent className="border-0 bg-gray-900 text-gray-100 sm:max-w-[425px]">
        <div className="mt-2 flex items-center border-b border-gray-700 pb-4">
          <Input
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="mt-2 flex-1 border-none bg-gray-800 text-gray-100 placeholder-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
        <div className="mt-4 space-y-4">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-400">Users</h3>
            <div className="space-y-2">
              {searchResults.data && (
                <>
                  {searchResults.data?.users.map((user) => (
                    <div
                      onClick={async () => {
                        if (!user.channelId) {
                          const newConvoId = await createConversation.mutateAsync({
                            toUserId: user.id
                          })
                          if (!newConvoId) return
                          setSelectedChannelId(newConvoId.newConversationId)
                        } else {
                          setSelectedChannelId(user.channelId)
                        }
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
                </>
              )}
            </div>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-400">Messages</h3>
            <div className="space-y-2">
              {searchResults.data &&
                searchResults.data?.messages.map((message) => (
                  <div
                    onClick={() => {
                      setSelectedChannelId(message.channelId)
                      setWorkspaceSearchOpen(false)
                    }}
                    className="flex cursor-pointer items-center rounded-md p-2 hover:bg-gray-800"
                  >
                    <MessageSquare className="mr-2 h-5 w-5 text-blue-400" />
                    <span>{message.content ?? ''}</span>
                  </div>
                ))}
            </div>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-400">Files</h3>
            <div className="space-y-2">
              {searchResults.data &&
                searchResults.data?.files.map((file) => (
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
