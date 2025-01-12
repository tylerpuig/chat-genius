'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Toolbar from './Toolbar'
import { useState } from 'react'

export default function RichTextEditor() {
  const [content, setContent] = useState('<p>Start typing here...</p>')
  const [showFormatting, setShowFormatting] = useState(false)

  const editor = useEditor({
    extensions: [StarterKit],
    content: content,
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML())
    }
  })

  return (
    <div className="mx-auto w-full max-w-4xl rounded-lg bg-gray-800 p-4 shadow-lg">
      <Toolbar
        editor={editor}
        showFormatting={showFormatting}
        setShowFormatting={setShowFormatting}
      />
      <EditorContent
        editor={editor}
        className="prose prose-invert mt-4 max-w-none rounded-2xl bg-gray-700 p-4"
      />
    </div>
  )
}
