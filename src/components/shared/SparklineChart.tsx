import { LineChart, Line, ResponsiveContainer } from 'recharts';

export interface SparklineChartProps {
  data: number[];
  color?: string;
  height?: number;
}

/**
 * Tiny inline line chart with no axes, grid, or labels.
 * Renders a smooth monotone curve for sparkline-style display.
 * Fills the full width of its parent container.
 */
export function SparklineChart({
  data,
  color = '#336699',
  height = 40,
}: SparklineChartProps) {
  if (data.length < 2) return null;

  const chartData = data.map((value, index) => ({ index, value }));

  return (
    <ResponsiveContainer width="100%" height={height}>
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
  );
}
