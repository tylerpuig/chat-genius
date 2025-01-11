'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Toolbar from './Toolbar'
import { useState } from 'react'

export default function RichTextEditor() {
  const [content, setContent] = useState('Send a message...')
  const [showFormatting, setShowFormatting] = useState(false)

  const editor = useEditor({
    extensions: [StarterKit],
    content: content,
    autofocus: false,
    onFocus: () => {
      setShowFormatting(true)
    },
    onBlur: () => {
      setShowFormatting(false)
    },
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose max-w-none focus:outline-none px-2'
      },
      handleKeyDown: (view, event) => {
        // view contains the EditorView
        // event is the KeyboardEvent
        if (event.key === 'Enter' && !event.shiftKey) {
          // Get the current state from view
          const { state } = view
          // Get the doc content
          const docContent = state.doc.textContent
          console.log('Document content:', docContent)
          // Get selection info
          const { from, to } = state.selection
          // Get text of current selection
          const selectedText = state.doc.textBetween(from, to)
          console.log('Selected text:', selectedText)
          // You can also get the current position
          const pos = state.selection.$from.pos
          console.log('Current position:', pos)
          // Return true to prevent default behavior
          // Return false or undefined to allow default behavior
          return true
        }
        return false
      }
    }
  })

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-gray-800 p-3">
      <div className="">
        <Toolbar
          editor={editor}
          showFormatting={showFormatting}
          setShowFormatting={setShowFormatting}
        />
      </div>

      <div className="flex flex-row items-center">
        <EditorContent
          editor={editor}
          className="prose prose-invert !focus:outline-none !focus:ring-0 max-h-[200px] flex-1 overflow-y-auto rounded-md border-2 border-gray-700 bg-transparent py-2 text-lg text-white"
        />
      </div>
    </div>
  )
}
