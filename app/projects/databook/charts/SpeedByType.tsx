import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { BookTooltip, ResponsiveFrame } from '../components/charts/ResponsiveFrame';
import type { BookChartProps } from './registry';

export default function SpeedByType({ data }: BookChartProps) {
  return (
    <ResponsiveFrame height={data.length * 27 + 36}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid horizontal={false} stroke="var(--dbk-grid)" />
        <XAxis type="number" domain={[0, 100]} tick={{ fill: 'var(--dbk-muted)', fontSize: 12 }}
          axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="type" width={64} interval={0}
          tick={{ fill: 'var(--dbk-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
        <BookTooltip formatter={(value, name, entry) => [
          `${Number(value).toFixed(1)} (${entry.payload.count} species)`,
          name,
        ]} />
        <Bar dataKey="mean_speed" name="Mean Speed" fill="var(--dbk-series-1)"
          maxBarSize={15} radius={[0, 2, 2, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveFrame>
  );
}
