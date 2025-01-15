'use client'
import React, { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { PhoneOff, Mic, MicOff } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'
import { Send } from 'lucide-react'
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
    if (DIDSDK) return
    import('@d-id/client-sdk').then((module) => {
      setDIDSDK(module)
    })
  }, [])

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
        {/* <Card className="mx-auto w-full max-w-2xl border-0 bg-gray-800"> */}
        {/* <CardHeader>
            <CardTitle className="flex items-center justify-between">
              D-ID Agent
              <span className="text-sm font-normal">Status: {connectionStatus}</span>
            </CardTitle>
          </CardHeader> */}
        <div className="text-white">Talking to {agentDetails?.userInfo?.name ?? ''} (Avatar)</div>
        <div className="space-y-4">
          <div className="relative z-[60] aspect-video overflow-hidden rounded-lg bg-gray-800">
            {connectionStatus === 'connecting' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-white"></div>
              </div>
            )}
            <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
          </div>

          <div className="flex items-center gap-2">
            <Textarea
              className="border-0 bg-gray-800 text-gray-100 placeholder-gray-500"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
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
            <Send className="h-4 w-4" />
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
