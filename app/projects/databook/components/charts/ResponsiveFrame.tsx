import { useEffect, useState, type ComponentProps, type CSSProperties, type ReactElement } from 'react';
import { ResponsiveContainer, Tooltip } from 'recharts';

type Props = {
  children: ReactElement;
  height?: number;
};

/** Thin responsive wrapper around Recharts; theme colors come from CSS variables. */
export function ResponsiveFrame({ children, height = 320 }: Props) {
  return (
    <div className="dbk-responsive-frame" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

export function readCssVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

/**
 * Changes whenever the `<html>` class (light/dark) changes.
 * `chartColors()` is read at render time only — remount charts with this key
 * after ThemeToggle flips `document.documentElement.classList`.
 */
export function useThemeKey(): string {
  const read = () => (typeof document === 'undefined' ? '' : document.documentElement.className);
  const [key, setKey] = useState(read);
  useEffect(() => {
    const obs = new MutationObserver(() => setKey(read()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return key;
}

export function chartColors() {
  return {
    fg: readCssVar('--dbk-fg', '#ededed'),
    muted: readCssVar('--dbk-muted', '#a1a1a1'),
    border: readCssVar('--dbk-border', '#2e2e2e'),
    grid: readCssVar('--dbk-grid', '#1f1f1f'),
    surface: readCssVar('--dbk-surface', '#111111'),
    series: [
      readCssVar('--dbk-series-1', '#56b4e9'),
      readCssVar('--dbk-series-2', '#e69f00'),
      readCssVar('--dbk-series-3', '#009e73'),
      readCssVar('--dbk-series-4', '#f0e442'),
      readCssVar('--dbk-series-5', '#cc79a7'),
      readCssVar('--dbk-series-6', '#d55e00'),
      readCssVar('--dbk-series-7', '#0072b2'),
      readCssVar('--dbk-series-8', '#9a9a9a'),
    ],
  };
}

/** Themed Recharts tooltip — default white box + inherited fg fails in dark mode. */
export function BookTooltip(props: ComponentProps<typeof Tooltip>) {
  const c = chartColors();
  const contentStyle: CSSProperties = {
    backgroundColor: c.surface,
    border: `1px solid ${c.border}`,
    borderRadius: 6,
    padding: '8px 10px',
    boxShadow: '0 10px 28px rgba(0, 0, 0, 0.28)',
    fontSize: 12,
    lineHeight: 1.4,
    color: c.fg,
    ...(props.contentStyle as CSSProperties | undefined),
  };
  const labelStyle: CSSProperties = {
    color: c.muted,
    fontSize: 12,
    fontWeight: 500,
    marginBottom: 4,
    ...(props.labelStyle as CSSProperties | undefined),
  };
  const itemStyle: CSSProperties = {
    color: c.fg,
    fontSize: 12,
    padding: '1px 0',
    ...(props.itemStyle as CSSProperties | undefined),
  };
  return (
    <Tooltip
      isAnimationActive={false}
      separator=": "
      cursor={{ fill: 'color-mix(in srgb, var(--dbk-fg) 6%, transparent)' }}
      wrapperStyle={{ outline: 'none', zIndex: 20 }}
      {...props}
      contentStyle={contentStyle}
      labelStyle={labelStyle}
      itemStyle={itemStyle}
    />
  );
}
