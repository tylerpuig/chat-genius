"use client";

import React, { useState, useEffect, useCallback } from "react";

type ResizableSidebarProps = {
  children: React.ReactNode;
  minWidth?: number;
  maxWidth?: number;
};

export default function ResizableSidebar({
  children,
  minWidth = 200,
  maxWidth = 500,
}: ResizableSidebarProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(200);

  const startResizing = useCallback(() => {
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (mouseMoveEvent: MouseEvent) => {
      if (isResizing) {
        const newWidth = mouseMoveEvent.clientX;
        if (newWidth >= minWidth && newWidth <= maxWidth) {
          setSidebarWidth(newWidth);
        }
      }
    },
    [isResizing, minWidth, maxWidth],
  );

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  return (
    <div className="flex h-screen bg-gray-900" style={{ width: sidebarWidth }}>
      <div className="scrollbar-overlay flex-1 overflow-auto bg-gray-800 text-gray-300">
        {children}
      </div>
      <div
        className="w-1 cursor-col-resize bg-blue-700 transition-colors hover:bg-blue-600"
        onMouseDown={startResizing}
      />
    </div>
  );
}
