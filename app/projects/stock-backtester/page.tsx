import type { Metadata } from "next";
import Link from "next/link";
import MarketOverview from "./market-overview";
import styles from "./backtester.module.css";
export const metadata: Metadata = { title: "Technical Threshold Backtesting | Keith Openshaw", description: "Backtest RSI and SMA threshold strategies against historical market data." };
export default function StockBacktesterPage() {
  return <>
    <h1 className="heading-accent" id="stock-backtester-heading">Technical Threshold Backtesting</h1>
    <section className={styles.section}>
      <h2>About</h2>
      <p>This is trading application I built in 2021 to investigate the effectiveness of technical trading strategies. It uses the alpaca API to get historical stock prices and backtest technical strategies using default or customer parameters. It focuses on the two most common technical indicators: relative strength index (RSI) and simple moving average (SMA).</p>
    </section>
    <div className={styles.strategyChoices}>
      {(["rsi", "sma"] as const).map((strategy) => <section key={strategy}>
        <h2>{strategy.toUpperCase()} Analysis</h2>
        <p>{strategy === "rsi" ? "Explore a relative strength index strategy. Enter the stocks you want to analyze, or customize the thresholds and time frame." : "Explore a simple moving average strategy. Test buying near the average and selling when the price moves further above it."}</p>
        <div className={styles.actions}><Link className="button" href={`/projects/stock-backtester/${strategy}`}>Go to {strategy.toUpperCase()} Strategy</Link><Link className="button-outline" href={`/projects/stock-backtester/${strategy}/custom`}>Custom parameters</Link></div>
      </section>)}
    </div>
    <MarketOverview />
    <section className={styles.section}>
      <h2>Backtesting Overview</h2>
      <p>Apply a strategy to historical prices to evaluate its performance, identify weaknesses, and experiment with different parameters.</p>
      <div className={styles.aboutColumns}>
        <section><h3>Alpaca API Integration</h3><p>Historical daily prices come from Alpaca. Trades are simulated locally by the backtest engine; the application does not place orders.</p></section>
      </div>
    </section>
  </>;
}
