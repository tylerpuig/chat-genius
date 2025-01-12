import { Editor } from '@tiptap/react'
import { Bold, Italic, List, ListOrdered } from 'lucide-react'

interface ToolbarProps {
  editor: Editor | null
}

export default function Toolbar({ editor }: ToolbarProps) {
  if (!editor) {
    return null
  }

  return (
    <div className="flex items-center gap-2 rounded-lg bg-gray-700 p-1">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`rounded-xl p-2 ${
          editor.isActive('bold') ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-500'
        } transition-colors duration-200`}
      >
        <Bold className="h-4 w-4 text-gray-200" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`rounded-xl p-2 ${
          editor.isActive('italic') ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-500'
        } transition-colors duration-200`}
      >
        <Italic className="h-4 w-4 text-gray-200" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`rounded-xl p-2 ${
          editor.isActive('bulletList') ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-500'
        } transition-colors duration-200`}
      >
        <List className="h-4 w-4 text-gray-200" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`rounded-xl p-2 ${
          editor.isActive('orderedList') ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-500'
        } transition-colors duration-200`}
      >
        <ListOrdered className="h-4 w-4 text-gray-200" />
      </button>
    </div>
  )
}
