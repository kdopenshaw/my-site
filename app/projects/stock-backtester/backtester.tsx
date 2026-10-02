"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Strategy } from "./engine";
import TradingNavigation from "./trading-navigation";
import styles from "./backtester.module.css";

type Query = Record<string, string | string[] | undefined>;
export default function Backtester({ strategy, custom, initial }: { strategy: Strategy; custom: boolean; initial: Query }) {
  const label = strategy.toUpperCase();
  const value = (key: string, fallback: string) => typeof initial[key] === "string" ? initial[key] : fallback;
  const [dates, setDates] = useState({ start: value("start", ""), end: value("end", "") });
  function pastYear() {
    const end = new Date(Date.now() - 86_400_000);
    return { start: new Date(end.getTime() - 365 * 86_400_000).toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
  }
  useEffect(() => { setDates((current) => current.start && current.end ? current : pastYear()); }, []);
  return <section className={styles.strategyPage}>
    <header className={styles.pageHeader}>
      <h1>{label}-Based Trading Strategy{custom ? ": Custom Parameters" : ""}</h1>
      <TradingNavigation />
    </header>
    <div className={custom ? styles.customLayout : styles.strategyLayout}>
      <form action="/projects/stock-backtester/results" method="get" className={styles.formPanel}>
        <fieldset className={styles.fields}>
          <legend className={styles.formLegend}>{custom ? "Strategy parameters" : "Enter Symbol"}</legend>
          <input type="hidden" name="strategy" value={strategy} />
          <input type="hidden" name="mode" value={custom ? "custom" : "basic"} />
          <div className={custom ? styles.customFields : undefined}>
            <div>
              <label className={styles.field}>Stock symbols<input name="symbols" required maxLength={100} placeholder="e.g. AAPL MSFT" defaultValue={value("symbols", "")} autoCapitalize="characters" spellCheck={false} aria-describedby="symbol-help" /></label>
              <p id="symbol-help" className={styles.muted}>Up to five symbols, separated by spaces or commas.</p>
              {custom && <>
                <label className={styles.field}>{label} period<input name="period" type="number" required min="2" max="200" step="1" defaultValue={value("period", "14")} /></label>
                <label className={styles.field}>{strategy === "rsi" ? "Buy RSI threshold" : "Buy threshold (% above SMA)"}<input name="buy" type="number" required min="0" max="100" step="0.1" defaultValue={value("buy", strategy === "rsi" ? "30" : "2")} /></label>
                <label className={styles.field}>{strategy === "rsi" ? "Sell RSI threshold" : "Sell threshold (% above SMA)"}<input name="sell" type="number" required min="0" max="100" step="0.1" defaultValue={value("sell", strategy === "rsi" ? "65" : "5")} /></label>
              </>}
            </div>
            {custom ? <div>
              <label className={styles.field}>Start date<input name="start" type="date" required min="2016-01-01" value={dates.start} onChange={(e) => setDates({ ...dates, start: e.target.value })} /></label>
              <label className={styles.field}>End date<input name="end" type="date" required min={dates.start || "2016-01-01"} value={dates.end} onChange={(e) => setDates({ ...dates, end: e.target.value })} /></label>
              <label className={styles.field}>Initial account balance (USD)<input name="initialBalance" type="number" required min="1" max="10000000" step="0.01" defaultValue={value("initialBalance", "100000")} /></label>
              <button className="button-outline" type="button" onClick={() => setDates(pastYear())}>Use the past year</button>
            </div> : <>{Object.entries({ ...dates, period: 14, initialBalance: 100000, buy: strategy === "rsi" ? 30 : 2, sell: strategy === "rsi" ? 65 : 5 }).map(([name, val]) => <input key={name} type="hidden" name={name} value={val} />)}</>}
          </div>
          <button type="submit" className="button" disabled={!dates.start || !dates.end}>Submit</button>
        </fieldset>
      </form>
      <div className={styles.explanation}>
        <p>{custom ? `Customize your ${label} strategy using the form. Choose the indicator period and thresholds, then set the dates and starting balance.` : `This strategy uses the ${strategy === "rsi" ? "Relative Strength Index (RSI)" : "Simple Moving Average (SMA)"} to define when to buy and sell shares. Enter a stock symbol to run it with the assumptions below.`}</p>
        <h2>{custom ? "Parameter Guide" : "Assumptions"}</h2>
        <ul>
          <li><strong>Time frame:</strong> {custom ? "choose up to five years, ending no later than yesterday." : "the past year."}</li>
          <li><strong>Initial account balance:</strong> {custom ? "the cash available to all selected stocks." : "$100,000, shared across all selected stocks."}</li>
          <li><strong>{label} calculation period:</strong> {custom ? "2–200 trading sessions; the default is 14." : "14 trading sessions."}</li>
          <li><strong>Execution:</strong> signals use the daily close and fill at the next session’s open, when cash is available.</li>
        </ul>
        <h2>{strategy === "rsi" ? "Buying Shares (RSI Below 30)" : "Buying Shares (Price Close to SMA)"}</h2>
        <p>{strategy === "rsi" ? "The default rule buys one share for each session when RSI is below 30. This tests an oversold-price hypothesis." : "The default rule buys one share for each session when the closing price is between 0% and 2% above its moving average."} {custom && "Change the buy threshold to test a different rule."}</p>
        <h2>{strategy === "rsi" ? "Selling Shares (RSI Above 65)" : "Selling Shares (Price Above SMA)"}</h2>
        <p>{strategy === "rsi" ? "The default rule sells all held shares of a stock when RSI rises above 65." : "The default rule sells all held shares of a stock when the closing price is more than 5% above its moving average."} {custom && "The sell threshold must be higher than the buy threshold."}</p>
        <p className={styles.muted}>Prices are split-adjusted. The simulation excludes dividends, fees, slippage, taxes, and interest. Historical results do not predict future returns.</p>
        <Link className="button-outline" href={`/projects/stock-backtester/${strategy}${custom ? "" : "/custom"}`}>{custom ? `Back to basic ${label} Strategy` : `Go to ${label} Strategy with custom parameters`}</Link>
      </div>
    </div>
  </section>;
}
