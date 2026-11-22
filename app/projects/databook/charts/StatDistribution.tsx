import { Bar, BarChart, CartesianGrid, Legend, XAxis, YAxis } from 'recharts';
import { BookTooltip, ResponsiveFrame } from '../components/charts/ResponsiveFrame';
import type { BookChartProps } from './registry';

export default function StatDistribution({ data }: BookChartProps) {
  const legendaryTotal = data.reduce((sum, row) => sum + Number(row.legendary_count), 0);
  const otherTotal = data.reduce((sum, row) => sum + Number(row.other_count), 0);
  const bins = data.map((row) => ({
    start: Number(row.total_bin),
    end: Number(row.total_bin_end) - 1,
    legendary_count: Number(row.legendary_count),
    other_count: Number(row.other_count),
    legendary: legendaryTotal ? Number(row.legendary_count) / legendaryTotal * 100 : 0,
    other: otherTotal ? Number(row.other_count) / otherTotal * 100 : 0,
  }));
  return (
    <ResponsiveFrame height={300}>
      <BarChart data={bins} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--dbk-grid)" />
        <XAxis dataKey="start" tick={{ fill: 'var(--dbk-muted)', fontSize: 12 }}
          axisLine={false} tickLine={false} interval={1} />
        <YAxis width={42} tick={{ fill: 'var(--dbk-muted)', fontSize: 12 }}
          axisLine={false} tickLine={false} tickFormatter={(value) => `${value}%`} />
        <BookTooltip
          labelFormatter={(value) => {
            const bin = bins.find((item) => item.start === Number(value));
            return bin ? `${bin.start}–${bin.end} total points` : String(value);
          }}
          formatter={(value, name, entry) => {
            const bin = entry.payload as (typeof bins)[number];
            const count = entry.dataKey === 'legendary' ? bin.legendary_count : bin.other_count;
            return [`${Number(value).toFixed(1)}% (${count})`, name];
          }}
        />
        <Legend iconType="circle" iconSize={8} />
        <Bar dataKey="other" name="Other" fill="var(--dbk-series-2)" radius={[2, 2, 0, 0]} isAnimationActive={false} />
        <Bar dataKey="legendary" name="Legendary" fill="var(--dbk-series-1)" radius={[2, 2, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveFrame>
  );
}
