'use client'

import { useState, useCallback } from 'react'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '~/components/ui/dialog'
import { useDropzone } from 'react-dropzone'
import { Upload, FileIcon } from 'lucide-react'
import { useUI } from '~/app/hooks/ui/useUI'
import { useFileAttachmentContext } from '~/app/hooks/ui/useFileAttachmentContext'

export function FileUploadModal() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const { files, setFiles } = useFileAttachmentContext()

  const { setFileUploadModalOpen, fileUploadModalOpen } = useUI()

  const handleFileUpload = (newFiles: File[]) => {
    setFiles((prevFiles) => [...prevFiles, ...newFiles])
  }

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
  }

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
            <div className="mt-4 flex justify-center gap-2">
              <FileIcon className="text-gray-400" /> {el.name}
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
              {uploading ? 'Uploading...' : 'Upload Files'}
            </Button>
          </div>
        </>
      </DialogContent>
    </Dialog>
  )
}
