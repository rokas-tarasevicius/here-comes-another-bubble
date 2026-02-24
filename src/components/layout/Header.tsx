import { useState } from 'react';
import { useGameStore } from '../../store/index.ts';
import type { CompanyStage } from '../../types/game.ts';
import { SparklineChart } from '../shared/SparklineChart.tsx';


const STAGE_LABELS: Record<CompanyStage, string> = {
  'garage': 'Garage',
  'pre-seed': 'Pre-Seed',
  'seed': 'Seed',
  'series-a': 'Series A',
  'series-b': 'Series B',
  'series-c': 'Series C',
  'series-d': 'Series D',
  'series-e': 'Series E',
  'series-f': 'Series F',
  'growth': 'Growth',
  'public': 'Public',
  'dead': 'Dead',
};

const STAGE_COLORS: Record<CompanyStage, string> = {
  'garage': 'retro-badge retro-badge-gray',
  'pre-seed': 'retro-badge retro-badge-gray',
  'seed': 'retro-badge retro-badge-orange',
  'series-a': 'retro-badge retro-badge-blue',
  'series-b': 'retro-badge retro-badge-purple',
  'series-c': 'retro-badge retro-badge-purple',
  'series-d': 'retro-badge retro-badge-purple',
  'series-e': 'retro-badge retro-badge-blue',
  'series-f': 'retro-badge retro-badge-blue',
  'growth': 'retro-badge retro-badge-green',
  'public': 'retro-badge retro-badge-green',
  'dead': 'retro-badge retro-badge-red',
};

function formatCash(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  }
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(1)}K`;
  }
  return `$${amount.toFixed(0)}`;
}

interface ReadoutConfig {
  label: string;
  value: string;
  sparklineData: number[];
  sparklineColor: string;
  valueClass: string;
  readoutClass: string;
  isCurrency?: boolean;
  change?: string;
  changeDirection?: 'up' | 'down' | 'flat';
  hasChart?: boolean;
}

function formatSparklineValue(val: number, isCurrency: boolean): string {
  const prefix = isCurrency ? '$' : '';
  if (val >= 1_000_000_000) return `${prefix}${(val / 1_000_000_000).toFixed(1)}B`;
  if (val >= 1_000_000) return `${prefix}${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `${prefix}${(val / 1_000).toFixed(1)}K`;
  return `${prefix}${val.toFixed(0)}`;
}

function HeaderReadout({ config }: { config: ReadoutConfig }) {
  const [hovered, setHovered] = useState(false);
  const hasSparkline = config.sparklineData.length >= 2;

  const min = hasSparkline ? Math.min(...config.sparklineData) : 0;
  const max = hasSparkline ? Math.max(...config.sparklineData) : 0;
  const dataPoints = config.sparklineData.length;

  const showTooltip = config.hasChart;

  return (
    <div
      className={`relative flex items-baseline gap-2 rounded-lg px-3 py-2 transition-all duration-150 ${config.readoutClass} ${showTooltip ? 'cursor-pointer' : 'cursor-default'}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className="retro-label" style={{ fontSize: '9px', lineHeight: 1 }}>{config.label}</span>
      <span className={`font-retro-mono text-xs font-medium ${config.valueClass}`} style={{ lineHeight: 1 }}>
        {config.value}
      </span>
      {config.change && (
        <span className={`font-retro-mono text-[10px] font-medium ${
          config.changeDirection === 'up' ? 'text-[--color-retro-green]' :
          config.changeDirection === 'down' ? 'text-[--color-retro-red]' :
          'text-[--color-retro-text-muted]'
        }`} style={{ lineHeight: 1 }}>
          {config.change}
        </span>
      )}
      {config.hasChart && (
        <svg
          width="10" height="8" viewBox="0 0 10 8" fill="none"
          className={`shrink-0 transition-opacity duration-150 ${hasSparkline ? 'opacity-40' : 'opacity-15'}`}
          style={{ position: 'relative', top: '-1px' }}
        >
          <polyline
            points="0,7 2.5,5 5,6 7.5,2 10,1"
            stroke={hasSparkline ? config.sparklineColor : '#9a9590'}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}

      {/* Tooltip */}
      {showTooltip && hovered && (
        <div
          className="readout-tooltip absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 rounded-xl pointer-events-none"
          style={{ width: '200px', padding: '12px 14px' }}
        >
          {/* Header */}
          <div className="flex items-baseline justify-between mb-2">
            <span className="retro-label" style={{ fontSize: '9px' }}>{config.label}</span>
            <span className={`font-retro-mono text-sm font-semibold leading-none ${config.valueClass}`}>
              {config.value}
            </span>
          </div>
          {hasSparkline ? (
            <>
              <SparklineChart data={config.sparklineData} color={config.sparklineColor} height={48} />
              {/* Footer: range */}
              <div className="flex items-center justify-between mt-2 gap-1.5">
                <span className="retro-stat-tag" style={{ padding: '2px 6px' }}>
                  <span className="retro-stat-tag-label" style={{ fontSize: '8px' }}>Lo</span>
                  <span className="retro-stat-tag-value" style={{ fontSize: '10px' }}>{formatSparklineValue(min, config.isCurrency ?? false)}</span>
                </span>
                <span className="retro-label leading-none" style={{ fontSize: '8px' }}>{dataPoints} weeks</span>
                <span className="retro-stat-tag" style={{ padding: '2px 6px' }}>
                  <span className="retro-stat-tag-label" style={{ fontSize: '8px' }}>Hi</span>
                  <span className="retro-stat-tag-value" style={{ fontSize: '10px' }}>{formatSparklineValue(max, config.isCurrency ?? false)}</span>
                </span>
              </div>
            </>
          ) : (
            <p className="text-center text-[11px] text-[--color-retro-text-muted] py-3">
              No trend data yet — check back after a few weeks
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function Header() {
  const gameState = useGameStore((s) => s.gameState);
  const isSimulating = useGameStore((s) => s.isSimulating);
  const endWeek = useGameStore((s) => s.endWeek);
  const setScreen = useGameStore((s) => s.setScreen);

  if (!gameState) return null;

  const decisionsThisTurn = useGameStore((s) => s.decisionsThisTurn);
  const { meta, company, finances, product, team, pendingDecisions, weekHistory } = gameState;

  const unresolvedDecisions = pendingDecisions.filter(
    (d) => d.deadline <= meta.week && !decisionsThisTurn.some(
      (dt) => dt.type === 'respond-to-event' && dt.decisionId === d.id
    )
  );
  const pendingCount = unresolvedDecisions.length;
  const hasUrgentUnresolved = pendingCount > 0;
  const stageBadgeClass = STAGE_COLORS[company.stage] ?? 'bg-gray-700 text-gray-300';
  const stageLabel = STAGE_LABELS[company.stage] ?? company.stage;

  // Sparkline data
  const cashHistory = weekHistory.map((w) => w.cash);
  const revenueHistory = weekHistory.map((w) => w.revenue);
  const burnHistory = weekHistory.map((w) => w.burn);
  const valuationHistory = weekHistory.map((w) => w.valuation);
  const customerHistory = weekHistory.map((w) => w.customers);
  const churnHistory = weekHistory.map((w) => w.churnRate);
  const teamHistory = weekHistory.map((w) => w.teamSize);
  const pmfHistory = weekHistory.map((w) => w.pmfScore);
  const totalTeam = team.teamSize + team.aiAgents.length;

  function weekChange(data: number[]): { change: string; dir: 'up' | 'down' | 'flat' } {
    if (data.length < 2) return { change: '', dir: 'flat' };
    const prev = data[data.length - 2];
    const curr = data[data.length - 1];
    if (prev === 0) {
      if (curr === 0) return { change: '', dir: 'flat' };
      return { change: '+∞', dir: 'up' };
    }
    const pct = ((curr - prev) / Math.abs(prev)) * 100;
    if (Math.abs(pct) < 0.5) return { change: '', dir: 'flat' };
    const sign = pct > 0 ? '+' : '';
    return {
      change: `${sign}${pct.toFixed(0)}%`,
      dir: pct > 0 ? 'up' : 'down',
    };
  }

  const valuationChange = weekChange(valuationHistory);
  const cashChange = weekChange(cashHistory);
  const revenueChange = weekChange(revenueHistory);
  const burnChange = weekChange(burnHistory);
  const usersChange = weekChange(customerHistory);
  const churnChange = weekChange(churnHistory);
  const teamChange = weekChange(teamHistory);
  const pmfChange = weekChange(pmfHistory);

  // Runway calculation
  const netBurn = finances.weeklyBurn - finances.weeklyRevenue;
  const isProfitable = finances.weeklyRevenue >= finances.weeklyBurn && finances.weeklyRevenue > 0;
  const runwayWeeks = netBurn > 0 ? Math.floor(finances.cash / netBurn) : Infinity;
  const runwayStr = isProfitable ? '\u221E' : runwayWeeks === Infinity ? '\u221E' : `${runwayWeeks}w`;

  const readouts: ReadoutConfig[] = [
    {
      label: 'Valuation',
      value: formatCash(company.valuation),
      sparklineData: valuationHistory,
      sparklineColor: 'var(--color-retro-orange-dark)',
      valueClass: 'text-[--color-retro-orange-dark]',
      readoutClass: 'readout-amber',
      isCurrency: true,
      change: valuationChange.change,
      changeDirection: valuationChange.dir,
      hasChart: true,
    },
    {
      label: 'Cash',
      value: formatCash(finances.cash),
      sparklineData: cashHistory,
      sparklineColor: 'var(--color-retro-green)',
      valueClass: 'text-[--color-retro-green-dark]',
      readoutClass: 'readout-green',
      isCurrency: true,
      change: cashChange.change,
      changeDirection: cashChange.dir,
      hasChart: true,
    },
    {
      label: 'Revenue',
      value: `${formatCash(finances.weeklyRevenue)}/w`,
      sparklineData: revenueHistory,
      sparklineColor: 'var(--color-retro-blue)',
      valueClass: 'text-[--color-retro-blue]',
      readoutClass: 'readout-blue',
      isCurrency: true,
      change: revenueChange.change,
      changeDirection: revenueChange.dir,
      hasChart: true,
    },
    {
      label: 'Burn',
      value: `${formatCash(finances.weeklyBurn)}/w`,
      sparklineData: burnHistory,
      sparklineColor: 'var(--color-retro-red)',
      valueClass: 'text-[--color-retro-red]',
      readoutClass: 'readout-red',
      isCurrency: true,
      change: burnChange.change,
      changeDirection: burnChange.dir === 'up' ? 'down' : burnChange.dir === 'down' ? 'up' : 'flat',
      hasChart: true,
    },
    {
      label: 'Team',
      value: String(totalTeam),
      sparklineData: teamHistory,
      sparklineColor: 'var(--color-retro-blue)',
      valueClass: 'text-[--color-retro-blue]',
      readoutClass: 'readout-blue',
      change: teamChange.change,
      changeDirection: teamChange.dir,
      hasChart: true,
    },
    {
      label: 'Users',
      value: product.customers.toLocaleString(),
      sparklineData: customerHistory,
      sparklineColor: 'var(--color-retro-purple)',
      valueClass: 'text-[--color-retro-purple]',
      readoutClass: 'readout-purple',
      change: usersChange.change,
      changeDirection: usersChange.dir,
      hasChart: true,
    },
    {
      label: 'Churn',
      value: `${(product.churnRate * 100).toFixed(1)}%`,
      sparklineData: churnHistory,
      sparklineColor: 'var(--color-retro-red)',
      valueClass: product.churnRate > 0.1
        ? 'text-[--color-retro-red]'
        : product.churnRate > 0.05
          ? 'text-[--color-retro-orange]'
          : 'text-[--color-retro-green-dark]',
      readoutClass: 'readout-red',
      change: churnChange.change,
      changeDirection: churnChange.dir === 'up' ? 'down' : churnChange.dir === 'down' ? 'up' : 'flat',
      hasChart: true,
    },
    {
      label: 'PMF',
      value: `${Math.round(product.pmfScore)}`,
      sparklineData: pmfHistory,
      sparklineColor: product.pmfScore >= 60 ? 'var(--color-retro-green)' : product.pmfScore >= 30 ? 'var(--color-retro-orange)' : 'var(--color-retro-red)',
      valueClass: product.pmfScore >= 60
        ? 'text-[--color-retro-green-dark]'
        : product.pmfScore >= 30
          ? 'text-[--color-retro-orange]'
          : 'text-[--color-retro-red]',
      readoutClass: product.pmfScore >= 60 ? 'readout-green' : product.pmfScore >= 30 ? 'readout-amber' : 'readout-red',
      change: pmfChange.change,
      changeDirection: pmfChange.dir,
      hasChart: true,
    },
    {
      label: 'Runway',
      value: runwayStr,
      sparklineData: [],
      sparklineColor: 'var(--color-retro-blue)',
      valueClass: isProfitable || runwayWeeks > 26
        ? 'text-[--color-retro-green-dark]'
        : runwayWeeks >= 12
          ? 'text-[--color-retro-orange]'
          : 'text-[--color-retro-red]',
      readoutClass: 'readout-neutral',
    },
  ];

  return (
    <header className="retro-header relative z-10 px-3 md:px-6 py-2.5 md:py-3">
      <div className="flex items-center gap-3 md:gap-4">
        {/* Company name */}
        <h1
          className="text-base md:text-xl font-extrabold tracking-tight text-[--color-retro-text] shrink-0"
          style={{ textShadow: '0 1px 0 var(--theme-text-shadow)' }}
        >
          {company.name}
        </h1>

        {/* Separator */}
        <span className="header-sep hidden sm:block" aria-hidden="true" />

        {/* Stage badge */}
        <span className={`retro-badge retro-badge-sm shrink-0 hidden sm:inline-flex ${stageBadgeClass}`}>
          {stageLabel}
        </span>

        {/* Separator */}
        <span className="header-sep hidden sm:block" aria-hidden="true" />

        {/* Metrics */}
        <div className="hidden sm:flex items-stretch gap-1.5 min-w-0">
          <div className="readout-neutral flex items-baseline gap-2 rounded-lg px-3 py-2">
            <span className="retro-label" style={{ fontSize: '9px', lineHeight: 1 }}>Wk</span>
            <span className="font-retro-mono text-xs font-medium text-[--color-retro-text]" style={{ lineHeight: 1 }}>
              {meta.week}
            </span>
          </div>
          {readouts.map((config) => (
            <HeaderReadout key={config.label} config={config} />
          ))}
        </div>

        {/* Spacer pushes action button right */}
        <div className="flex-1" />

        {/* Action button */}
        <button
          onClick={hasUrgentUnresolved ? () => setScreen('decisions') : endWeek}
          disabled={isSimulating}
          className={`btn-glossy text-xs md:text-sm shrink-0 ${
            isSimulating
              ? 'btn-silver cursor-not-allowed opacity-60'
              : hasUrgentUnresolved
                ? 'btn-red'
                : 'btn-green'
          }`}
        >
          {isSimulating
            ? 'Simulating...'
            : hasUrgentUnresolved
              ? `Resolve Decisions First (${pendingCount})`
              : 'Next Week \u2192'}
        </button>
      </div>
    </header>
  );
}
