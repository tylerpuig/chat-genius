import Link from "next/link";

import { LatestPost } from "~/app/_components/post";
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

      {/* <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        </div>
      </main> */}
    </HydrateClient>
  );
}
