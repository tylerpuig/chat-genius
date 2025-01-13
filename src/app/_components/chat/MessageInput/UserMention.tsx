'use client'

import React, { useState, useRef, useEffect } from 'react'
// import { Input } from '@/components/ui/input'
import { ScrollArea } from '~/components/ui/scroll-area'

// Mock user data - replace with your actual user data source

const users = [
  { id: 1, name: 'John Doe' },
  { id: 2, name: 'Jane Smith' },
  { id: 3, name: 'Bob Johnson' },
  { id: 4, name: 'Alice Williams' },
  { id: 5, name: 'David Lee' },
  { id: 6, name: 'Sarah Brown' },
  { id: 7, name: 'Michael Johnson' }
]
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
  const [filteredUsers, setFilteredUsers] = useState(users)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const textBeforeCursor = messageContent.slice(0, cursorPosition)
    const lastAtSymbolIndex = textBeforeCursor.lastIndexOf('@')

    if (lastAtSymbolIndex !== -1 && lastAtSymbolIndex < cursorPosition) {
      const query = messageContent
        .slice(lastAtSymbolIndex + 1, cursorPosition)
        .toLowerCase()
        .trim()

      const hasSpaceAfterQuery = /\s/.test(query)

      if (!hasSpaceAfterQuery) {
        setFilteredUsers(users.filter((user) => user.name.toLowerCase().includes(query)))
        setShowUserList(true)
        return
      }
    }

    setShowUserList(false)
  }, [messageContent, cursorPosition])

  const handleUserSelect = (userName: string) => {
    const textBeforeCursor = messageContent.slice(0, cursorPosition)
    const lastAtSymbolIndex = textBeforeCursor.lastIndexOf('@')

    if (lastAtSymbolIndex !== -1) {
      const newValue =
        messageContent.slice(0, lastAtSymbolIndex) +
        '@' +
        userName +
        ' ' +
        messageContent.slice(cursorPosition)
      setMessageContent(newValue)
    }

    setShowUserList(false)
    inputRef.current?.focus()
  }

  return (
    <div className="absolute bottom-full left-0 right-0 w-full">
      {showUserList && (
        <ScrollArea className="mb-2 max-h-48 w-full rounded-md border border-gray-700 bg-gray-900 shadow-lg">
          {filteredUsers.map((user) => (
            <button
              key={user.id}
              onClick={() => handleUserSelect(user.name)}
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
