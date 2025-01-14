import * as React from 'react'
import { Textarea } from '~/components/ui/textarea'
import { cn } from '~/lib/utils'

interface ChatInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const ChatInput = React.forwardRef<HTMLTextAreaElement, ChatInputProps>(
  ({ className, ...props }, ref) => (
    <Textarea
      autoComplete="off"
      ref={ref}
      name="message"
      className={cn(
        'flex max-h-32 min-h-[24px] w-full resize-none items-center rounded-md border-0 bg-gray-800 px-4 py-1 text-sm leading-tight placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
)
ChatInput.displayName = 'ChatInput'

export { ChatInput }
