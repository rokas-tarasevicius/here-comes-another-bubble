import { useState } from 'react';
import type { Competitor } from '../../types/game.ts';
import { formatCurrency, formatPercent } from '../../utils/format.ts';

export interface CompetitorTableProps {
  competitors: Competitor[];
  /** Player's company data for comparison row */
  player?: {
    name: string;
    funding: number;
    teamSize: number;
    productQuality: number;
    marketShare: number;
    strategy: string;
  };
}

type SortKey = 'name' | 'funding' | 'teamSize' | 'productQuality' | 'marketShare';
type SortDir = 'asc' | 'desc';

interface TableRow {
  id: string;
  name: string;
  funding: number;
  teamSize: number;
  productQuality: number;
  marketShare: number;
  strategy: string;
  alive: boolean;
  isPlayer: boolean;
}

/**
 * Sortable table of competitors with player comparison.
 * Columns: Name, Funding, Team Size, Product Quality, Market Share, Strategy, Status.
 */
export function CompetitorTable({ competitors, player }: CompetitorTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('marketShare');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Build rows
  const rows: TableRow[] = competitors.map((c) => ({
    id: c.id,
    name: c.name,
    funding: c.funding,
    teamSize: c.teamSize,
    productQuality: c.productQuality,
    marketShare: c.marketShare,
    strategy: c.strategy,
    alive: c.alive,
    isPlayer: false,
  }));

  if (player) {
    rows.push({
      id: '__player__',
      name: player.name,
      funding: player.funding,
      teamSize: player.teamSize,
      productQuality: player.productQuality,
      marketShare: player.marketShare,
      strategy: player.strategy,
      alive: true,
      isPlayer: true,
    });
  }

  // Sort
  const sorted = [...rows].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    const diff = (aVal as number) - (bVal as number);
    return sortDir === 'asc' ? diff : -diff;
  });

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  function sortIndicator(key: SortKey) {
    if (sortKey !== key) return '';
    return sortDir === 'asc' ? ' \u25B2' : ' \u25BC';
  }

  /** Max market share among all rows, for proportional bar width */
  const maxShare = Math.max(...rows.map((r) => r.marketShare), 0.01);

  return (
    <div className="retro-card" style={{ padding: 0 }}>
      <h3 className="retro-section-heading" style={{ margin: '16px 16px 12px' }}>
        Competitors
      </h3>

      {rows.length === 0 ? (
        <p className="text-sm text-[--color-retro-text-muted]" style={{ padding: '16px' }}>No competitors in this market yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="retro-table">
            <thead>
              <tr>
                <th
                  className="cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  Name{sortIndicator('name')}
                </th>
                <th
                  className="cursor-pointer"
                  onClick={() => handleSort('funding')}
                >
                  Funding{sortIndicator('funding')}
                </th>
                <th
                  className="cursor-pointer"
                  onClick={() => handleSort('teamSize')}
                >
                  Team{sortIndicator('teamSize')}
                </th>
                <th
                  className="cursor-pointer"
                  onClick={() => handleSort('productQuality')}
                >
                  Quality{sortIndicator('productQuality')}
                </th>
                <th
                  className="cursor-pointer"
                  onClick={() => handleSort('marketShare')}
                >
                  Share{sortIndicator('marketShare')}
                </th>
                <th>Strategy</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => {
                const rowOpacity = row.alive ? '' : 'opacity-40';

                return (
                  <tr
                    key={row.id}
                    className={rowOpacity}
                    style={row.isPlayer ? { background: '#d8e6f3' } : undefined}
                  >
                    {/* Name */}
                    <td>
                      <span className={`font-semibold ${row.isPlayer ? 'text-[--color-retro-blue]' : 'text-[--color-retro-text]'}`}>
                        {row.name}
                      </span>
                      {row.isPlayer && (
                        <span className="ml-1 text-xs text-[--color-retro-blue-light]">(You)</span>
                      )}
                    </td>

                    {/* Funding */}
                    <td className="font-[--font-retro-mono] text-[--color-retro-text]">
                      {formatCurrency(row.funding)}
                    </td>

                    {/* Team Size */}
                    <td className="text-[--color-retro-text]">{row.teamSize}</td>

                    {/* Product Quality Bar */}
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="retro-progress" style={{ width: '64px', height: '10px' }}>
                          <div
                            className="retro-progress-bar"
                            style={{ width: `${row.productQuality}%` }}
                          />
                        </div>
                        <span className="text-xs text-[--color-retro-text-muted]">{Math.round(row.productQuality)}</span>
                      </div>
                    </td>

                    {/* Market Share Bar */}
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="retro-progress" style={{ width: '64px', height: '10px' }}>
                          <div
                            className={`retro-progress-bar ${row.isPlayer ? 'retro-progress-bar-green' : 'retro-progress-bar-purple'}`}
                            style={{
                              width: `${(row.marketShare / maxShare) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-[--color-retro-text-muted]">
                          {formatPercent(row.marketShare * 100)}
                        </span>
                      </div>
                    </td>

                    {/* Strategy */}
                    <td className="text-xs text-[--color-retro-text-muted]">{row.strategy}</td>

                    {/* Status */}
                    <td>
                      {row.alive ? (
                        <span className="retro-badge retro-badge-green">
                          Active
                        </span>
                      ) : (
                        <span className="retro-badge retro-badge-red">
                          Dead
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
