'use client'
import { useEffect, useRef, useState } from 'react'
import { PhoneOff, Mic, MicOff, SendHorizonal, WandSparkles, Phone } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Dialog, DialogContent } from '~/components/ui/dialog'
import { useToggle } from '@mantine/hooks'
import { Textarea } from '~/components/ui/textarea'
import { api } from '~/trpc/react'
import { useUI } from '~/app/hooks/ui/useUI'
import axios from 'axios'
import { useVoiceVisualizer, VoiceVisualizer } from 'react-voice-visualizer'

const elevenLabsKey = process.env.NEXT_PUBLIC_ELEVEN_LABS_KEY

export default function AgentPhoneCallDialog() {
  const { userVoiceChatConfig, setUserVoiceChatConfig } = useUI()
  const [message, setMessage] = useState('')
  const [connectionStatus, setConnectionStatus] = useState<string>('Disconnected')
  const [isMicOn, toggleMic] = useToggle([false, true])
  const audioContext = useRef<AudioContext | null>(null)

  // Initialize the recorder controls using the hook
  const recorderControls = useVoiceVisualizer()
  const { recordedBlob, startRecording, setPreloadedAudioBlob, togglePauseResume, stopRecording } =
    recorderControls

  const getUserAvatarResponse = api.integrations.getUserAvatarResponse.useMutation()

  const { data: agentDetails } = api.integrations.getUserAgentDetails.useQuery(
    {
      toUserId: userVoiceChatConfig.toUserId
    },
    {
      enabled: userVoiceChatConfig.dialogOpen
    }
  )

  useEffect(() => {
    if (isMicOn) {
      startRecording()
    } else {
      stopRecording()
    }
  }, [isMicOn])

  async function handleSendMessage(): Promise<void> {
    try {
      if (!message.trim() || !agentDetails?.agentId) {
        throw new Error('Invalid message or agent ID')
      }

      const response = await getUserAvatarResponse.mutateAsync({
        toUserId: userVoiceChatConfig.toUserId,
        query: message
      })

      const baseUrl = 'https://api.elevenlabs.io/v1/text-to-speech'
      const headers = {
        'Content-Type': 'application/json',
        'xi-api-key': elevenLabsKey!
      }

      const requestBody = {
        text: response?.avatarResponse ?? ''
      }

      const audioResponse = await axios.post(`${baseUrl}/${'21m00Tcm4TlvDq8ikWAM'}`, requestBody, {
        headers,
        responseType: 'blob'
      })

      if (audioResponse.status === 200) {
        const audioBlob = new Blob([audioResponse.data], { type: 'audio/mpeg' })
        setPreloadedAudioBlob(audioBlob)
        await new Promise((resolve) => setTimeout(resolve, 1000))
        togglePauseResume()
      }

      setMessage('')
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  function closeAndCleanupCall(): void {
    setUserVoiceChatConfig({ ...userVoiceChatConfig, dialogOpen: false })
    setConnectionStatus('Disconnected')
    setMessage('')

    if (audioContext.current) {
      audioContext.current.close()
      audioContext.current = null
    }
  }

  return (
    <Dialog
      open={userVoiceChatConfig.dialogOpen}
      onOpenChange={(open) => {
        if (!open) {
          closeAndCleanupCall()
        }
      }}
    >
      <DialogContent className="border-0 bg-gray-900">
        <div className="text-white">Talking to {agentDetails?.userInfo?.name ?? ''} (Avatar)</div>

        <div className="relative z-[60] space-y-4">
          <div className="">
            <VoiceVisualizer controls={recorderControls} isControlPanelShown={true} />

            {connectionStatus === 'connecting' && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-16 w-16 animate-ping rounded-full bg-blue-500 opacity-75" />
                  </div>
                  <div className="relative z-10 animate-bounce">
                    <Phone className="h-16 w-16 text-blue-400" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Textarea
              className="border-0 bg-gray-800 text-gray-100 placeholder-gray-500"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
            />
          </div>

          <Button
            className="w-full"
            onClick={handleSendMessage}
            variant="blue"
            disabled={getUserAvatarResponse.isPending}
          >
            {getUserAvatarResponse.isPending ? <>Sending...</> : 'Send Message'}
            <WandSparkles className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex justify-center gap-4">
          <Button variant="destructive" onClick={closeAndCleanupCall}>
            <PhoneOff className="mr-2 h-4 w-4" />
            Hang Up
          </Button>
          <Button
            variant="blue"
            onClick={() => {
              toggleMic()
            }}
          >
            {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
