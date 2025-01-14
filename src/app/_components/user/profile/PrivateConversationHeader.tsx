'use client'

import { useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Button } from '~/components/ui/button'
import { PhoneCall, MoreVertical } from 'lucide-react'
import { api } from '~/trpc/react'
import { useUI } from '~/app/hooks/ui/useUI'

export default function PrivateConversationHeader() {
  const { userProfileChatConfig, setConversationUser } = useUI()
  const userProfileDetails = api.user.getUserProfileDetails.useQuery({
    userId: userProfileChatConfig.userId
  })

  useEffect(() => {
    if (!userProfileDetails.data) return
    setConversationUser(userProfileDetails.data)
  }, [userProfileDetails.data])

  // console.log('userProfileDetails', userProfileDetails.data)
  // console.log('userProfileChatConfig', userProfileChatConfig)

  if (!userProfileDetails.data) {
    return null
  }

  const isOnline = userProfileDetails.data.lastOnline
    ? new Date().getTime() - userProfileDetails.data.lastOnline.getTime() < 1000 * 60 * 5
    : false

  return (
    <div
      key={userProfileChatConfig.userId + userProfileDetails.data.lastOnline}
      className="border-b border-blue-400 duration-300 animate-in slide-in-from-top"
    >
      <div className="flex h-16 items-center justify-between bg-gray-900 px-4 text-gray-300 shadow-md">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Avatar className="h-8 w-8 border-0 border-border">
              <AvatarImage
                src={userProfileDetails.data?.image ?? ''}
                alt={userProfileDetails.data?.name ?? ''}
              />
              <AvatarFallback className="text-md">{userProfileDetails.data?.name}</AvatarFallback>
            </Avatar>
            <div
              className={`absolute -bottom-0 -right-0 h-2.5 w-2.5 rounded-full ${
                isOnline ? 'bg-emerald-500' : 'bg-zinc-500'
              }`}
              aria-hidden="true"
            />
          </div>
          <div>
            <h2 className="text-sm font-semibold">{userProfileDetails.data?.name}</h2>
            <p className="text-xs text-gray-400">{userProfileDetails.data?.userStatus}</p>
            {/* <p className="text-xs text-green-500">Online</p> */}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {/* <span className="text-xs">{currentTime.toLocaleTimeString()}</span> */}
          <Button
            size="icon"
            variant="ghost"
            className="text-gray-300 hover:bg-gray-800 hover:text-blue-400"
          >
            <PhoneCall className="h-5 w-5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="text-gray-300 hover:bg-gray-800 hover:text-blue-400"
          >
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
