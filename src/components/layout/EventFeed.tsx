import { useGameStore } from '../../store/index.ts';
import type { EventCategory } from '../../types/game.ts';

const CATEGORY_BADGE_STYLES: Record<EventCategory, string> = {
  market: 'retro-badge retro-badge-blue',
  team: 'retro-badge retro-badge-purple',
  product: 'retro-badge retro-badge-green',
  funding: 'retro-badge retro-badge-orange',
  competitor: 'retro-badge retro-badge-red',
  regulation: 'retro-badge retro-badge-gray',
  culture: 'retro-badge retro-badge-purple',
  personal: 'retro-badge retro-badge-blue',
  random: 'retro-badge retro-badge-gray',
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
    <aside className="flex w-80 flex-col border-l border-[--color-retro-border] bg-[--color-retro-card]">
      <div className="px-4 py-3">
        <h2 className="retro-section-heading">Event Feed</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {recentEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-[--color-retro-text-muted]">
              No events yet. Advance to the next week.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {recentEvents.map((event, index) => {
              const badgeStyle =
                CATEGORY_BADGE_STYLES[event.category] ?? 'retro-badge retro-badge-gray';
              const categoryLabel =
                CATEGORY_LABELS[event.category] ?? event.category;

              return (
                <li
                  key={event.id}
                  className={`rounded-lg border border-[--color-retro-border] p-3 ${
                    index % 2 === 0 ? 'bg-[--color-retro-card]' : 'bg-[--color-retro-card-alt]'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] ${badgeStyle}`}
                    >
                      {categoryLabel}
                    </span>
                    <span className="ml-auto text-xs font-[--font-retro-mono] text-[--color-retro-text-light]">
                      W{event.week}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-[--color-retro-text]">
                    {event.title}
                  </p>
                  <p className="mt-0.5 text-xs text-[--color-retro-text-muted] line-clamp-2">
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
