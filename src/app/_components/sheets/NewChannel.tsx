'use client'

import { useState, useRef } from 'react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '~/components/ui/sheet'
import { Textarea } from '~/components/ui/textarea'
import { Switch } from '~/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { api } from '~/trpc/react'
import { useSession } from 'next-auth/react'
import { useUI } from '~/app/hooks/ui/useUI'

export function NewChannelSheet() {
  const session = useSession()
  const { channelSheetOpen, setChannelSheetOpen } = useUI()

  const [isPrivate, setIsPrivate] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])

  const createChannel = api.messages.createChannel.useMutation({
    onSuccess: (data) => {
      if (data) {
        setChannelSheetOpen(false)
      }
      console.log(data)
    }
  })

  const toggleUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  const channelNameRef = useRef<HTMLInputElement>(null)
  const channelDescriptionRef = useRef<HTMLTextAreaElement>(null)

  const userList = api.messages.getUsers.useQuery(undefined, {
    enabled: isPrivate
  })

  function createChannelNewChannel(): void {
    if (channelNameRef.current?.value && session.data?.user.id) {
      createChannel.mutate({
        name: channelNameRef.current.value,
        description: channelDescriptionRef.current?.value || '',
        userId: session.data?.user.id,
        isPrivate: isPrivate,
        userIds: selectedUsers
      })
    }
  }

  return (
    <Sheet
      open={channelSheetOpen}
      onOpenChange={(open) => {
        setChannelSheetOpen(open)
        setIsPrivate(false)
        setSelectedUsers([])
      }}
    >
      <SheetContent className="scrollbar-overlay overflow-auto border-gray-700 bg-gray-900 text-gray-200">
        <SheetHeader>
          <SheetTitle className="text-gray-200">Create a new channel</SheetTitle>
          <SheetDescription className="text-gray-400">
            Set up a new channel for your team to collaborate.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right text-gray-400">
              Name
            </Label>
            <Input
              ref={channelNameRef}
              id="name"
              placeholder="e.g. marketing"
              className="col-span-3 border-0 border-gray-700 bg-gray-800 text-gray-200"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right text-gray-400">
              Description
            </Label>
            <Textarea
              ref={channelDescriptionRef}
              id="description"
              placeholder="What's this channel about?"
              className="col-span-3 border-0 border-gray-700 bg-gray-800 text-gray-200"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="public" className="text-right text-gray-400">
              Private
            </Label>
            <Switch
              id="public"
              checked={!!isPrivate}
              onCheckedChange={setIsPrivate}
              className="col-span-3 bg-blue-400"
            />
          </div>
          {isPrivate && (
            <div className="mt-4 grid grid-cols-4 items-start gap-4">
              <Label className="text-right text-gray-400">Add Users</Label>
              {/* <div className="w-full rounded-md border-gray-700 bg-gray-800 p-4 text-gray-200"> */}
              <div className="scrollbar-overlay col-span-3 max-h-[20rem] space-y-2 overflow-y-auto px-2 py-1">
                {userList.data?.map((user) => (
                  <div key={user.id} className="grid grid-cols-[32px_1fr_100px] items-center gap-4">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={`https://api.dicebear.com/6.x/initials/svg?seed=${user.name}`}
                      />
                      <AvatarFallback>{user.id}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <span className="block truncate">{user.name}</span>
                    </div>
                    <Button
                      variant="blue"
                      size="sm"
                      className={
                        selectedUsers.includes(user.id)
                          ? 'bg-blue-600 text-gray-200'
                          : 'bg-gray-800 text-gray-200'
                      }
                      onClick={() => toggleUser(user.id)}
                    >
                      {selectedUsers.includes(user.id) ? 'Added' : 'Add'}
                    </Button>
                  </div>
                ))}
              </div>
              {/* </div> */}
            </div>
          )}
        </div>
        <Button
          onClick={() => {
            createChannelNewChannel()
          }}
          className="mt-4 w-full bg-blue-600 text-gray-200 hover:bg-blue-700"
        >
          Create Channel
        </Button>
      </SheetContent>
    </Sheet>
  )
}
