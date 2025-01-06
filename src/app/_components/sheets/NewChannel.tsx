'use client'

import { useState, useEffect } from 'react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '~/components/ui/sheet'
import { Textarea } from '~/components/ui/textarea'
import { Switch } from '~/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'

export function NewChannelSheet() {
  const [isPublic, setIsPublic] = useState(true)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [sheetIsOpen, setSheetIsOpen] = useState(false)

  //   useEffect(() => {
  //     const timeout = setTimeout(() => {
  //       setSheetIsOpen(true)
  //     }, 1000)
  //     return () => clearTimeout(timeout)
  //   }, [])

  const toggleUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  const users: { name: string; id: string }[] = []

  for (let i = 0; i < 100; i++) {
    users.push({ name: `User ${i}`, id: i.toString() })
  }

  return (
    <Sheet open={sheetIsOpen} onOpenChange={(open) => setSheetIsOpen(open)}>
      {/* <SheetTrigger asChild> */}
      {/* <Button variant="outline" className="bg-gray-800 text-gray-200 hover:bg-gray-700">
          Create New Channel
        </Button> */}
      {/* </SheetTrigger> */}
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
              id="name"
              placeholder="e.g. marketing"
              className="col-span-3 border-gray-700 bg-gray-800 text-gray-200"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right text-gray-400">
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="What's this channel about?"
              className="col-span-3 border-gray-700 bg-gray-800 text-gray-200"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="public" className="text-right text-gray-400">
              Public
            </Label>
            <Switch
              id="public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
              className="col-span-3 bg-blue-400"
            />
          </div>
          {!isPublic && (
            <div className="mt-4 grid grid-cols-4 items-start gap-4">
              <Label className="text-right text-gray-400">Add Users</Label>
              {/* <div className="w-full rounded-md border-gray-700 bg-gray-800 p-4 text-gray-200"> */}
              <div className="scrollbar-overlay col-span-3 max-h-[20rem] space-y-2 overflow-y-auto px-2">
                {users.map((user) => (
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
        <Button className="mt-4 w-full bg-blue-600 text-gray-200 hover:bg-blue-700">
          Create Channel
        </Button>
      </SheetContent>
    </Sheet>
  )
}
