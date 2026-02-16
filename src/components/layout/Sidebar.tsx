import { useGameStore } from '../../store/index.ts';

interface NavItem {
  id: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: '\u{1F4CA}' },
  { id: 'team', label: 'Team', icon: '\u{1F465}' },
  { id: 'product', label: 'Product', icon: '\u{1F4E6}' },
  { id: 'finance', label: 'Finance', icon: '\u{1F4B0}' },
  { id: 'market', label: 'Market', icon: '\u{1F310}' },
  { id: 'strategy', label: 'Strategy', icon: '\u{1F9E0}' },
  { id: 'decisions', label: 'Decisions', icon: '\u{2696}\u{FE0F}' },
];

export function Sidebar() {
  const currentScreen = useGameStore((s) => s.currentScreen);
  const setScreen = useGameStore((s) => s.setScreen);
  const saveGame = useGameStore((s) => s.saveGame);
  const gameState = useGameStore((s) => s.gameState);

  const pendingCount = gameState?.pendingDecisions.length ?? 0;

  return (
    <aside className="flex w-48 flex-col border-r border-gray-800 bg-gray-900">
      {/* Navigation links */}
      <nav className="flex-1 px-2 py-4">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = currentScreen === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setScreen(item.id)}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-400'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.id === 'decisions' && pendingCount > 0 && (
                    <span className="ml-auto rounded-full bg-amber-600 px-1.5 py-0.5 text-xs font-bold text-white">
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
      <div className="border-t border-gray-800 px-2 py-4 space-y-1">
        <button
          onClick={() => saveGame()}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200"
        >
          <span className="text-base">{'\u{1F4BE}'}</span>
          <span>Save Game</span>
        </button>
        <button
          onClick={() => setScreen('title')}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200"
        >
          <span className="text-base">{'\u{1F3E0}'}</span>
          <span>Main Menu</span>
        </button>
      </div>
    </aside>
  );
}
