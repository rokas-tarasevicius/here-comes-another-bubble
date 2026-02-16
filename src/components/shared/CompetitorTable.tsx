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
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
      <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-gray-400">
        Competitors
      </h3>

      {rows.length === 0 ? (
        <p className="text-sm text-gray-500">No competitors in this market yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-xs uppercase tracking-wider text-gray-500">
                <th
                  className="cursor-pointer pb-2 pr-3 hover:text-gray-300"
                  onClick={() => handleSort('name')}
                >
                  Name{sortIndicator('name')}
                </th>
                <th
                  className="cursor-pointer pb-2 pr-3 hover:text-gray-300"
                  onClick={() => handleSort('funding')}
                >
                  Funding{sortIndicator('funding')}
                </th>
                <th
                  className="cursor-pointer pb-2 pr-3 hover:text-gray-300"
                  onClick={() => handleSort('teamSize')}
                >
                  Team{sortIndicator('teamSize')}
                </th>
                <th
                  className="cursor-pointer pb-2 pr-3 hover:text-gray-300"
                  onClick={() => handleSort('productQuality')}
                >
                  Quality{sortIndicator('productQuality')}
                </th>
                <th
                  className="cursor-pointer pb-2 pr-3 hover:text-gray-300"
                  onClick={() => handleSort('marketShare')}
                >
                  Share{sortIndicator('marketShare')}
                </th>
                <th className="pb-2 pr-3">Strategy</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => {
                const rowOpacity = row.alive ? '' : 'opacity-40';
                const playerHighlight = row.isPlayer
                  ? 'bg-emerald-500/5 border-l-2 border-l-emerald-500'
                  : '';

                return (
                  <tr
                    key={row.id}
                    className={`border-b border-gray-800/50 ${rowOpacity} ${playerHighlight}`}
                  >
                    {/* Name */}
                    <td className="py-2 pr-3">
                      <span className={`font-medium ${row.isPlayer ? 'text-emerald-400' : 'text-gray-300'}`}>
                        {row.name}
                      </span>
                      {row.isPlayer && (
                        <span className="ml-1 text-xs text-emerald-600">(You)</span>
                      )}
                    </td>

                    {/* Funding */}
                    <td className="py-2 pr-3 font-mono text-gray-300">
                      {formatCurrency(row.funding)}
                    </td>

                    {/* Team Size */}
                    <td className="py-2 pr-3 text-gray-300">{row.teamSize}</td>

                    {/* Product Quality Bar */}
                    <td className="py-2 pr-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 overflow-hidden rounded-full bg-gray-800">
                          <div
                            className="h-full rounded-full bg-blue-500 transition-all duration-300"
                            style={{ width: `${row.productQuality}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400">{Math.round(row.productQuality)}</span>
                      </div>
                    </td>

                    {/* Market Share Bar */}
                    <td className="py-2 pr-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 overflow-hidden rounded-full bg-gray-800">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${(row.marketShare / maxShare) * 100}%`,
                              backgroundColor: row.isPlayer ? '#10b981' : '#6366f1',
                              opacity: 0.5 + (row.marketShare / maxShare) * 0.5,
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-400">
                          {formatPercent(row.marketShare * 100)}
                        </span>
                      </div>
                    </td>

                    {/* Strategy */}
                    <td className="py-2 pr-3 text-xs text-gray-400">{row.strategy}</td>

                    {/* Status */}
                    <td className="py-2">
                      {row.alive ? (
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
                          Active
                        </span>
                      ) : (
                        <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400">
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
