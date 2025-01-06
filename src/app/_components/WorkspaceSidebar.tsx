'use client'
import React, { useState } from 'react'
import { Home, MessageCircle, Bell, MoreHorizontal } from 'lucide-react'

export function WorkspaceSidebar() {
  //   const [activeItem, setActiveItem] = useState('home')

  const menuItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'dms', icon: MessageCircle, label: 'DMs' },
    { id: 'activity', icon: Bell, label: 'Activity', notifications: 2 },
    { id: 'more', icon: MoreHorizontal, label: 'More' }
  ]

  return (
    <div className="flex h-screen w-16 flex-col gap-2 bg-blue-700 py-4 text-white">
      {/* App Logo */}
      <div className="mb-4 px-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
          <span className="text-xl font-bold text-blue-700">A</span>
        </div>
      </div>

      {/* Navigation Items */}
      {menuItems.map((item) => (
        <button
          // activeItem === item.id ? 'bg-blue-800' : 'hover:bg-blue-600'

          key={item.id}
          //   onClick={() => setActiveItem(item.id)}
          className={`group relative flex items-center justify-center px-3 py-2`}
        >
          <item.icon size={24} />

          {/* Notification Badge */}
          {item.notifications && (
            <div className="absolute -top-1 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs">
              {item.notifications}
            </div>
          )}

          {/* Tooltip */}
          <div className="absolute left-16 hidden rounded bg-gray-900 px-2 py-1 text-sm text-white group-hover:flex">
            {item.label}
          </div>
        </button>
      ))}
    </div>
  )
}
