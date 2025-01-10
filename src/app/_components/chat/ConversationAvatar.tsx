import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Badge } from '~/components/ui/badge'
import { UserCheck, UserMinus } from 'lucide-react'
import { useUI } from '~/app/hooks/ui/useUI'

export function ConversationAvatar() {
  const { conversationUser, isConversation } = useUI()

  if (!isConversation || !conversationUser) return null
  const { name, image, lastOnline } = conversationUser
  const initials = (name ?? '')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  const isOnline = lastOnline ? new Date().getTime() - lastOnline.getTime() < 1000 * 60 * 5 : false

  return (
    // <div className="flex items-center space-x-4 rounded-lg bg-gray-800 p-3">
    <div className="flex items-center space-x-4">
      <div className="">
        <Avatar className="h-12 w-12 border-2 border-gray-700">
          <AvatarImage src={image ?? ''} alt={name ?? ''} />
          <AvatarFallback className="bg-gray-700 text-gray-300">{initials}</AvatarFallback>
        </Avatar>
        <Badge
          variant="outline"
          className={`absolute bottom-2 left-9 h-4 w-4 rounded-full border p-0 ${
            isOnline ? 'border-green-600 bg-green-500' : 'border-gray-600 bg-gray-500'
          }`}
        >
          {isOnline ? (
            <UserCheck className="h-3 w-3 text-gray-900" />
          ) : (
            <UserMinus className="h-3 w-3 text-gray-400" />
          )}
        </Badge>
      </div>
      <div>
        <p className="text-lg font-medium text-gray-200">{name}</p>
        <p className="text-sm text-gray-400">{isOnline ? 'Online' : 'Offline'}</p>
        {conversationUser?.userStatus && (
          <p className="text-xs text-gray-500">{conversationUser?.userStatus}</p>
        )}
      </div>
    </div>
    // </div>
  )
}
