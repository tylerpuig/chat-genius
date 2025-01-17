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
import { api } from '~/trpc/react'
import { type EditUserAvatar } from '~/trpc/types'
import { ImageIcon } from 'lucide-react'

export default function UserAvatarEditor() {
  const [avatarInfo, setAvatarInfo] = useState<EditUserAvatar>({
    avatarName: '',
    avatarVideoAgentPrompt: '',
    avatarVoiceAgentPrompt: '',
    avatarTextAgentPrompt: ''
  })

  const { data: session } = useSession()
  const { data, refetch: refecthAvatarInfo } = api.user.getAvatarInfo.useQuery()
  const { userAvatarEditorOpen, setUserAvatarEditorOpen } = useUI()

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>): void {
    try {
      // open the user's file picker
      const file = e.target.files?.[0]
      if (!file) return
    } catch (error) {
      console.error('Error handling image upload:', error)
    }
  }

  const updateUserAvatar = api.user.updateUserAvatar.useMutation({
    onSuccess: () => {
      refecthAvatarInfo()
    }
  })

  useEffect(() => {
    if (data) {
      setAvatarInfo(data)
    }
  }, [data])

  return (
    <Sheet open={userAvatarEditorOpen} onOpenChange={setUserAvatarEditorOpen}>
      <SheetContent className="scrollbar-overlay overflow-auto border-gray-700 bg-gray-900 px-1 text-gray-200">
        <div className="mt-6 bg-gray-900 px-4 text-gray-100">
          <div className="space-y-6">
            <div className="flex items-center justify-center space-x-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={session?.user?.image ?? ''} alt={avatarInfo?.avatarName ?? ''} />
                <AvatarFallback>
                  {(avatarInfo?.avatarName ?? '')
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </AvatarFallback>
              </Avatar>
              <div>
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
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Avatar Name</Label>
              <Input
                id="name"
                value={avatarInfo?.avatarName ?? ''}
                onChange={(e) => {
                  setAvatarInfo((prev) => {
                    return { ...prev, avatarName: e.target.value }
                  })
                }}
                className="border-0 border-gray-600 bg-gray-700 text-gray-100 focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="video-call-prompt">Video Call Prompt</Label>
              <Textarea
                value={avatarInfo?.avatarVideoAgentPrompt ?? ''}
                onChange={(e) => {
                  setAvatarInfo((prev) => {
                    return { ...prev, avatarVideoAgentPrompt: e.target.value }
                  })
                }}
                className="border-0 border-gray-600 bg-gray-700 text-gray-100 focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Phone Call Prompt</Label>
              <Textarea
                value={avatarInfo?.avatarVoiceAgentPrompt ?? ''}
                onChange={(e) => {
                  setAvatarInfo((prev) => {
                    return { ...prev, avatarVoiceAgentPrompt: e.target.value }
                  })
                }}
                className="border-0 border-gray-600 bg-gray-700 text-gray-100 focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="text-chat-prompt">Text Chat Prompt</Label>
              <Textarea
                value={avatarInfo?.avatarTextAgentPrompt ?? ''}
                onChange={(e) => {
                  setAvatarInfo((prev) => {
                    return { ...prev, avatarTextAgentPrompt: e.target.value }
                  })
                }}
                className="border-0 border-gray-600 bg-gray-700 text-gray-100 focus:border-blue-500"
              />
            </div>

            <Button
              disabled={!avatarInfo || updateUserAvatar.isPending}
              onClick={async () => {
                if (!avatarInfo) return
                await updateUserAvatar.mutateAsync({
                  avatarName: avatarInfo.avatarName ?? '',
                  videoCallPrompt: avatarInfo.avatarVideoAgentPrompt ?? '',
                  phoneCallPrompt: avatarInfo.avatarVoiceAgentPrompt ?? '',
                  textChatPrompt: avatarInfo.avatarTextAgentPrompt ?? ''
                })
              }}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {updateUserAvatar.isPending ? 'Updating...' : 'Update Avatar'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
