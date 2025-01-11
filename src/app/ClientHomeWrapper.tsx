'use client'

import { ChatContainer, ChatInput, MessageInput } from './_components/chat/ChatContainer'
import { NewChannelSheet } from './_components/sheets/NewChannel'
import { ViewMessageRepliesSheet } from './_components/sheets/MessageReplies'
import { useUI } from '~/app/hooks/ui/useUI'
import { type UIView } from '~/app/store/features/ui/types'
import ChatTabs from './_components/chat/ChatTabs'
import { AppSidebar } from './_components/AppSidebar'
import { FileUploadModal } from './_components/chat/FileUpload'
import { MessageAttachmentsSheet } from './_components/sheets/MessageAttachments'
import { useSession } from 'next-auth/react'
import { useState } from 'react'
import { api } from '~/trpc/react'
import UserProfileManager from './_components/user/profile/UserProfileManager'
import { WorkspaceSearchDialog } from './_components/chat/WorkspaceSearch'
import RichTextEditor from './_components/chat/MessageInput/RichTextEditor'

const homeComponents: Record<UIView, JSX.Element> = {
  channel: <ChannelView />,
  conversation: <></>
  // profile: <UserProfileManager />
}

function HomeComponentToRender() {
  const { uiView } = useUI()
  return homeComponents[uiView] || <ChatContainer />
}

function ChannelView() {
  const { selectedChannelId } = useUI()
  const { data: session } = useSession()
  const [messageContent, setMessageContent] = useState('')

  const createMessage = api.messages.sendMessage.useMutation({
    onSettled: () => {
      setMessageContent('')
    }
  })

  async function sendMessage(): Promise<number> {
    try {
      if (!session?.user.id || !messageContent) return 0
      const newMessage = await createMessage.mutateAsync({
        content: messageContent,
        channelId: selectedChannelId,
        userId: session?.user.id
      })

      return newMessage?.[0]?.id || 0
    } catch (error) {
      console.error('Error sending message:', error)
    }

    return 0
  }
  return (
    <>
      <ChatContainer />
      {/* <MessageInput
        sendMessage={sendMessage}
        messageContent={messageContent}
        setMessageContent={setMessageContent}
      /> */}
      <RichTextEditor />
      {/* <ChatInput /> */}
    </>
  )
}

export default function ClientHomeWrapper() {
  return (
    <div className="flex h-screen">
      <AppSidebar />
      <div className="flex-1">
        <div className="flex h-full flex-col">
          <ChatTabs />
          <div className="relative flex flex-1 flex-col overflow-hidden">
            <HomeComponentToRender />
          </div>
        </div>
        <NewChannelSheet />
        <ViewMessageRepliesSheet />
        <FileUploadModal />
        <MessageAttachmentsSheet />
        <UserProfileManager />
        <WorkspaceSearchDialog />
      </div>
    </div>
  )
}
