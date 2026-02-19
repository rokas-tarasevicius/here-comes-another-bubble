import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { WeekSummary } from '../../types/game.ts';
import { formatCurrency } from '../../utils/format.ts';
import { InfoTip } from './InfoTip.tsx';
import { useChartColors } from '../../hooks/useChartColors.ts';

export interface CashFlowChartProps {
  weekHistory: WeekSummary[];
}

interface ChartDataPoint {
  week: number;
  cash: number;
  revenue: number;
  burn: number;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { color: string; name: string; value: number }[];
  label?: number;
}) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="retro-card" style={{ padding: '8px 12px' }}>
      <p className="mb-1 text-xs font-bold text-[--color-retro-text-muted]">Week {label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
}

function formatYAxis(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
}

/**
 * Line chart showing cash, revenue, and burn over time.
 * Uses Recharts with responsive sizing.
 */
export function CashFlowChart({ weekHistory }: CashFlowChartProps) {
  const colors = useChartColors();
  const data: ChartDataPoint[] = weekHistory.map((w) => ({
    week: w.week,
    cash: w.cash,
    revenue: w.revenue,
    burn: w.burn,
  }));

  if (data.length === 0) {
    return (
      <div className="retro-card flex h-64 items-center justify-center">
        <p className="text-sm text-[--color-retro-text-muted]">No financial history yet. End a week to see data.</p>
      </div>
    );
  }

  return (
    <div className="retro-card">
      <h3 className="retro-section-heading">
        Cash Flow Over Time<InfoTip text="Tracks your Cash (total funds), Revenue (weekly income), and Burn (weekly expenses) over time. When the burn line stays above revenue, you're losing money each week." />
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
            <XAxis
              dataKey="week"
              stroke={colors.axis}
              tick={{ fill: colors.tick, fontSize: 12 }}
              label={{ value: 'Week', position: 'insideBottomRight', offset: -5, fill: colors.axis, fontSize: 11 }}
            />
            <YAxis
              stroke={colors.axis}
              tick={{ fill: colors.tick, fontSize: 12 }}
              tickFormatter={formatYAxis}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 12, color: colors.tick }}
            />
            <Line
              type="monotone"
              dataKey="cash"
              name="Cash"
              stroke={colors.blue}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: colors.blue }}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke={colors.green}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: colors.green }}
            />
            <Line
              type="monotone"
              dataKey="burn"
              name="Burn"
              stroke={colors.red}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: colors.red }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
