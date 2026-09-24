import type { Metadata } from "next";
import Link from "next/link";
import MarketOverview from "./market-overview";
import styles from "./backtester.module.css";
export const metadata: Metadata = { title: "Trading Application | Keith Openshaw", description: "Analyze and test RSI and SMA trading strategies with historical market data." };
export default function StockBacktesterPage() {
  return <>
    <header className={styles.welcome}>
      <h1>Welcome to My Trading Application!</h1>
      <p>Analyze and test technical indicators</p>
    </header>
    <section className={styles.section}>
      <h2>About</h2>
      <p>This trading application began as a personal Python and Flask project to explore computer science and financial markets. It focuses on backtesting: applying a strategy to historical stock prices to understand how it would have performed.</p>
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
        <section><h3>Key Ideas</h3><ul><li><strong>Hypothesis-driven development:</strong> turn a trading idea into explicit rules.</li><li><strong>Data-driven decisions:</strong> inspect returns, open positions, and individual trades.</li><li><strong>Iterative testing:</strong> compare parameters across different stocks and periods.</li><li><strong>Risk awareness:</strong> review drawdowns as well as gains.</li></ul></section>
      </div>
    </section>
  </>;
}
