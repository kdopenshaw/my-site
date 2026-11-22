import { useState } from 'react';
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart } from 'recharts';
import { BookTooltip, ResponsiveFrame } from '../components/charts/ResponsiveFrame';
import type { BookChartProps } from './registry';
import '../components/theme/statProfiles.css';

const stats = [
  ['hp', 'HP', 'HP'],
  ['atk', 'Attack', 'Atk'],
  ['def', 'Defense', 'Def'],
  ['spd', 'Sp. Defense', 'Sp. Def'],
  ['spa', 'Sp. Attack', 'Sp. Atk'],
  ['speed', 'Speed', 'Speed'],
] as const;

const matchups = [
  { label: 'Speed vs. defense', first: 'Alakazam', second: 'Shuckle' },
  { label: 'Sprint vs. shell', first: 'Ninjask', second: 'Shuckle' },
  { label: 'Kanto rivals', first: 'Charizard', second: 'Blastoise' },
];

export default function StatProfiles({ data }: BookChartProps) {
  const [first, setFirst] = useState('Alakazam');
  const [second, setSecond] = useState('Shuckle');
  const a = data.find((row) => row.name === first) ?? data[0];
  const b = data.find((row) => row.name === second) ?? data[1] ?? a;
  const firstName = String(a.name);
  const secondName = String(b.name);
  const profile = stats.map(([key, label, short]) => ({
    label,
    short,
    first: Number(a[key]),
    second: Number(b[key]),
  }));
  const options = data.map((row) => (
    <option key={String(row.name)}>{String(row.name)}</option>
  ));

  return (
    <div className="dbk-stat-profiles">
      <div className="dbk-pokemon-presets" role="group" aria-label="Featured matchups">
        {matchups.filter((match) => data.some((row) => row.name === match.first)
          && data.some((row) => row.name === match.second)).map((match) => (
          <button key={match.label} type="button"
            aria-pressed={firstName === match.first && secondName === match.second}
            onClick={() => {
              setFirst(match.first);
              setSecond(match.second);
            }}>
            {match.label}
          </button>
        ))}
      </div>
      <div className="dbk-profile-controls">
        <label>
          Pokémon A
          <select value={firstName} onChange={(event) => setFirst(event.target.value)}>{options}</select>
        </label>
        <label>
          Pokémon B
          <select value={secondName} onChange={(event) => setSecond(event.target.value)}>{options}</select>
        </label>
      </div>
      <div className="dbk-profile-comparison">
        <ResponsiveFrame height={314}>
          <RadarChart data={profile} outerRadius="73%">
            <PolarGrid stroke="var(--dbk-border)" />
            <PolarAngleAxis dataKey="short" tick={{ fill: 'var(--dbk-fg)', fontSize: 12 }} />
            <PolarRadiusAxis angle={90} domain={[0, 250]} ticks={[0, 50, 100, 150, 200, 250]}
              tickCount={6} tick={{ fill: 'var(--dbk-muted)', fontSize: 10 }} axisLine={false} />
            <BookTooltip labelFormatter={(_, items) => items[0]?.payload.label} />
            <Radar dataKey="first" name={firstName} stroke="var(--dbk-series-1)" fill="var(--dbk-series-1)"
              fillOpacity={0.20} strokeWidth={2} isAnimationActive={false} />
            <Radar dataKey="second" name={secondName} stroke="var(--dbk-series-2)" fill="var(--dbk-series-2)"
              fillOpacity={0.16} strokeWidth={2} strokeDasharray="5 3" isAnimationActive={false} />
          </RadarChart>
        </ResponsiveFrame>
        <table className="dbk-profile-table">
          <caption>Base stats for selected Pokémon</caption>
          <thead>
            <tr><th scope="col">Stat</th><th scope="col">{firstName}</th><th scope="col">{secondName}</th></tr>
          </thead>
          <tbody>
            {profile.map((stat) => (
              <tr key={stat.label}>
                <th scope="row">{stat.label}</th>
                <td>{stat.first}</td>
                <td>{stat.second}</td>
              </tr>
            ))}
            <tr>
              <th scope="row">Total</th><td>{String(a.total)}</td><td>{String(b.total)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
