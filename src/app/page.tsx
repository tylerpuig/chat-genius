import Link from 'next/link'
import { auth } from '~/server/auth'
import { api, HydrateClient } from '~/trpc/server'
import Layout from './_components/Layout'
import { ChatContainer, ChatInput } from './_components/chat/ChatContainer'
// import { useRouter } from 'next/navigation'
import { redirect } from 'next/navigation'
import { WorkspaceSidebar } from './_components/WorkspaceSidebar'
import { NewChannelSheet } from './_components/sheets/NewChannel'
import ChatTabs from './_components/chat/ChatTabs'

export default async function Home() {
  // const hello = await api.post.hello({ text: "from tRPC" });
  // const router = useRouter()

  const session = await auth()
  console.log(session)

  // if (session?.user) {
  //   void api.post.getLatest.prefetch();
  // }

  // console.log(session)

  if (!session || !session.user) {
    redirect('/login')
  }

  return (
    <HydrateClient>
      <div className="flex h-screen">
        <WorkspaceSidebar />
        <div className="flex-1">
          {/* Main content area*/}
          <Layout>
            <div className="flex h-full flex-col">
              <ChatTabs />
              <div className="relative flex flex-1 flex-col overflow-hidden">
                <ChatContainer />
                <ChatInput />
              </div>
            </div>
            <NewChannelSheet />
          </Layout>
        </div>
      </div>
    </HydrateClient>
  )
}
