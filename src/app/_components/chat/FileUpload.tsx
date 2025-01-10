'use client'

import { useState, useCallback } from 'react'
import { Button } from '~/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { useDropzone } from 'react-dropzone'
import { Upload, FileIcon, Trash2 } from 'lucide-react'
import { useUI } from '~/app/hooks/ui/useUI'
import { useFileAttachmentContext } from '~/app/hooks/ui/useFileAttachmentContext'

export function FileUploadModal() {
  const { files, setFiles } = useFileAttachmentContext()

  const { setFileUploadModalOpen, fileUploadModalOpen } = useUI()

  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prevFiles) => [...prevFiles, ...acceptedFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

  return (
    <Dialog open={fileUploadModalOpen} onOpenChange={setFileUploadModalOpen}>
      <DialogContent className="border-0 bg-gray-800 text-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>File Management</DialogTitle>
        </DialogHeader>

        <>
          {files.map((el) => (
            <div className="mt-4 flex items-center justify-center gap-2">
              <FileIcon className="text-gray-400" /> {el.name}
              <Trash2
                className="cursor-pointer text-gray-400 hover:text-red-500"
                onClick={() => {
                  try {
                    setFiles((prevFiles) => prevFiles.filter((file) => file.name !== el.name))
                  } catch (error) {
                    console.error('Error deleting file:', error)
                  }
                }}
              />
            </div>
          ))}
          <div
            {...getRootProps()}
            className={`cursor-pointer rounded-lg border-2 border-dashed p-4 text-center ${
              isDragActive ? 'border-primary' : 'border-gray-300'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              Drag & drop files here, or click to select files
            </p>
            <Button variant="blue" disabled={uploading} className="mt-4">
              {/* {uploading ? 'Uploading...' : 'Upload Files'} */}
              Attach Files
            </Button>
          </div>
        </>
      </DialogContent>
    </Dialog>
  )
}
