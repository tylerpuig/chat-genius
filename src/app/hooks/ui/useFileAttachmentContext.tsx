import { useState, createContext, useContext, ReactNode } from 'react'
import { api } from '~/trpc/react'
import { useUI } from './useUI'

type FileAttachmentContext = {
  files: File[]
  setFiles: React.Dispatch<React.SetStateAction<File[]>>
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  uploadToS3: (messageId: number) => Promise<void>
}

const FileAttachmentContext = createContext<FileAttachmentContext>({
  files: [],
  setFiles: () => {},
  handleFileChange: () => {},
  uploadToS3: () => Promise.resolve()
})

export function FileAttachmentProvider({ children }: { children: ReactNode }) {
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([])
  const [files, setFiles] = useState<File[]>([])
  const { selectedChannelId } = useUI()

  const saveMessageAttachments = api.messages.saveMessageAttachments.useMutation()
  const getUploadUrl = api.messages.getSignedS3UploadUrl.useMutation()

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const files = event.target.files
    console.log('Selected files:', files)
    if (!files) return

    for (const file of files) {
      setFiles((prev) => [...prev, file])
    }
  }

  async function uploadToS3(messageId: number): Promise<void> {
    if (!files.length) return

    // setIsUploading(true)
    const uploadedFileUrls: string[] = []
    const uploadedFiles: {
      fileKey: string
      fileName: string
      fileType: string
      fileSize: number
      messageId: number
    }[] = []

    try {
      for (const file of files) {
        // Get pre-signed URL
        const data = await getUploadUrl.mutateAsync({
          fileName: file.name,
          fileType: file.type
        })

        if (!data) {
          throw new Error('Failed to get pre-signed URL')
        }

        const fileKey = new URL(data.fileUrl).pathname.slice(1)

        // Upload to S3
        const uploadResponse = await fetch(data.uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type
          }
        })

        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload ${file.name}`)
        }

        uploadedFiles.push({
          fileKey,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          messageId
        })

        //   console.log(uploadResponse)

        uploadedFileUrls.push(data.fileUrl)
      }
      await saveMessageAttachments.mutateAsync({
        files: uploadedFiles,
        channelId: selectedChannelId,
        messageId
      })

      setUploadedUrls(uploadedFileUrls)
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setFiles([])
    }
  }

  return (
    <FileAttachmentContext.Provider
      value={{
        files,
        setFiles,
        handleFileChange,
        uploadToS3
      }}
    >
      {children}
    </FileAttachmentContext.Provider>
  )
}

// Custom hook to use the messages context
export function useFileAttachmentContext() {
  return useContext(FileAttachmentContext)
}
