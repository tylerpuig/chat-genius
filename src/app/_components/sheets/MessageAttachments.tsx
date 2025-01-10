'use client'

import { useState, useRef } from 'react'
import { Button } from '~/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '~/components/ui/sheet'
import { api } from '~/trpc/react'
import { useSession } from 'next-auth/react'
import { useUI } from '~/app/hooks/ui/useUI'
import { useChannelContext } from '~/app/hooks/ui/useChannelContext'
import { useFileAttachmentContext } from '~/app/hooks/ui/useFileAttachmentContext'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '~/components/ui/table'
import { Download } from 'lucide-react'

export function MessageAttachmentsSheet() {
  const { messageAttachmentsSheetOpen, setMessageAttachmentsSheetOpen, selectedMessageId } = useUI()

  const attachmentFiles = api.messages.getMessageAttachments.useQuery({
    messageId: selectedMessageId
  })

  const downloadMessageAttachment = api.messages.getMessageAttachmentDownloadUrl.useMutation()

  return (
    <Sheet
      open={messageAttachmentsSheetOpen}
      onOpenChange={(open) => {
        setMessageAttachmentsSheetOpen(open)
        // setIsPrivate(false)
        // setSelectedUsers([])
      }}
    >
      <SheetContent className="scrollbar-overlay overflow-auto border-gray-700 bg-gray-900 px-1 text-gray-200">
        <SheetHeader>
          <SheetTitle className="px-4 text-gray-200">Message Attachments</SheetTitle>
          {/* <SheetDescription className="text-gray-400">
            Set up a new channel for your team to collaborate.
          </SheetDescription> */}
        </SheetHeader>
        <div className="rounded-lg bg-gray-900">
          {/* <h2 className="mb-4 text-xl font-bold text-blue-300">Files</h2> */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-white-300">Name</TableHead>
                <TableHead className="text-white-300">Size</TableHead>
                <TableHead className="text-white-300">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attachmentFiles.data &&
                attachmentFiles.data?.map((file) => (
                  <TableRow key={file.id} className="border-b border-gray-800">
                    <TableCell className="font-medium text-gray-300">{file.fileName}</TableCell>
                    <TableCell className="text-gray-400">{file.fileSize}</TableCell>
                    <TableCell>
                      <Button
                        variant="blue"
                        size="sm"
                        className="bg-blue-900 text-blue-300 hover:bg-blue-800"
                        onClick={async () => {
                          const result = downloadMessageAttachment.mutateAsync({
                            attachmentId: file.id
                          })
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </SheetContent>
    </Sheet>
  )
}
