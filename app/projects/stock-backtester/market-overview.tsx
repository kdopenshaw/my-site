"use client";
import { useCallback, useEffect, useState } from "react";
import type { Bar } from "./engine";
import Chart from "./chart";
import styles from "./backtester.module.css";

type Overview = {
  feed: string; start: string; end: string;
  indices: { symbol: string; points: Bar[] }[];
  stocks: { symbol: string; date: string | null; close: number | null; ytd: number | null }[];
};

export default function MarketOverview() {
  const [data, setData] = useState<Overview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async (signal?: AbortSignal) => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/stock-backtest/overview", { signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(30_000)]) : AbortSignal.timeout(30_000) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "The market overview could not be loaded.");
      if (!signal?.aborted) setData(body);
    } catch (error) {
      if (!signal?.aborted) setError(error instanceof Error && error.name !== "TimeoutError" ? error.message : "The request timed out. Please try again.");
    } finally { if (!signal?.aborted) setBusy(false); }
  }, []);
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, [load]);
  return <section className={styles.section} aria-labelledby="market-heading" aria-busy={busy}>
    <h2 id="market-heading">Market overview</h2>
    <p>Compare SPY, QQQ, and DIA over the past year, alongside closing prices and year-to-date changes for selected stocks.</p>
    <button className="button-outline" type="button" onClick={() => load()} disabled={busy}>{busy ? "Loading prices…" : data ? "Refresh overview" : "Load market overview"}</button>
    <p role="status" className={styles.status}>{busy ? "Loading market prices…" : ""}</p>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {data && <>
      <p className={styles.muted}>{data.start} to {data.end} · Alpaca {data.feed.toUpperCase()} · Split-adjusted prices, excluding dividends</p>
      <div className={styles.marketGrid}><div className={styles.marketCharts}>
      <Chart title="Index ETF closing prices" lines={data.indices.map((index) => ({ name: index.symbol, points: index.points.map((point) => ({ date: point.date, value: point.close })) }))} />
      <Chart title="Change from first available close" unit="percent" lines={data.indices.map((index) => ({ name: index.symbol, points: index.points.map((point) => ({ date: point.date, value: (point.close / index.points[0].close - 1) * 100 })) }))} />
      </div><div className={styles.tableScroll} tabIndex={0} role="region" aria-label="Market prices table"><table>
        <caption>YTD change is measured from the last available close before January 1. Missing prices appear as a dash.</caption>
        <thead><tr><th scope="col">Symbol</th><th scope="col">Close ($)</th><th scope="col">YTD</th></tr></thead>
        <tbody>{data.stocks.map((stock) => <tr key={stock.symbol}><th scope="row" title={stock.date ? `As of ${stock.date}` : "No data"}>{stock.symbol}</th><td>{stock.close === null ? "—" : stock.close.toFixed(2)}</td><td>{stock.ytd === null ? "—" : `${stock.ytd.toFixed(2)}%`}</td></tr>)}</tbody>
      </table></div></div>
    </>}
  </section>;
}
