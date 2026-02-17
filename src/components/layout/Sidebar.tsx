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

  const pendingCount = gameState?.pendingDecisions.length ?? 0;

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
                  className={`flex w-full items-center gap-2 rounded-lg px-2 lg:px-3 py-2 text-left text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-white/15 text-[--color-retro-orange]'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="hidden lg:inline">{item.label}</span>
                  {item.id === 'decisions' && pendingCount > 0 && (
                    <span className="retro-badge retro-badge-orange ml-auto text-[10px] hidden lg:inline-flex">
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
      <div className="border-t border-white/10 px-1 lg:px-2 py-4 space-y-1 bg-black/10">
        <button
          onClick={() => saveGame()}
          title="Save Game"
          className="flex w-full items-center gap-2 rounded-lg px-2 lg:px-3 py-2 text-left text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <span className="text-base">{'\u{1F4BE}'}</span>
          <span className="hidden lg:inline">Save Game</span>
        </button>
        <button
          onClick={() => setScreen('title')}
          title="Main Menu"
          className="flex w-full items-center gap-2 rounded-lg px-2 lg:px-3 py-2 text-left text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <span className="text-base">{'\u{1F3E0}'}</span>
          <span className="hidden lg:inline">Main Menu</span>
        </button>
      </div>
    </aside>
  );
}
