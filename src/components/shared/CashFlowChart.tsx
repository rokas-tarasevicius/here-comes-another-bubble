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
    <div className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 shadow-lg">
      <p className="mb-1 text-xs font-medium text-gray-400">Week {label}</p>
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
  const data: ChartDataPoint[] = weekHistory.map((w) => ({
    week: w.week,
    cash: w.cash,
    revenue: w.revenue,
    burn: w.burn,
  }));

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-gray-800 bg-gray-900 p-4">
        <p className="text-sm text-gray-500">No financial history yet. End a week to see data.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
      <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-gray-400">
        Cash Flow Over Time
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis
              dataKey="week"
              stroke="#6b7280"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              label={{ value: 'Week', position: 'insideBottomRight', offset: -5, fill: '#6b7280', fontSize: 11 }}
            />
            <YAxis
              stroke="#6b7280"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              tickFormatter={formatYAxis}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 12, color: '#9ca3af' }}
            />
            <Line
              type="monotone"
              dataKey="cash"
              name="Cash"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#10b981' }}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#3b82f6' }}
            />
            <Line
              type="monotone"
              dataKey="burn"
              name="Burn"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#ef4444' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
