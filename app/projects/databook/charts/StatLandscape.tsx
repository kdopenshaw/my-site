import { useMemo, useState } from 'react';
import { CartesianGrid, Scatter, ScatterChart, XAxis, YAxis } from 'recharts';
import { BookTooltip, ResponsiveFrame } from '../components/charts/ResponsiveFrame';
import type { BookChartProps } from './registry';
import '../components/theme/statProfiles.css';

const ticks = { fill: 'var(--dbk-muted)', fontSize: 12 };

export default function StatLandscape({ data }: BookChartProps) {
  const [type, setType] = useState('');
  const types = useMemo(() => [...new Set(data.map((row) => String(row.type)))].sort(), [data]);
  const visible = type ? data.filter((row) => row.type === type) : data;

  return (
    <>
      <div className="dbk-profile-controls">
        <label>
          Primary type
          <select value={type} onChange={(event) => setType(event.target.value)}>
            <option value="">All types</option>
            {types.map((name) => <option key={name}>{name}</option>)}
          </select>
        </label>
      </div>
      <p className="dbk-pokemon-key" aria-live="polite">
        <span>{visible.length} Pokémon</span>
        <span className="dbk-pokemon-key-other">Other</span>
        <span className="dbk-pokemon-key-legendary">Legendary</span>
      </p>
      <ResponsiveFrame height={340}>
        <ScatterChart margin={{ top: 8, right: 12, bottom: 24, left: 12 }}>
          <CartesianGrid stroke="var(--dbk-grid)" />
          <XAxis type="number" dataKey="total" name="Base stat total" domain={[150, 750]}
            tick={ticks} label={{ value: 'Base stat total', position: 'bottom', fill: 'var(--dbk-muted)' }} />
          <YAxis type="number" dataKey="speed" name="Speed" domain={[0, 200]} width={38}
            tick={ticks} label={{ value: 'Speed', angle: -90, position: 'insideLeft', fill: 'var(--dbk-muted)' }} />
          <BookTooltip cursor={false} labelFormatter={(_, items) => items[0]?.payload.name} />
          <Scatter name="Other" data={visible.filter((row) => !row.legendary)} fill="var(--dbk-series-1)"
            fillOpacity={0.48} isAnimationActive={false} />
          <Scatter name="Legendary" data={visible.filter((row) => row.legendary)} fill="var(--dbk-series-2)"
            shape="diamond" isAnimationActive={false} />
        </ScatterChart>
      </ResponsiveFrame>
    </>
  );
}
