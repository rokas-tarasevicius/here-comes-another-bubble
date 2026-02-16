import { LineChart, Line, ResponsiveContainer } from 'recharts';

export interface SparklineChartProps {
  data: number[];
  color?: string;   // hex color string, e.g. "#10b981"
  height?: number;  // default 40
  width?: number;   // default 120
}

/**
 * Tiny inline line chart with no axes, grid, or labels.
 * Renders a smooth monotone curve for sparkline-style display.
 */
export function SparklineChart({
  data,
  color = '#10b981',
  height = 40,
  width = 120,
}: SparklineChartProps) {
  if (data.length < 2) return null;

  const chartData = data.map((value, index) => ({ index, value }));

  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
