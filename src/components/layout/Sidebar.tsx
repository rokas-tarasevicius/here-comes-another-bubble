import { useState, useCallback } from 'react';
import { useGameStore } from '../../store/index.ts';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

function IconOverview() {
  return (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  );
}

function IconCompany() {
  return (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
  );
}

function IconFinance() {
  return (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
    </svg>
  );
}

function IconMarket() {
  return (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}

function IconDecisions() {
  return (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" />
    </svg>
  );
}

function IconSave() {
  return (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function IconHome() {
  return (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  );
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: <IconOverview /> },
  { id: 'company', label: 'Company', icon: <IconCompany /> },
  { id: 'finance', label: 'Finance', icon: <IconFinance /> },
  { id: 'market', label: 'Market', icon: <IconMarket /> },
  { id: 'decisions', label: 'Decisions', icon: <IconDecisions /> },
];

export function Sidebar() {
  const currentScreen = useGameStore((s) => s.currentScreen);
  const setScreen = useGameStore((s) => s.setScreen);
  const saveGame = useGameStore((s) => s.saveGame);
  const gameState = useGameStore((s) => s.gameState);

  const decisionsThisTurn = useGameStore((s) => s.decisionsThisTurn);
  const [saveState, setSaveState] = useState<'idle' | 'saved'>('idle');

  const handleSave = useCallback(() => {
    saveGame();
    setSaveState('saved');
    setTimeout(() => setSaveState('idle'), 1500);
  }, [saveGame]);

  const pendingCount = gameState
    ? gameState.pendingDecisions.filter(
        (d) => d.deadline <= gameState.meta.week && !decisionsThisTurn.some(
          (dt) => dt.type === 'respond-to-event' && dt.decisionId === d.id
        )
      ).length
    : 0;

  return (
    <aside className="retro-sidebar flex w-12 md:w-12 lg:w-48 flex-col">
      <nav className="flex-1 px-1 lg:px-2 py-4">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = currentScreen === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setScreen(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  title={item.label}
                  className="retro-sidebar-item group flex w-full items-center gap-2.5 rounded-lg px-2 lg:px-3 py-2 text-left text-sm font-medium"
                  data-active={isActive || undefined}
                >
                  <span className="shrink-0 opacity-75 group-data-active:opacity-100">{item.icon}</span>
                  <span className="hidden lg:inline">{item.label}</span>
                  {item.id === 'decisions' && pendingCount > 0 && (
                    <span className="ml-auto hidden lg:inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none"
                      style={{
                        background: 'linear-gradient(to bottom, #ee8833, #cc6622)',
                        color: '#fff',
                        boxShadow: '0 1px 3px rgba(204,102,34,0.4), inset 0 1px 0 rgba(255,255,255,0.25)',
                        textShadow: '0 -1px 0 rgba(0,0,0,0.2)',
                        minWidth: 18,
                        textAlign: 'center' as const,
                      }}
                    >
                      {pendingCount}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom section */}
      <div className="px-1 lg:px-2 py-3 space-y-0.5"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.12)' }}
      >
        <button
          onClick={handleSave}
          title="Save Game"
          className={`retro-sidebar-item group flex w-full items-center gap-2.5 rounded-lg px-2 lg:px-3 py-2 text-left text-sm font-medium ${
            saveState === 'saved' ? 'retro-sidebar-item--saved' : ''
          }`}
        >
          <span className="shrink-0 opacity-75">{saveState === 'saved' ? <IconCheck /> : <IconSave />}</span>
          <span className="hidden lg:inline">{saveState === 'saved' ? 'Saved!' : 'Save'}</span>
        </button>
        <button
          onClick={() => setScreen('title')}
          title="Main Menu"
          className="retro-sidebar-item group flex w-full items-center gap-2.5 rounded-lg px-2 lg:px-3 py-2 text-left text-sm font-medium"
        >
          <span className="shrink-0 opacity-75"><IconHome /></span>
          <span className="hidden lg:inline">Menu</span>
        </button>
      </div>
    </aside>
  );
}
