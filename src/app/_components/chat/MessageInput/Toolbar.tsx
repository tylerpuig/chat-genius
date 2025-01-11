import { Editor } from '@tiptap/react'
import { Bold, Italic, List, ListOrdered, Image, Smile, Settings } from 'lucide-react'
import UploadButton from './UploadButton'
// import EmojiPicker from './EmojiPicker'
import { useState } from 'react'

interface ToolbarProps {
  editor: Editor | null
  showFormatting: boolean
  setShowFormatting: React.Dispatch<React.SetStateAction<boolean>>
}

export default function Toolbar({ editor, showFormatting, setShowFormatting }: ToolbarProps) {
  if (!editor) {
    return null
  }

  return (
    <>
      {showFormatting && (
        <div className="flex items-center gap-2 rounded-t-lg">
          <button
            onClick={() => setShowFormatting(!showFormatting)}
            className="flex items-center rounded-xl bg-gray-600 p-2 text-gray-200 transition-colors duration-200 hover:bg-gray-500"
          >
            <Settings className="h-4 w-4" />
          </button>

          <div
            // className={`flex gap-2 transition-all duration-300 ease-in-out ${showFormatting ? 'max-w-full opacity-100' : 'max-w-0 overflow-hidden opacity-0'}`}
            className={`flex max-w-full gap-2 opacity-100 transition-all duration-300 ease-in-out`}
          >
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`rounded-xl p-2 ${editor.isActive('bold') ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-500'} transition-colors duration-200`}
            >
              <Bold className="h-4 w-4 text-gray-200" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`rounded-xl p-2 ${editor.isActive('italic') ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-500'} transition-colors duration-200`}
            >
              <Italic className="h-4 w-4 text-gray-200" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`rounded-xl p-2 ${editor.isActive('bulletList') ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-500'} transition-colors duration-200`}
            >
              <List className="h-4 w-4 text-gray-200" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`rounded-xl p-2 ${editor.isActive('orderedList') ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-500'} transition-colors duration-200`}
            >
              <ListOrdered className="h-4 w-4 text-gray-200" />
            </button>
          </div>

          {/* <UploadButton editor={editor} /> */}
          {/* <EmojiPicker editor={editor} /> */}
        </div>
      )}
    </>
  )
}
