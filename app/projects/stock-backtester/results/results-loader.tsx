"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { BacktestResult } from "../engine";
import Results from "../results";
import styles from "../backtester.module.css";
export default function ResultsLoader({ payload, editHref }: { payload: string; editHref: string }) {
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeout = setTimeout(() => controller.abort(), 30_000);
    setResult(null); setError("");
    fetch("/api/stock-backtest", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, signal: controller.signal })
      .then(async (response) => { const body = await response.json(); if (!response.ok) throw new Error(body.error || "The backtest could not be completed."); return body; })
      .then((body) => { if (active) setResult(body); })
      .catch((error) => { if (active) setError(error.name === "AbortError" ? "The request timed out. Please try again." : error.message); })
      .finally(() => clearTimeout(timeout));
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [payload, attempt]);
  return <>
    <Link href={editHref} className={styles.back}>Back to strategy settings</Link>
    {result ? <Results key={payload} result={result} /> : <>
      <h1>Backtesting Results</h1>
      {error ? <div role="alert"><p>{error}</p><button type="button" className="button-outline" onClick={() => setAttempt((n) => n + 1)}>Try again</button></div> : <p role="status">Loading historical prices and calculating trades…</p>}
    </>}
  </>;
}
