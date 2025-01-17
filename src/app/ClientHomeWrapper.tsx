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
import MessageEditor from './_components/chat/MessageInput/MessageEditor'
import UserProfileChat from './_components/user/profile/UserProfileChat'
import { ChatSummaryDialog } from './_components/chat/ChatSummaryDialog'
import AgentVideoDialog from './_components/agent/AgentVideo'
import AgentPhoneCall from './_components/agent/AgentPhoneCall'
import UserAvatarEditor from './_components/user/profile/UserAvatarEditor'

const homeComponents: Record<UIView, JSX.Element> = {
  channel: <ChannelView />,
  conversation: <></>
  // profile: <UserProfileManager />
}

function HomeComponentToRender() {
  const { uiView } = useUI()
  return homeComponents[uiView] || <ChatContainer />
}

function isMessageForChatBot(message: string): boolean {
  try {
    return message.includes('@') && message.includes('(bot)')
  } catch (err) {
    console.error('Error checking if message is for chat bot:', err)
  }
  return false
}

function ChannelView() {
  const { selectedChannelId, conversationUser, isConversation } = useUI()
  const { data: session } = useSession()
  const [messageContent, setMessageContent] = useState('')

  const createMessage = api.messages.sendMessage.useMutation({
    onSettled: () => {
      setMessageContent('')
    }
  })

  const createBotMessage = api.integrations.sendMessageToUserWithBot.useMutation({
    onSettled: () => {
      setMessageContent('')
    }
  })

  async function sendMessage(): Promise<number> {
    try {
      if (!session?.user.id || !messageContent) return 0

      if (isConversation && conversationUser && isMessageForChatBot(messageContent)) {
        const messageCopy = messageContent
        setMessageContent('')
        const newMessage = await createBotMessage.mutateAsync({
          userId: session?.user.id,
          content: messageCopy,
          channelId: selectedChannelId,
          toUserId: conversationUser.id
        })
        return newMessage?.id || 0
      }

      const newMessage = await createMessage.mutateAsync({
        content: messageContent,
        channelId: selectedChannelId,
        userId: session?.user.id
      })

      return newMessage?.id || 0
    } catch (error) {
      console.error('Error sending message:', error)
    }

    return 0
  }
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-hidden">
        <ChatContainer />
      </div>
      <MessageEditor
        sendMessage={sendMessage}
        setMessageContent={setMessageContent}
        messageContent={messageContent}
      />
    </div>
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
        <UserProfileChat />
        <ChatSummaryDialog />
        <AgentVideoDialog />
        <AgentPhoneCall />
        <UserAvatarEditor />
      </div>
    </div>
  )
}
