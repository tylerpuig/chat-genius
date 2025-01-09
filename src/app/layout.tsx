import '~/styles/globals.css'

import { GeistSans } from 'geist/font/sans'
import { type Metadata } from 'next'
import { Providers } from './providers'
import Layout from './_components/Layout'
import { AppSidebar } from './_components/AppSidebar'
import { SidebarTrigger } from '~/components/ui/sidebar'

export const metadata: Metadata = {
  title: 'Chat Genius',
  description: 'An AI collaborative chat app',
  icons: [{ rel: 'icon', url: '/favicon.ico' }]
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable}`} suppressHydrationWarning>
      <body className="bg-gray-900">
        <Providers>
          {/* <Layout>{children}</Layout> */}
          <AppSidebar />
          {/* <SidebarTrigger className="" /> */}

          <main className="flex-1 overflow-hidden bg-gray-800">{children}</main>
          {/* {children} */}
        </Providers>
      </body>
    </html>
  )
}
