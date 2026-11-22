import SpeedByType from './SpeedByType';
import StatDistribution from './StatDistribution';
import StatLandscape from './StatLandscape';
import StatProfiles from './StatProfiles';
import type { ComponentType } from 'react';
import type { DataRow } from '../data/types';

export type BookChartProps = {
  data: DataRow[];
};

const charts: Record<string, ComponentType<BookChartProps>> = { SpeedByType, StatDistribution, StatLandscape, StatProfiles };
export function listBookCharts() { return Object.keys(charts); }
export function resolveBookChart(name: string) { return charts[name] ?? null; }
