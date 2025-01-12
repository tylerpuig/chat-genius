import { useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Button } from '~/components/ui/button'
import { Paperclip, ChevronUp, Bold, Italic, Send } from 'lucide-react'
import { useState } from 'react'

interface ToolbarButtonProps {
  isActive: boolean
  onClick: () => void
  children: React.ReactNode
}

export default function RichTextEditor() {
  const [content, setContent] = useState('Send a message...')
  const [showFormatting, setShowFormatting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [StarterKit],
    content: content,
    autofocus: false,
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose max-w-none focus:outline-none pl-14 pr-24'
      },
      handleKeyDown: (view, event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          return true
        }
        return false
      }
    }
  })

  const ToolbarButton = ({ isActive, onClick, children }: ToolbarButtonProps) => (
    <button
      onClick={onClick}
      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
        isActive ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-500'
      } transition-colors duration-200`}
    >
      {children}
    </button>
  )

  const handleSendMessage = () => {
    // Handle send message logic here
    console.log('Sending message:', content)
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-gray-800 p-3">
      <div className="relative">
        {/* Floating toolbar */}
        <div
          className={`absolute -top-14 left-0 transition-all duration-300 ease-in-out ${
            showFormatting
              ? 'translate-y-0 opacity-100'
              : 'pointer-events-none translate-y-4 opacity-0'
          }`}
        >
          <div className="flex items-center gap-2 rounded-lg bg-gray-700">
            <ToolbarButton
              isActive={editor?.isActive('bold') || false}
              onClick={() => editor?.chain().focus().toggleBold().run()}
            >
              <Bold className="h-5 w-5 text-gray-200" />
            </ToolbarButton>
            <ToolbarButton
              isActive={editor?.isActive('italic') || false}
              onClick={() => editor?.chain().focus().toggleItalic().run()}
            >
              <Italic className="h-5 w-5 text-gray-200" />
            </ToolbarButton>
          </div>
        </div>

        {/* Main input area */}
        <div className="relative">
          <Button
            variant="channel"
            onClick={() => setShowFormatting(!showFormatting)}
            className="absolute left-3 top-1.5 flex h-10 w-10 items-center justify-center rounded-lg text-zinc-300 hover:bg-gray-700 hover:text-zinc-100"
          >
            <ChevronUp
              className={`h-5 w-5 transition-transform duration-200 ${showFormatting ? 'rotate-180' : ''}`}
            />
          </Button>

          <EditorContent
            editor={editor}
            className="prose prose-invert !focus:outline-none !focus:ring-0 max-h-[200px] w-full overflow-y-auto rounded-md border-2 border-zinc-600 bg-transparent py-[.6rem] text-lg text-slate-300"
          />

          <div className="absolute right-3 top-1.5 flex items-center gap-2">
            <Button
              variant="channel"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-300 hover:bg-gray-700 hover:text-zinc-100"
            >
              <input type="file" ref={fileInputRef} className="hidden" />
              <Paperclip className="h-5 w-5" />
            </Button>

            <Button
              variant="channel"
              onClick={handleSendMessage}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-300 hover:bg-gray-700 hover:text-zinc-100"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
