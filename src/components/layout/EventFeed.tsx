import { useGameStore } from '../../store/index.ts';
import type { EventCategory } from '../../types/game.ts';

const CATEGORY_DOT_COLORS: Record<EventCategory, string> = {
  market: 'bg-blue-400',
  team: 'bg-violet-400',
  product: 'bg-emerald-400',
  funding: 'bg-amber-400',
  competitor: 'bg-red-400',
  regulation: 'bg-gray-400',
  culture: 'bg-pink-400',
  personal: 'bg-cyan-400',
  random: 'bg-gray-500',
};

const CATEGORY_LABELS: Record<EventCategory, string> = {
  market: 'Market',
  team: 'Team',
  product: 'Product',
  funding: 'Funding',
  competitor: 'Competitor',
  regulation: 'Regulation',
  culture: 'Culture',
  personal: 'Personal',
  random: 'Random',
};

export function EventFeed() {
  const gameState = useGameStore((s) => s.gameState);

  if (!gameState) return null;

  const { meta, eventLog } = gameState;
  const currentWeek = meta.week;

  // Show events from the last 3 weeks (including current)
  const recentEvents = eventLog
    .filter((e) => e.week >= currentWeek - 2)
    .sort((a, b) => {
      // Newest first, then by id as tiebreaker
      if (b.week !== a.week) return b.week - a.week;
      return b.id.localeCompare(a.id);
    });

  return (
    <aside className="flex w-80 flex-col border-l border-gray-800 bg-gray-900">
      <div className="border-b border-gray-800 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-300">Event Feed</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {recentEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-gray-500">
              No events yet. Advance to the next week.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {recentEvents.map((event) => {
              const dotColor =
                CATEGORY_DOT_COLORS[event.category] ?? 'bg-gray-500';
              const categoryLabel =
                CATEGORY_LABELS[event.category] ?? event.category;

              return (
                <li
                  key={event.id}
                  className="rounded-lg border border-gray-800 bg-gray-900 p-3"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${dotColor}`}
                    />
                    <span className="text-xs font-medium text-gray-500">
                      {categoryLabel}
                    </span>
                    <span className="ml-auto text-xs font-mono text-gray-600">
                      W{event.week}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-200">
                    {event.title}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">
                    {event.description}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
