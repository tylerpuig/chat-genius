'use client'

import { useState, useEffect } from 'react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Sheet, SheetContent } from '~/components/ui/sheet'
import { useUI } from '~/app/hooks/ui/useUI'
import { useSession } from 'next-auth/react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '~/components/ui/select'
import { api } from '~/trpc/react'
import { type EditUserInput } from '~/server/api/routers/user'
export default function UserProfileManager() {
  const [userInfo, setUserInfo] = useState<EditUserInput | undefined>()

  const { data: session } = useSession()

  const { data, refetch: refetchUserInfo } = api.user.getUserDetails.useQuery()

  const { manageUserProfileSheetOpen, setManageUserProfileSheetOpen } = useUI()

  const editUserDetails = api.user.editUserDetails.useMutation({
    onSuccess: () => {
      refetchUserInfo()
    }
  })

  useEffect(() => {
    if (data) {
      setUserInfo(data)
    }
  }, [data])

  return (
    <Sheet open={manageUserProfileSheetOpen} onOpenChange={setManageUserProfileSheetOpen}>
      <SheetContent className="scrollbar-overlay overflow-auto border-gray-700 bg-gray-900 px-1 text-gray-200">
        <div className="mt-6 bg-gray-900 px-4 text-gray-100">
          <div className="space-y-6">
            <div className="flex items-center justify-center space-x-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={session?.user?.image ?? ''} alt={userInfo?.name ?? ''} />
                <AvatarFallback>
                  {(userInfo?.name ?? '')
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </AvatarFallback>
              </Avatar>
              {/* <div>
                <Label
                  htmlFor="avatar-upload"
                  className="inline-flex cursor-pointer items-center rounded-lg bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700"
                >
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Change Avatar
                </Label>
                <Input
                  id="avatar-upload"
                  type="file"
                  className="hidden"
                  onChange={handleImageUpload}
                  accept="image/*"
                />
              </div> */}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={userInfo?.name ?? ''}
                onChange={(e) => {
                  if (!userInfo) return
                  setUserInfo((prev) => {
                    if (!prev) return
                    return { ...prev, name: e.target.value }
                  })
                }}
                className="border-0 border-gray-600 bg-gray-700 text-gray-100 focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-gray-300">
                Status
              </Label>
              <Select
                value={userInfo?.userVisibility ?? ''}
                onValueChange={(option) => {
                  setUserInfo((prev) => {
                    if (!prev) return
                    return { ...prev, userVisibility: option }
                  })
                }}
              >
                <SelectTrigger className="border-0 border-gray-600 bg-gray-700 text-gray-100">
                  <SelectValue placeholder="Select your status" />
                </SelectTrigger>
                <SelectContent className="border-gray-600 bg-gray-700">
                  <SelectItem value="active" className="text-green-400">
                    Active
                  </SelectItem>
                  <SelectItem value="away" className="text-yellow-400">
                    Away
                  </SelectItem>
                  <SelectItem value="dnd" className="text-red-400">
                    Do Not Disturb
                  </SelectItem>
                  <SelectItem value="invisible" className="text-gray-400">
                    Invisible
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Textarea
                id="status"
                value={userInfo?.userStatus ?? ''}
                onChange={(e) => {
                  if (!userInfo) return
                  setUserInfo((prev) => {
                    if (!prev) return
                    return { ...prev, userStatus: e.target.value }
                  })
                }}
                className="border-0 border-gray-600 bg-gray-700 text-gray-100 focus:border-blue-500"
              />
            </div>

            <Button
              disabled={!userInfo || editUserDetails.isPending}
              onClick={async () => {
                if (!userInfo) return
                await editUserDetails.mutateAsync(userInfo)
              }}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {editUserDetails.isPending ? 'Updating...' : 'Update Profile'}
            </Button>
          </div>

          {/* <div className="mt-8 border-t border-gray-700 pt-8">
                <h3 className="mb-4 text-xl font-semibold">Change Password</h3>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      className="border-gray-600 bg-gray-700 text-gray-100 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      className="border-gray-600 bg-gray-700 text-gray-100 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      className="border-gray-600 bg-gray-700 text-gray-100 focus:border-blue-500"
                    />
                  </div>
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                    Change Password
                  </Button>
                </form>
              </div> */}
        </div>
      </SheetContent>
    </Sheet>
  )
}
