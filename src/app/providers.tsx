// app/providers.tsx
'use client'

import { Provider } from 'react-redux'
import { store } from './store'
import { SessionProvider } from 'next-auth/react'
import { TRPCReactProvider } from '~/trpc/react'
import { ChannelProvider } from '~/app/hooks/ui/useChannelContext'
import { SidebarProvider, SidebarTrigger } from '~/components/ui/sidebar'
import { AppSidebar } from './_components/AppSidebar'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <SessionProvider>
        <TRPCReactProvider>
          <Provider store={store}>
            <ChannelProvider>{children}</ChannelProvider>
          </Provider>
        </TRPCReactProvider>
      </SessionProvider>
    </SidebarProvider>
  )
}
