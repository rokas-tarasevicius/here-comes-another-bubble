import type { ReactNode } from 'react';
import { Header } from './Header.tsx';
import { Sidebar } from './Sidebar.tsx';
import { EventFeed } from './EventFeed.tsx';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-screen min-w-0 flex-col overflow-x-auto bg-[--color-retro-bg] text-[--color-retro-text]">
      {/* Top bar */}
      <Header />

      {/* Three-column body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — navigation */}
        <Sidebar />

        {/* Center — main content area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6" style={{ boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.04)' }}>
          {children}
        </main>

        {/* Right panel — event feed (hidden below lg) */}
        <div className="hidden lg:flex">
          <EventFeed />
        </div>
      </div>
    </div>
  );
}
