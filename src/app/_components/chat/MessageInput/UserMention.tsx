'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ScrollArea } from '~/components/ui/scroll-area'
import { useUI } from '~/app/hooks/ui/useUI'
// import { api } from '~/trpc/react'
import { type ConversationUser } from '~/server/db/types'

export function UserMention({
  messageContent,
  setMessageContent,
  cursorPosition,
  showUserList,
  setShowUserList
}: {
  messageContent: string
  setMessageContent: React.Dispatch<React.SetStateAction<string>>
  cursorPosition: number
  showUserList: boolean
  setShowUserList: React.Dispatch<React.SetStateAction<boolean>>
}) {
  const { selectedChannelId, conversationUser, isConversation, setConversationUser } = useUI()
  const [users, setUsers] = useState<ConversationUser[]>([])
  const [filteredUsers, setFilteredUsers] = useState(users)
  const inputRef = useRef<HTMLInputElement>(null)
  const userListRef = useRef<HTMLDivElement>(null)

  // useEffect(() => {
  //   function handleClickOutside(event: MouseEvent) {
  //     if (userListRef.current && !userListRef.current.contains(event.target as Node)) {
  //       setShowUserList(false)
  //     }
  //   }

  //   document.addEventListener('mousedown', handleClickOutside)
  //   return () => document.removeEventListener('mousedown', handleClickOutside)
  // }, [setShowUserList])

  useEffect(() => {
    if (isConversation && conversationUser) {
      const botUser = structuredClone(conversationUser)
      botUser.name = botUser.name + ' (bot)'
      setUsers([botUser, conversationUser])
    } else {
      setUsers([])
      setConversationUser(null)
    }
  }, [conversationUser, isConversation])

  useEffect(() => {
    try {
      const textBeforeCursor = messageContent.slice(0, cursorPosition)
      const lastAtSymbolIndex = textBeforeCursor.lastIndexOf('@')

      if (lastAtSymbolIndex !== -1 && lastAtSymbolIndex < cursorPosition) {
        const query = messageContent
          .slice(lastAtSymbolIndex + 1, cursorPosition)
          .toLowerCase()
          .trim()

        const hasSpaceAfterQuery = /\s/.test(query)

        if (!hasSpaceAfterQuery) {
          setFilteredUsers(
            users.filter((user) => {
              if (!user?.name) return false
              return user.name.toLowerCase().includes(query)
            })
          )
          setShowUserList(true)
          return
        }
      }

      setShowUserList(false)
    } catch (error) {
      console.error('Error handling user list:', error)
    }
  }, [messageContent, cursorPosition, users])

  const handleUserSelect = (userName: string) => {
    // try {
    //   const textBeforeCursor = messageContent.slice(0, cursorPosition)
    //   const lastAtSymbolIndex = textBeforeCursor.lastIndexOf('@')

    //   if (lastAtSymbolIndex !== -1) {
    //     const newValue =
    //       messageContent.slice(0, lastAtSymbolIndex) +
    //       '@' +
    //       userName +
    //       ' ' +
    //       messageContent.slice(cursorPosition)
    //     setMessageContent(newValue)
    //   }
    // } catch (error) {
    //   console.error('Error handling user select:', error)
    // } finally {
    //   inputRef.current?.focus()
    setMessageContent((prev) => prev + userName)
    setShowUserList(false)
    // }
  }

  if (!users.length) return null
  return (
    <div
      key={selectedChannelId}
      className="absolute bottom-full left-0 right-0 w-full"
      ref={userListRef}
    >
      {showUserList && (
        <ScrollArea className="mb-2 max-h-48 w-full rounded-md border border-gray-700 bg-gray-900 shadow-lg">
          {filteredUsers.map((user) => (
            <button
              key={user.name + user.id}
              onClick={() => {
                if (!user?.name) return
                handleUserSelect(user.name)
              }}
              className="w-full px-4 py-2 text-left text-white hover:bg-gray-800 focus:bg-gray-800 focus:outline-none"
            >
              {user.name}
            </button>
          ))}
        </ScrollArea>
      )}
    </div>
  )
}
