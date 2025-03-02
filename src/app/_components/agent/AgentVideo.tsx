'use client'
import { useEffect, useRef, useState } from 'react'
import { PhoneOff, Mic, MicOff, SendHorizonal, WandSparkles, Phone, Video } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Dialog, DialogContent } from '~/components/ui/dialog'
import * as DIDSDKType from '@d-id/client-sdk'
import { useToggle } from '@mantine/hooks'
import { Textarea } from '~/components/ui/textarea'
import { api } from '~/trpc/react'
import { useUI } from '~/app/hooks/ui/useUI'

type MessageDisplay = {
  role: 'user' | 'assistant'
  content: string
  id: string
}
const clientKey = process.env.NEXT_PUBLIC_D_ID_CLIENT_KEY

export default function AgentVideoDialog() {
  const { userAgentChatConfig, setUserAgentChatConfig } = useUI()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [message, setMessage] = useState('')
  const [connectionStatus, setConnectionStatus] = useState<string>('Disconnected')
  const [agentManager, setAgentManager] = useState<DIDSDKType.AgentManager | null>(null)
  const [messages, setMessages] = useState<DIDSDKType.Message[]>([])
  const [videoStreamState, setVideoStreamState] = useState<'STOP' | 'START'>('STOP')
  const [recognition, setRecognition] = useState<SpeechRecognition>()
  const [DIDSDK, setDIDSDK] = useState<typeof DIDSDKType | null>(null)
  const [isMicOn, toggleMic] = useToggle([false, true])
  const srcObjectRef = useRef<MediaStream>()

  const getUserAvatarResponse = api.integrations.getUserAvatarResponse.useMutation()

  const { data: agentDetails } = api.integrations.getUserAgentDetails.useQuery({
    toUserId: userAgentChatConfig.toUserId
  })

  function closeAndCleanupCall(): void {
    setUserAgentChatConfig({ ...userAgentChatConfig, dialogOpen: false })
    if (agentManager) {
      agentManager.disconnect()
    }
    setAgentManager(null)
    setMessages([])
    setConnectionStatus('Disconnected')
    setMessage('')
  }

  useEffect(() => {
    // Import SDK dynamically
    import('@d-id/client-sdk').then((module) => {
      setDIDSDK(module)
    })
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      console.error('Speech recognition not supported in this browser')
      return
    }

    const recognition = new SpeechRecognition()

    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event) => {
      try {
        if (!event.results.length) {
          return
        }

        const transcript = Array.from(event.results)
          .map((result) => result[0])
          .map((result) => {
            if (result) {
              return result.transcript
            }
          })
          .join('')

        setMessage(transcript)
      } catch (err) {
        console.error('Error processing speech:', err)
      }
    }

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
    }

    setRecognition(recognition)

    return () => {
      recognition.stop()
    }
  }, [])

  useEffect(() => {
    if (!recognition) return
    if (isMicOn) {
      recognition?.start()
    } else {
      recognition?.stop()
    }
  }, [isMicOn, recognition])

  useEffect(() => {
    const checkVideoPlayback = () => {
      if (videoRef.current && !videoRef.current.paused && isMicOn) {
        toggleMic() // Turn off mic when video is actually playing
      }
    }

    // Set up event listener for when video starts playing
    videoRef.current?.addEventListener('play', checkVideoPlayback)

    return () => {
      videoRef.current?.removeEventListener('play', checkVideoPlayback)
    }
  }, [isMicOn])

  useEffect(() => {
    const initializeAgent = async () => {
      if (!DIDSDK || !clientKey || !agentDetails?.agentId || !userAgentChatConfig.dialogOpen) {
        console.log('DIDSDK, clientKey, or agentId is not defined')
        return
      }

      setConnectionStatus('connecting')

      const callbacks = {
        onSrcObjectReady(srcObject: MediaStream): void {
          console.log('onSrcObjectReady:', srcObject)
          if (videoRef.current) {
            videoRef.current.srcObject = srcObject
            srcObjectRef.current = srcObject
          }
        },

        onConnectionStateChange(state: string): void {
          console.log('Connection state:', state)
          setConnectionStatus(state)
        },

        onVideoStateChange(state: string): void {
          console.log('Video state:', state)
          if (state === 'STOP') {
            if (videoRef.current) {
              //   captureLastFrame()
              //   setShowCanvas(true)
              videoRef.current.muted = true
            }
          } else {
            // setShowCanvas(false)
            if (videoRef.current) {
              videoRef.current.muted = false
              if (srcObjectRef.current) {
                videoRef.current.srcObject = srcObjectRef.current
              }
            }
            setConnectionStatus('Online')
          }
        },

        onNewMessage(messages: MessageDisplay[], type: 'answer' | 'partial' | 'user'): void {
          console.log('New message:', messages, type)
          if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1]
            if (type === 'answer' || type === 'user') {
              if (!lastMessage) return
              setMessages((prev) => [...prev, lastMessage])
            }
          }
        },

        onError(error: Error, errorData: object): void {
          console.error('Error:', error, errorData)
          setConnectionStatus('Error')
        }
      }

      const streamOptions: DIDSDKType.AgentManagerOptions['streamOptions'] = {
        compatibilityMode: 'auto',
        streamWarmup: true,
        // sessionTimeout: 20,
        streamGreeting: true
      }

      try {
        console.log('Initializing D-ID agent with:', { agentId: agentDetails.agentId })

        const manager = await DIDSDK.createAgentManager(agentDetails.agentId, {
          auth: { type: 'key', clientKey },
          callbacks: callbacks,
          streamOptions
        })

        setAgentManager(manager)
        manager.connect()
      } catch (error) {
        console.error('Failed to initialize agent:', error)
      }
    }

    initializeAgent()

    return () => {
      if (agentManager) {
        agentManager.disconnect()
      }
    }
  }, [DIDSDK, userAgentChatConfig, agentDetails?.agentId])

  async function handleSendMessage(): Promise<void> {
    try {
      if (!message.trim() || !agentManager || !agentDetails?.agentId) {
        throw new Error('Invalid message or agent ID')
      }

      const response = await getUserAvatarResponse.mutateAsync({
        toUserId: userAgentChatConfig.toUserId,
        query: message
      })

      await agentManager.speak({
        type: 'text',
        input: response.avatarResponse
      })
      setMessage('')
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  return (
    <Dialog
      open={userAgentChatConfig.dialogOpen}
      onOpenChange={(open) => {
        if (!open) {
          closeAndCleanupCall()
        }
      }}
    >
      <DialogContent className="border-0 bg-gray-900">
        <div className="text-white">Talking to {agentDetails?.userInfo?.name ?? ''} (Avatar)</div>
        <div className="relative z-[60] space-y-4">
          <div className="relative z-[60] aspect-video overflow-hidden rounded-lg bg-gray-800">
            <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />

            {connectionStatus === 'connecting' && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-16 w-16 animate-ping rounded-full bg-blue-500 opacity-75"></div>
                  </div>
                  <div className="relative z-10 animate-bounce">
                    <Video className="h-16 w-16 text-blue-400" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Textarea
              className="border-0 bg-gray-800 text-gray-100 placeholder-gray-500"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value)

                if (recognition && !e.target.value.trim().length) {
                  // recognition.
                }
              }}
              placeholder="Type a message..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSendMessage()
                }
              }}

              // disabled={connectionStatus !== 'connected'}
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
          <Button
            variant="destructive"
            onClick={() => {
              closeAndCleanupCall()
            }}
          >
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
        {/* </Card> */}
      </DialogContent>
    </Dialog>
  )
}
