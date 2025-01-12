import '~/styles/globals.css'

import { GeistSans } from 'geist/font/sans'
import { type Metadata } from 'next'
import { Providers } from './providers'
import { Toaster } from '~/components/ui/toaster'

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
          {/* <AppSidebar /> */}

          <main className="flex-1 overflow-hidden bg-gray-800">{children}</main>
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
