import { useState, createContext, useContext, ReactNode } from 'react'
import { api } from '~/trpc/react'
import { type ChatMessageData } from '~/trpc/types'
import { useUI } from './useUI'

type FileAttachmentContext = {
  files: File[]
  setFiles: React.Dispatch<React.SetStateAction<File[]>>
}

const FileAttachmentContext = createContext<FileAttachmentContext>({
  files: [],
  setFiles: () => {}
})

export function FileAttachmentProvider({ children }: { children: ReactNode }) {
  //   const { selectedChannelId, setSelectedChannelId, setSelectedChannelName, currentTab } = useUI()

  const [uploadedUrls, setUploadedUrls] = useState<string[]>([])
  const [files, setFiles] = useState<File[]>([])

  return (
    <FileAttachmentContext.Provider
      value={{
        files,
        setFiles
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
