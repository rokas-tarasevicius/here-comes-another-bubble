import { useGameStore } from '../../store/index.ts';
import type { EventCategory } from '../../types/game.ts';

const CATEGORY_BADGE_STYLES: Record<EventCategory, string> = {
  market: 'retro-badge retro-badge-sm retro-badge-blue',
  team: 'retro-badge retro-badge-sm retro-badge-purple',
  product: 'retro-badge retro-badge-sm retro-badge-green',
  funding: 'retro-badge retro-badge-sm retro-badge-orange',
  competitor: 'retro-badge retro-badge-sm retro-badge-red',
  regulation: 'retro-badge retro-badge-sm retro-badge-gray',
  culture: 'retro-badge retro-badge-sm retro-badge-purple',
  personal: 'retro-badge retro-badge-sm retro-badge-blue',
  random: 'retro-badge retro-badge-sm retro-badge-gray',
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
    <aside className="event-feed-aside flex w-80 flex-col overflow-hidden bg-[--color-retro-card-alt]">
      <div className="px-4 pt-3 pb-1">
        <h2 className="retro-section-heading mb-0">Event Feed</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 retro-scrollbar">
        {recentEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-[--color-retro-text-muted]">
              No events yet. Advance to the next week.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {recentEvents.map((event) => {
              const badgeStyle =
                CATEGORY_BADGE_STYLES[event.category] ?? 'retro-badge retro-badge-sm retro-badge-gray';
              const categoryLabel =
                CATEGORY_LABELS[event.category] ?? event.category;

              return (
                <li
                  key={event.id}
                  className="event-feed-card rounded-lg bg-[--color-retro-card] p-3"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={badgeStyle}>
                      {categoryLabel}
                    </span>
                    <span className="ml-auto text-xs font-retro-mono text-[--color-retro-text-light]">
                      Week {event.week}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-[--color-retro-text] truncate" title={event.title}>
                    {event.title}
                  </p>
                  <p className="mt-0.5 text-xs text-[--color-retro-text-muted] line-clamp-2" title={event.description}>
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
