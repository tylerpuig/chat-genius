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

function formatFileSizeToKB(bytes: number | null): string {
  try {
    if (!bytes) return '0 KB'
    const mb = bytes / 1024
    return `${mb.toFixed(2)} KB`
  } catch (error) {
    console.error('Error formatting file size:', error)
    return '0 KB'
  }
}

async function downloadFile(downloadUrl: string, fileName: string): Promise<void> {
  try {
    // Method 1: Open in new tab
    // window.open(downloadUrl);

    // Method 2: Download file with original filename
    const response = await fetch(downloadUrl)
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName // Will prompt download with original filename
    document.body.appendChild(link)
    link.click()

    // Cleanup
    window.URL.revokeObjectURL(url)
    document.body.removeChild(link)
  } catch (error) {
    console.error('Download failed:', error)
  }
}

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
          <Table className="mt-3">
            <TableHeader className="">
              <TableRow className="hover:bg-gray-800 focus:bg-gray-800">
                <TableHead className="text-white-300">Name</TableHead>
                <TableHead className="text-white-300">Size</TableHead>
                <TableHead className="text-white-300">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="">
              {attachmentFiles.data &&
                attachmentFiles.data?.map((file) => (
                  <TableRow key={file.id} className="border-b border-gray-800 hover:bg-slate-800">
                    <TableCell className="font-medium text-gray-300">{file.fileName}</TableCell>
                    <TableCell className="text-gray-400">
                      {formatFileSizeToKB(file.fileSize)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="blue"
                        size="sm"
                        className="bg-blue-900 text-blue-300 hover:bg-blue-800"
                        onClick={async () => {
                          const download = await downloadMessageAttachment.mutateAsync({
                            attachmentId: file.id
                          })
                          if (!download?.downloadUrl) return
                          await downloadFile(download.downloadUrl, file.fileName)
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
