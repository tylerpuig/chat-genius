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
    <div className="flex px-3">
      {/* Added consistent padding */}
      <div className="flex items-center rounded-md bg-gray-700">
        <div className="flex -space-x-3 py-[.30rem] pl-2">
          {/* Added left padding to avatar group */}
          {usersToDisplay.map((user) => (
            <Avatar
              key={user.name}
              className="h-8 w-8 border-2 border-background ring-0 ring-background"
            >
              <AvatarImage src={user.image || ''} alt={user.name || ''} />
              <AvatarFallback>{user.name}</AvatarFallback>
            </Avatar>
          ))}
        </div>
        <span className="px-3 text-white">{channelUsers?.length || 0}</span>
      </div>
    </div>
  )
}
