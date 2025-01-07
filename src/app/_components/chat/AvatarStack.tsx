import { Avatar, AvatarImage, AvatarFallback } from '~/components/ui/avatar'
import { api } from '~/trpc/react'
import { useUI } from '~/app/hooks/ui/useUI'

type AvatarStackProps = {
  users: {
    id: string
    name: string
    image?: string
  }[]
  limit?: number
  showCount?: boolean
}

export function AvatarStack() {
  const { selectedChannelId } = useUI()
  const { data: channelUsers } = api.messages.getUsersInChannel.useQuery({
    channelId: selectedChannelId
  })

  if (!channelUsers) return null

  const usersToDisplay = channelUsers.slice(0, 3)

  return (
    <div className="flex items-center rounded-md bg-gray-700">
      <div className="flex -space-x-3 p-2">
        {usersToDisplay.map((user) => (
          <Avatar key={user.name} className="h-8 w-8 border-background ring-2 ring-background">
            <AvatarImage src={user.image || ''} alt={user.name || ''} />
            <AvatarFallback>{user.name}</AvatarFallback>
          </Avatar>
        ))}
      </div>

      <span className="px-2 text-white">{channelUsers?.length || 0}</span>
    </div>
  )
}
