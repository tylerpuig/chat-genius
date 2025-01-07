import { auth } from '~/server/auth'
import { HydrateClient } from '~/trpc/server'
import { redirect } from 'next/navigation'
import ClientHomeWrapper from './ClientHomeWrapper'

export default async function Home() {
  const session = await auth()

  if (!session || !session.user) {
    redirect('/auth/login')
  }

  return (
    <HydrateClient>
      <ClientHomeWrapper />
    </HydrateClient>
  )
}
