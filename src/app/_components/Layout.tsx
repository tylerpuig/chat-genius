import React from "react";
import ResizableSidebar from "./Sidebar";
import ChannelList from "./ChannelList";

type LayoutProps = {
  children: React.ReactNode;
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      <ResizableSidebar>
        {/* Sidebar content goes here */}
        <div className="p-4">
          <h2 className="mb-4 text-xl font-bold text-blue-400">Channels</h2>
          <ul>
            <ChannelList />
            {/* {CHANNEL_LIST.map((el) => (
              <li
                key={el.name}
                className="... mb-1 truncate rounded p-2 hover:bg-gray-700"
              >
                {el.name}
              </li>
            ))} */}
          </ul>
        </div>
      </ResizableSidebar>
      {/* <main className="flex-1 overflow-auto bg-gray-800 p-6">{children}</main> */}
      <main className="flex-1 overflow-hidden bg-gray-800">{children}</main>
    </div>
  );
};

export default Layout;
