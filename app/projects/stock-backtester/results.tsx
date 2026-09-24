import { useState } from "react";
import type { BacktestResult, Trade } from "./engine";
import Chart from "./chart";
import TradingNavigation from "./trading-navigation";
import styles from "./backtester.module.css";

const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
const percent = (value: number) => `${value.toFixed(2)}%`;

function TradeTable({ trades, open }: { trades: Trade[]; open: boolean }) {
  return (
    <section className={styles.section}>
      <h3>{open ? "Open positions" : "Closed trades"} ({trades.length})</h3>
      {trades.length === 0 ? <p className={styles.muted}>{open ? "No shares held at the end of this period." : "No shares sold during this period."}</p> :
        <div className={styles.tableScroll} tabIndex={0} role="region" aria-label={open ? "Open positions table" : "Closed trades table"}>
          <table>
            <caption>Each row represents one share. All amounts are in USD.</caption>
            <thead><tr><th scope="col">Symbol</th><th scope="col">Bought</th><th scope="col">Entry</th><th scope="col">{open ? "Last price date" : "Sold"}</th><th scope="col">{open ? "Last close" : "Exit"}</th><th scope="col">Gain / loss</th><th scope="col">Return</th></tr></thead>
            <tbody>{trades.map((trade, index) => <tr key={`${trade.symbol}-${trade.bought}-${index}`}>
              <th scope="row">{trade.symbol}</th><td>{trade.bought}</td><td>{money(trade.purchasePrice)}</td><td>{trade.sold ?? trade.lastDate}</td><td>{money(trade.lastPrice)}</td><td>{money(trade.gain)}</td><td>{percent(trade.returnPercent)}</td>
            </tr>)}</tbody>
          </table>
        </div>}
    </section>
  );
}

export default function Results({ result }: { result: BacktestResult }) {
  const { parameters: p, metrics: m } = result;
  const [symbol, setSymbol] = useState(p.symbols[0]);
  const series = result.series.find((item) => item.symbol === symbol) ?? result.series[0];
  const closed = result.trades.filter((trade) => trade.sold !== null);
  const open = result.trades.filter((trade) => trade.sold === null);
  const invested = closed.reduce((sum, trade) => sum + trade.purchasePrice, 0);
  const averageReturn = closed.length ? closed.reduce((sum, trade) => sum + trade.returnPercent, 0) / closed.length : null;
  const variance = closed.length > 1 ? closed.reduce((sum, trade) => sum + (trade.returnPercent - averageReturn!) ** 2, 0) / (closed.length - 1) : null;
  const keyMetrics = [
    ["Portfolio change", money(m.finalBalance - p.initialBalance)],
    ["Portfolio return", percent(m.returnPercent)],
    ["Average trade gain", averageReturn === null ? "—" : percent(averageReturn)],
    ["Number of trades", String(m.closedTrades)],
    ["Initial balance", money(p.initialBalance)],
    ["Final balance", money(m.finalBalance)],
  ];
  const closedMetrics = [
    ["Total gain", money(m.realizedGain)],
    ["Mean gain", closed.length ? money(m.realizedGain / closed.length) : "—"],
    ["Return on invested", invested ? percent(m.realizedGain / invested * 100) : "—"],
    ["Mean return", averageReturn === null ? "—" : percent(averageReturn)],
    ["Return variance (pp²)", variance === null ? "—" : variance.toFixed(2)],
    ["Return std. deviation (pp)", variance === null ? "—" : Math.sqrt(variance).toFixed(2)],
    ["Win rate", m.winRate === null ? "—" : percent(m.winRate)],
    ["Maximum drawdown", percent(m.maxDrawdown)],
  ];
  const openMetrics = [["Number of open shares", String(m.openShares)], ["Value of open shares", money(m.finalBalance - m.cash)], ["Unrealized gain", money(m.unrealizedGain)], ["Available cash", money(m.cash)]];
  function metrics(rows: string[][]) {
    return <dl className={styles.metricList}>{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
  }
  const symbolTrades = result.trades.filter((trade) => trade.symbol === symbol);
  return (
    <section aria-labelledby="results-heading">
      <header className={styles.pageHeader}>
        <h1 className="heading-accent" id="results-heading">Backtesting Results for {p.symbols.join(", ")}</h1>
        <TradingNavigation strategy={p.strategy} />
      </header>
      <p className={styles.muted}>{p.strategy.toUpperCase()} ({p.period} sessions) · {p.start} to {p.end} · Alpaca {result.feed.toUpperCase()} · Split-adjusted prices</p>
      <div className={styles.resultsTop}>
        <section className={`${styles.panel} ${p.strategy === "rsi" ? styles.pairedCharts : styles.singleChart}`}>
          <div className={styles.graphHeading}><h2>Graph</h2>
            <label className={styles.field}>Stock<select value={series.symbol} onChange={(event) => setSymbol(event.target.value)}>{p.symbols.map((item) => <option key={item}>{item}</option>)}</select></label>
          </div>
          <Chart title={`${series.symbol} price and trades`} lines={[
            { name: "Stock price", points: series.points.map((point) => ({ date: point.date, value: point.close })) },
            ...(p.strategy === "sma" ? [{ name: `${p.period}-session SMA`, points: series.points.map((point) => ({ date: point.date, value: point.indicator })) }] : []),
            { name: "Buy", marker: "buy", points: symbolTrades.map((trade) => ({ date: trade.bought, value: trade.purchasePrice })) },
            { name: "Sell", marker: "sell", points: [...new Map(symbolTrades.filter((trade) => trade.sold).map((trade) => [trade.sold!, { date: trade.sold!, value: trade.lastPrice }])).values()] },
          ]} />
          {p.strategy === "rsi" && <Chart title={`${series.symbol} RSI`} unit="number" lines={[{ name: `${p.period}-session RSI`, points: series.points.map((point) => ({ date: point.date, value: point.indicator })) }]} />}
          <p className={styles.muted}>Drag to zoom; double-click to reset. Triangles show opening fill prices.</p>
        </section>
        <aside className={`${styles.panel} ${styles.keyMetrics}`} aria-labelledby="metrics-heading"><h2 id="metrics-heading">Key Metrics</h2>{metrics(keyMetrics)}</aside>
      </div>
      <div className={styles.resultsBottom}>
        <aside>
          <section className={styles.panel}><h2>Closed Positions Metrics</h2>{metrics(closedMetrics)}</section>
          <section className={styles.panel}><h2>Open Positions Metrics</h2>{metrics(openMetrics)}</section>
        </aside>
        <div className={styles.tradeLogs}><h2>Trade Log</h2><TradeTable trades={closed} open={false} /><TradeTable trades={open} open /></div>
      </div>
      <details className={styles.method}><summary>Portfolio value over time</summary>
        <Chart title="Portfolio value" lines={[{ name: "Cash + held shares", points: result.equity.map((point) => ({ date: point.date, value: point.value })) }]} />
      </details>
      <p className={styles.muted}>One share per buy, with available cash. Signals fill at the next session’s open. Open positions use the last available close. No dividends, fees, slippage, taxes, or interest are included. Historical results do not predict future returns.</p>
    </section>
  );
}
