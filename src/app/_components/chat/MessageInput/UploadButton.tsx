import { Editor } from '@tiptap/react'
import { Image } from 'lucide-react'
import { useState } from 'react'

interface UploadButtonProps {
  editor: Editor
}

export default function UploadButton({ editor }: UploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false)

  //   const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
  //     const file = event.target.files?.[0]
  //     if (file) {
  //       setIsUploading(true)
  //       // Simulating file upload
  //       await new Promise((resolve) => setTimeout(resolve, 1000))
  //       const imageUrl = URL.createObjectURL(file)
  //       editor.chain().focus().setImage({ src: imageUrl }).run()
  //       setIsUploading(false)
  //     }
  //   }

  return (
    <div className="relative">
      <input
        type="file"
        accept="image/*"
        // onChange={handleFileChange}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        disabled={isUploading}
      />
      <button
        className={`rounded-xl p-2 ${isUploading ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-500'} transition-colors duration-200`}
        disabled={isUploading}
      >
        <Image className="h-5 w-5 text-gray-200" />
      </button>
    </div>
  )
}
