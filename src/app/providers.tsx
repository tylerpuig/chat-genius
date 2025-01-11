// app/providers.tsx
'use client'

import { Provider } from 'react-redux'
import { store } from './store'
import { SessionProvider } from 'next-auth/react'
import { TRPCReactProvider } from '~/trpc/react'
import { ChannelProvider } from '~/app/hooks/ui/useChannelContext'
import { SidebarProvider, SidebarTrigger } from '~/components/ui/sidebar'
import { FileAttachmentProvider } from '~/app/hooks/ui/useFileAttachmentContext'
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <TRPCReactProvider>
        <Provider store={store}>
          <SidebarProvider>
            <ChannelProvider>
              <FileAttachmentProvider>{children}</FileAttachmentProvider>
            </ChannelProvider>
          </SidebarProvider>
        </Provider>
      </TRPCReactProvider>
    </SessionProvider>
  )
}
