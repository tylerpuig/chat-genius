import Link from "next/link";
import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
import Layout from "./_components/Layout";
import { ChatContainer, ChatInput } from "./_components/chat/ChatContainer";

export default async function Home() {
  // const hello = await api.post.hello({ text: "from tRPC" });
  const session = await auth();
  console.log(session);

  // if (session?.user) {
  //   void api.post.getLatest.prefetch();
  // }

  // console.log(session);

  return (
    <HydrateClient>
      <Layout>
        <div className="flex h-full flex-col">
          <div className="border-b border-gray-800 p-4">
            <h1 className="text-xl font-bold text-blue-400"># general</h1>
            <p className="text-sm text-gray-400">
              This channel is for team-wide communication and announcements
            </p>
          </div>
          <div className="relative flex flex-1 flex-col overflow-hidden">
            <ChatContainer />
            <ChatInput />
          </div>
        </div>
      </Layout>
    </HydrateClient>
  );
}
