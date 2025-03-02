import { Avatar, AvatarImage, AvatarFallback } from '~/components/ui/avatar'
import { api } from '~/trpc/react'
import { useUI } from '~/app/hooks/ui/useUI'
import { Skeleton } from '~/components/ui/skeleton'
import { useSidebar } from '~/components/ui/sidebar'

const MAX_AVATARS = 3
export function AvatarStack() {
  const { selectedChannelId } = useUI()
  const { isMobile } = useSidebar()
  const { data: channelUsers, isPending } = api.messages.getUsersInChannel.useQuery({
    channelId: selectedChannelId
  })

  return (
    <>
      {!isMobile && (
        <div className="px-3">
          <div className="flex items-center rounded-md bg-gray-700 hover:bg-gray-600">
            <div className="flex -space-x-3 py-[.30rem] pl-2">
              {isPending &&
                !channelUsers &&
                Array.from({ length: MAX_AVATARS }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className="h-8 w-8 rounded-full border-2 border-background bg-muted"
                  />
                ))}
              {channelUsers && (
                <>
                  {channelUsers.slice(0, 3).map((user) => (
                    <Avatar
                      key={user.name}
                      className="h-8 w-8 border-2 border-background ring-0 ring-background"
                    >
                      <AvatarImage src={user.image || ''} alt={user.name || ''} />
                      <AvatarFallback>{user.name}</AvatarFallback>
                    </Avatar>
                  ))}
                </>
              )}
            </div>
            <span className="px-3 text-white">{channelUsers?.length || 0}</span>
          </div>
        </div>
      )}
    </>
  )
}
