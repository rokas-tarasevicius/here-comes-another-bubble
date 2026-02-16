import { SparklineChart } from './SparklineChart.tsx';

export interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'flat';
  trendValue?: string;
  color?: 'emerald' | 'red' | 'amber' | 'blue' | 'violet';
  sparklineData?: number[];
}

const BORDER_COLORS: Record<NonNullable<KPICardProps['color']>, string> = {
  emerald: 'border-l-emerald-500',
  red: 'border-l-red-500',
  amber: 'border-l-amber-500',
  blue: 'border-l-blue-500',
  violet: 'border-l-violet-500',
};

const SPARKLINE_HEX: Record<NonNullable<KPICardProps['color']>, string> = {
  emerald: '#10b981',
  red: '#ef4444',
  amber: '#f59e0b',
  blue: '#3b82f6',
  violet: '#8b5cf6',
};

const VALUE_COLORS: Record<NonNullable<KPICardProps['color']>, string> = {
  emerald: 'text-emerald-400',
  red: 'text-red-400',
  amber: 'text-amber-400',
  blue: 'text-blue-400',
  violet: 'text-violet-400',
};

const TREND_ICONS: Record<NonNullable<KPICardProps['trend']>, string> = {
  up: '\u2191',
  down: '\u2193',
  flat: '\u2192',
};

const TREND_COLORS: Record<NonNullable<KPICardProps['trend']>, string> = {
  up: 'text-emerald-400',
  down: 'text-red-400',
  flat: 'text-gray-400',
};

/**
 * Reusable KPI metric card with large value, trend indicator, and optional sparkline.
 */
export function KPICard({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  color = 'emerald',
  sparklineData,
}: KPICardProps) {
  const borderColor = BORDER_COLORS[color];
  const valueColor = VALUE_COLORS[color];
  const sparkHex = SPARKLINE_HEX[color];

  return (
    <div
      className={`rounded-lg border border-gray-800 border-l-4 ${borderColor} bg-gray-900 p-4 flex flex-col gap-2`}
    >
      {/* Title */}
      <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
        {title}
      </span>

      {/* Main value + trend row */}
      <div className="flex items-end justify-between gap-2">
        <span className={`text-2xl font-bold font-mono ${valueColor}`}>
          {value}
        </span>
        {trend && (
          <span className={`text-sm font-medium ${TREND_COLORS[trend]}`}>
            {TREND_ICONS[trend]} {trendValue ?? ''}
          </span>
        )}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <span className="text-xs text-gray-500">{subtitle}</span>
      )}

      {/* Sparkline */}
      {sparklineData && sparklineData.length >= 2 && (
        <div className="mt-1">
          <SparklineChart
            data={sparklineData}
            color={sparkHex}
            height={36}
            width={160}
          />
        </div>
      )}
    </div>
  );
}
