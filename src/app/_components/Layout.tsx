import React from "react";
import ResizableSidebar from "./Sidebar";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      <ResizableSidebar>
        {/* Sidebar content goes here */}
        <div className="p-4">
          <h2 className="mb-4 text-xl font-bold text-blue-400">Channels</h2>
          <ul>
            <li className="mb-2 rounded p-2 hover:bg-gray-700"># general</li>
            <li className="mb-2 rounded p-2 hover:bg-gray-700"># random</li>
            <li className="mb-2 rounded p-2 hover:bg-gray-700">
              # development
            </li>
          </ul>
        </div>
      </ResizableSidebar>
      <main className="flex-1 overflow-auto bg-gray-800 p-6">{children}</main>
    </div>
  );
};

export default Layout;
