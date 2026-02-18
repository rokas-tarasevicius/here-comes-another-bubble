import { useState, useCallback } from 'react';
import { useGameStore } from '../../store/index.ts';

interface NavItem {
  id: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: '\u{1F4CA}' },
  { id: 'company', label: 'Company', icon: '\u{1F3E2}' },
  { id: 'finance', label: 'Finance', icon: '\u{1F4B0}' },
  { id: 'market', label: 'Market', icon: '\u{1F310}' },
  { id: 'decisions', label: 'Decisions', icon: '\u{2696}\u{FE0F}' },
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

  // Only count decisions due this week that haven't been responded to yet
  const pendingCount = gameState
    ? gameState.pendingDecisions.filter(
        (d) => d.deadline <= gameState.meta.week && !decisionsThisTurn.some(
          (dt) => dt.type === 'respond-to-event' && dt.decisionId === d.id
        )
      ).length
    : 0;

  return (
    <aside className="retro-sidebar flex w-12 md:w-12 lg:w-48 flex-col">
      {/* Navigation links */}
      <nav className="flex-1 px-1 lg:px-2 py-4">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = currentScreen === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setScreen(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  title={item.label}
                  className={`flex w-full items-center gap-2 rounded-xl px-2 lg:px-3 py-2 text-left text-sm font-medium transition-all ${
                    isActive
                      ? 'text-white'
                      : 'text-white/90 hover:text-white'
                  }`}
                  style={isActive ? {
                    background: 'rgba(255,255,255,0.15)',
                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.25), inset 0 0 1px rgba(0,0,0,0.10), 0 1px 0 rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.12)',
                  } : {}}
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="hidden lg:inline">{item.label}</span>
                  {item.id === 'decisions' && pendingCount > 0 && (
                    <span className="retro-badge retro-badge-sm retro-badge-orange ml-auto hidden lg:inline-flex">
                      {pendingCount}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom section: Save & Menu */}
      <div className="px-1 lg:px-2 py-4 space-y-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.12)' }}>
        <button
          onClick={handleSave}
          title="Save Game"
          className={`flex w-full items-center gap-2 rounded-xl px-2 lg:px-3 py-2 text-left text-sm font-medium transition-all ${
            saveState === 'saved'
              ? 'bg-green-500/20 text-green-300'
              : 'text-white/80 hover:bg-white/8 hover:text-white'
          }`}
        >
          <span className="text-base">{saveState === 'saved' ? '\u2713' : '\u{1F4BE}'}</span>
          <span className="hidden lg:inline">{saveState === 'saved' ? 'Saved!' : 'Save Game'}</span>
        </button>
        <button
          onClick={() => setScreen('title')}
          title="Main Menu"
          className="flex w-full items-center gap-2 rounded-xl px-2 lg:px-3 py-2 text-left text-sm font-medium text-white/80 transition-all hover:bg-white/8 hover:text-white"
        >
          <span className="text-base">{'\u{1F3E0}'}</span>
          <span className="hidden lg:inline">Main Menu</span>
        </button>
      </div>
    </aside>
  );
}
