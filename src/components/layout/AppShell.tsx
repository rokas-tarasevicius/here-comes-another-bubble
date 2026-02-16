import type { ReactNode } from 'react';
import { Header } from './Header.tsx';
import { Sidebar } from './Sidebar.tsx';
import { EventFeed } from './EventFeed.tsx';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-screen min-w-[1024px] flex-col bg-gray-950 text-gray-100">
      {/* Top bar */}
      <Header />

      {/* Three-column body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — navigation */}
        <Sidebar />

        {/* Center — main content area */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>

        {/* Right panel — event feed */}
        <EventFeed />
      </div>
    </div>
  );
}
