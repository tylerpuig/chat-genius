'use client'
import { useEffect } from 'react'
import { Button } from '~/components/ui/button'
import { Sheet, SheetContent, SheetHeader } from '~/components/ui/sheet'
import { Phone, MoreVertical, MessageSquare } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { useUI } from '~/app/hooks/ui/useUI'
import { api } from '~/trpc/react'
import { useChannelContext } from '~/app/hooks/ui/useChannelContext'

export default function UserProfileChat() {
  const {
    userProfileChatConfig,
    setUserProfileChatConfig,
    setSelectedChannelId,
    setConversationUser,
    setIsConversation,
    userAgentChatConfig,
    setUserAgentChatConfig
  } = useUI()

  const { userList } = useChannelContext()

  function getUserConversationId(userId: string): number | undefined {
    try {
      for (const user of userList) {
        if (user.id === userId) {
          return user.channelId || 0
        }
      }
    } catch (error) {
      console.error('Error getting user conversation ID:', error)
    }
  }

  const getUserProfileDetails = api.user.getUserProfileDetails.useQuery({
    userId: userProfileChatConfig?.userId
  })

  if (!getUserProfileDetails.data) {
    return null
  }

  const isOnline = getUserProfileDetails?.data?.lastOnline
    ? new Date().getTime() - getUserProfileDetails.data.lastOnline.getTime() < 1000 * 60 * 5
    : false

  return (
    <Sheet
      open={userProfileChatConfig.sheetOpen}
      onOpenChange={(open) => {
        setUserProfileChatConfig({ ...userProfileChatConfig, sheetOpen: open })
      }}
    >
      <SheetContent className="scrollbar-overlay overflow-auto border-gray-700 bg-gray-900 px-1 text-gray-200">
        <SheetHeader></SheetHeader>
        <div className="bg-gray-900 p-4 text-gray-100">
          {/* <div className="text-2xl font-bold text-blue-400">User Profile</div> */}
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={getUserProfileDetails.data?.image ?? ''} alt="User avatar" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold text-slate-300">
                {getUserProfileDetails.data?.name}
              </h2>
              <p className="text-gray-400">{getUserProfileDetails.data?.userStatus ?? ''}</p>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-center gap-2">
            <div className="flex items-center gap-1.5">
              {isOnline ? (
                <>
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-sm text-green-500">Online</span>
                </>
              ) : (
                <>
                  <div className="h-2 w-2 rounded-full bg-red-500"></div>
                  <span className="text-sm text-red-500">Offline</span>
                </>
              )}
            </div>
            <span className="text-gray-500">•</span>
            <span className="text-sm text-gray-400">Last seen: 2m ago</span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-4">
          <Button
            onClick={() => {
              const channelId = getUserConversationId(userProfileChatConfig.userId)
              if (getUserProfileDetails.data && channelId) {
                setSelectedChannelId(channelId)
                setConversationUser(getUserProfileDetails.data)
                setIsConversation(true)
                setUserProfileChatConfig({
                  ...userProfileChatConfig,
                  sheetOpen: false
                })
              }
            }}
            variant="channel"
            className=""
          >
            <MessageSquare className="!h-6 !w-6 stroke-blue-400" />
            <span className="sr-only">Chat</span>
          </Button>
          <Button
            onClick={() => {
              setUserAgentChatConfig({
                ...userAgentChatConfig,
                toUserId: getUserProfileDetails.data?.id ?? '',
                dialogOpen: true
              })
            }}
            variant="channel"
            className=""
          >
            <Phone className="!h-6 !w-6 stroke-blue-400" />
            <span className="sr-only">Call</span>
          </Button>
          <Button variant="channel" className="">
            <MoreVertical className="!h-6 !w-6 stroke-blue-400" />
            <span className="sr-only">More</span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// {
//   response && (
//     <div className="mt-4 space-y-2">
//       {/* <h3 className="text-lg font-semibold text-blue-400">Responses:</h3> */}
//       <Card className="border-gray-600 bg-gray-700">
//         <CardContent className="py-3">
//           <ScrollArea className="h-64 flex-1 rounded-md">
//             <p className="text-gray-200">{response}</p>
//           </ScrollArea>
//         </CardContent>
//       </Card>
//     </div>
//   )
// }

// ;<div className="mt-6 space-y-4">
//   {!showChat ? (
//     <div className="flex justify-center">
//       <Button
//         onClick={() => setShowChat(true)}
//         className="flex items-center gap-2 bg-[#2563eb] text-white hover:bg-blue-600"
//       >
//         <Bot className="h-4 w-4" />
//         Start AI Chat
//       </Button>
//     </div>
//   ) : (
//     <div className="space-y-4">
//       <div className="flex gap-2">
//         <Input
//           type="text"
//           placeholder="Ask a question..."
//           value={question}
//           onChange={(e) => setQuestion(e.target.value)}
//           onKeyDown={(e) => {
//             if (e.key === 'Enter') {
//               handleAskQuestion()
//             }
//           }}
//           className="flex-grow border-gray-700 bg-gray-800 text-gray-100 placeholder:text-gray-500"
//         />
//         <Button onClick={handleAskQuestion} className="bg-[#2563eb] text-white hover:bg-blue-600">
//           Ask
//         </Button>
//       </div>
//     </div>
//   )}
// </div>

// function handleAskQuestion(): void {
//   try {
//     if (question.trim() && userProfileChatConfig.userId) {
//       askUserProfileQuestion.mutate({
//         userId: userProfileChatConfig.userId,
//         question: question
//       })
//     }
//   } catch (error) {
//     console.error('Error handling ask question:', error)
//   }
// }

// useEffect(() => {
//   setShowChat(false)
//   setResponse('')
//   setQuestion('')
// }, [userProfileChatConfig.userId])
