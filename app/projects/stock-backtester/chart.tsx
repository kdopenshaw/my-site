"use client";
import { useEffect, useId, useRef, useState } from "react";
import styles from "./backtester.module.css";
type Point = { date: string; value: number | null };
export type ChartLine = { name: string; points: Point[]; marker?: "buy" | "sell" };
export default function Chart({ title, lines, unit = "currency" }: { title: string; lines: ChartLine[]; unit?: "currency" | "number" | "percent" }) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  const serialized = JSON.stringify(lines);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let active = true;
    let plotly: typeof import("plotly.js-basic-dist-min").default | undefined;
    let resize: ResizeObserver | undefined;
    let theme: MutationObserver | undefined;
    setError(false);
    import("plotly.js-basic-dist-min").then(async ({ default: library }) => {
      if (!active) return;
      plotly = library;
      const render = async () => {
        const css = getComputedStyle(element);
        const token = (name: string) => css.getPropertyValue(name).trim();
        const colors = [token("--color-heading-accent"), token("--color-accent-text"), token("--color-text")];
        const data: ChartLine[] = JSON.parse(serialized);
        await library.react(element, data.map((line, index) => ({
          type: "scatter", mode: line.marker ? "markers" : "lines", name: line.name,
          x: line.points.map((point) => point.date), y: line.points.map((point) => point.value),
          line: { color: colors[index % colors.length], width: 2 },
          marker: { color: line.marker === "sell" ? token("--color-loss") : line.marker === "buy" ? token("--color-gain") : colors[index % colors.length], symbol: line.marker === "sell" ? "triangle-down" : "triangle-up", size: 10 },
          hovertemplate: `%{x|%b %d, %Y}<br>${unit === "currency" ? "$" : ""}%{y:.2f}${unit === "percent" ? "%" : ""}<extra>%{fullData.name}</extra>`,
        })), {
          autosize: true, margin: { l: 65, r: 16, t: 15, b: 65 },
          paper_bgcolor: token("--color-background"), plot_bgcolor: token("--color-background"),
          font: { family: css.fontFamily, color: token("--color-text"), size: 12 },
          xaxis: { type: "date", gridcolor: token("--color-border"), zeroline: false, automargin: true },
          yaxis: { gridcolor: token("--color-border"), zeroline: false, automargin: true, tickprefix: unit === "currency" ? "$" : "", ticksuffix: unit === "percent" ? "%" : "" },
          hovermode: "x unified", dragmode: "zoom", legend: { orientation: "h", y: -0.2 },
          transition: { duration: 0 }, uirevision: serialized,
        }, { responsive: true, displaylogo: false, displayModeBar: true, scrollZoom: false, modeBarButtonsToRemove: ["select2d", "lasso2d"] });
      };
      await render();
      if (!active) { library.purge(element); return; }
      resize = new ResizeObserver(() => { if (active) void library.Plots.resize(element); });
      resize.observe(element);
      theme = new MutationObserver(() => { if (active) void render().catch(() => setError(true)); });
      theme.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    }).catch(() => { if (active) setError(true); });
    return () => { active = false; resize?.disconnect(); theme?.disconnect(); plotly?.purge(element); };
  }, [serialized, unit]);
  return <figure className={styles.chart}>
    <figcaption id={id}>{title}</figcaption>
    {error && <p role="alert">The interactive chart could not load.</p>}
    <div ref={ref} className={styles.plot} role="img" aria-labelledby={id} />
  </figure>;
}
