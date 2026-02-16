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
  emerald: 'border-l-[--color-retro-green]',
  red: 'border-l-[--color-retro-red]',
  amber: 'border-l-[--color-retro-orange]',
  blue: 'border-l-[--color-retro-blue]',
  violet: 'border-l-[--color-retro-purple]',
};

const SPARKLINE_HEX: Record<NonNullable<KPICardProps['color']>, string> = {
  emerald: '#339933',
  red: '#cc3333',
  amber: '#ff6600',
  blue: '#336699',
  violet: '#663399',
};

const VALUE_COLORS: Record<NonNullable<KPICardProps['color']>, string> = {
  emerald: 'text-[--color-retro-green]',
  red: 'text-[--color-retro-red]',
  amber: 'text-[--color-retro-orange]',
  blue: 'text-[--color-retro-blue]',
  violet: 'text-[--color-retro-purple]',
};

const TREND_ICONS: Record<NonNullable<KPICardProps['trend']>, string> = {
  up: '\u2191',
  down: '\u2193',
  flat: '\u2192',
};

const TREND_COLORS: Record<NonNullable<KPICardProps['trend']>, string> = {
  up: 'text-[--color-retro-green]',
  down: 'text-[--color-retro-red]',
  flat: 'text-[--color-retro-text-muted]',
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
      className={`retro-card border-l-4 ${borderColor} flex flex-col gap-2`}
    >
      {/* Title */}
      <span className="text-xs font-medium uppercase tracking-wider text-[--color-retro-text-muted]">
        {title}
      </span>

      {/* Main value + trend row */}
      <div className="flex items-end justify-between gap-2">
        <span className={`text-2xl font-bold font-[--font-retro-mono] ${valueColor}`}>
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
        <span className="text-xs text-[--color-retro-text-light]">{subtitle}</span>
      )}

      {/* Sparkline */}
      {sparklineData && sparklineData.length >= 2 && (
        <div className="mt-1 rounded bg-[--color-retro-bg-alt] p-1">
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
