export type Strategy = "rsi" | "sma";
export type Bar = { date: string; open: number; close: number };
export type Parameters = {
  strategy: Strategy;
  symbols: string[];
  start: string;
  end: string;
  period: number;
  initialBalance: number;
  buy: number;
  sell: number;
};
export type Trade = {
  symbol: string;
  bought: string;
  purchasePrice: number;
  sold: string | null;
  lastDate: string;
  lastPrice: number;
  gain: number;
  returnPercent: number;
};
export type Series = { symbol: string; points: { date: string; close: number; indicator: number | null; buy: boolean; sell: boolean }[] };
export type BacktestResult = {
  parameters: Parameters;
  feed: string;
  equity: { date: string; value: number }[];
  series: Series[];
  trades: Trade[];
  metrics: { finalBalance: number; cash: number; returnPercent: number; realizedGain: number; unrealizedGain: number; closedTrades: number; openShares: number; winRate: number | null; maxDrawdown: number };
};

const DAY = 86_400_000;

function dateValue(value: unknown, label: string): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`${label} must be a valid date.`);
  const stamp = Date.parse(`${value}T00:00:00Z`);
  if (!Number.isFinite(stamp) || new Date(stamp).toISOString().slice(0, 10) !== value) throw new Error(`${label} must be a valid date.`);
  return value;
}

export function parseParameters(input: unknown, now = new Date()): Parameters {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Enter the backtest parameters.");
  const data = input as Record<string, unknown>;
  if (data.strategy !== "rsi" && data.strategy !== "sma") throw new Error("Choose RSI or SMA.");
  if (typeof data.symbols !== "string" || data.symbols.length > 100) throw new Error("Enter up to five stock symbols.");
  const symbols = [...new Set(data.symbols.toUpperCase().trim().split(/[\s,]+/))].sort();
  if (symbols.length > 5 || symbols.some((symbol) => !/^[A-Z][A-Z0-9.-]{0,9}$/.test(symbol))) throw new Error("Enter up to five valid stock symbols, separated by spaces or commas.");
  const start = dateValue(data.start, "Start date");
  const end = dateValue(data.end, "End date");
  const yesterday = new Date(now.getTime() - DAY).toISOString().slice(0, 10);
  if (start < "2016-01-01" || start >= end || end > yesterday) throw new Error("Choose dates from 2016 onward, with the end after the start and no later than yesterday.");
  if (Date.parse(end) - Date.parse(start) > 5 * 366 * DAY) throw new Error("Choose a date range of five years or less.");
  function number(key: string, min: number, max: number) {
    const value = data[key];
    if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) throw new Error(`${key} must be between ${min} and ${max}.`);
    return value;
  }
  const period = number("period", 2, 200);
  if (!Number.isInteger(period)) throw new Error("The indicator period must be a whole number.");
  const initialBalance = number("initialBalance", 1, 10_000_000);
  const buy = number("buy", 0, 100);
  const sell = number("sell", 0, 100);
  if (buy >= sell) throw new Error("The sell threshold must be higher than the buy threshold.");
  return { strategy: data.strategy, symbols, start, end, period, initialBalance, buy, sell };
}

// Matches the original rolling-mean RSI, rather than Wilder's smoothed RSI.
export function indicators(bars: Bar[], period: number, strategy: Strategy): (number | null)[] {
  return bars.map((_, index) => {
    if (index < period - 1) return null;
    const window = bars.slice(index - period + 1, index + 1);
    if (strategy === "sma") return window.reduce((sum, bar) => sum + bar.close, 0) / period;
    let gain = 0;
    let loss = 0;
    for (let i = index - period + 1; i <= index; i++) {
      const change = i === 0 ? 0 : bars[i].close - bars[i - 1].close;
      gain += Math.max(change, 0);
      loss += Math.max(-change, 0);
    }
    if (gain === 0 && loss === 0) return 50;
    return loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
  });
}

export function runBacktest(parameters: Parameters, history: Record<string, Bar[]>, feed = "iex"): BacktestResult {
  const { symbols, start, end, period, strategy, initialBalance, buy, sell } = parameters;
  const series: Series[] = [];
  const events = new Map<string, { symbol: string; bar: Bar; point: Series["points"][number]; signal: "buy" | "sell" | null }[]>();
  for (const symbol of [...symbols].sort()) {
    const bars = history[symbol] ?? [];
    const values = indicators(bars, period, strategy);
    const points: Series["points"] = [];
    for (let i = 0; i < bars.length; i++) {
      const bar = bars[i];
      if (bar.date < start || bar.date > end) continue;
      const point = { date: bar.date, close: bar.close, indicator: values[i], buy: false, sell: false };
      points.push(point);
      // Observe a completed close; execute at the next available session's open.
      const previous = i > 0 ? values[i - 1] : null;
      let signal: "buy" | "sell" | null = null;
      if (previous !== null) {
        const value = strategy === "rsi" ? previous : (bars[i - 1].close / previous - 1) * 100;
        if (strategy === "rsi" ? value < buy : value >= 0 && value <= buy) signal = "buy";
        else if (value > sell) signal = "sell";
      }
      const dayEvents = events.get(bar.date) ?? [];
      dayEvents.push({ symbol, bar, point, signal });
      events.set(bar.date, dayEvents);
    }
    if (points.length < 2 || !points.some((point) => point.indicator !== null)) throw new Error(`Not enough historical prices for ${symbol}. Try a longer range or a shorter period.`);
    series.push({ symbol, points });
  }

  const holdings = new Map<string, { date: string; price: number }[]>();
  const latest = new Map<string, Bar>();
  const trades: Trade[] = [];
  const equity: BacktestResult["equity"] = [{ date: new Date(Date.parse(start) - DAY).toISOString().slice(0, 10), value: initialBalance }];
  let cash = initialBalance;
  let peak = initialBalance;
  let maxDrawdown = 0;
  for (const [date, dayEvents] of [...events].sort(([a], [b]) => a.localeCompare(b))) {
    // Release cash from sales before purchases; ties use alphabetical symbol order.
    for (const event of dayEvents) {
      const { symbol, bar, signal, point } = event;
      const lots = holdings.get(symbol) ?? [];
      if (signal === "sell" && lots.length) {
        for (const lot of lots) {
          cash += bar.open;
          trades.push({ symbol, bought: lot.date, purchasePrice: lot.price, sold: date, lastDate: date, lastPrice: bar.open, gain: bar.open - lot.price, returnPercent: (bar.open / lot.price - 1) * 100 });
        }
        holdings.set(symbol, []);
        point.sell = true;
      }
    }
    for (const { symbol, bar, signal, point } of dayEvents) {
      if (signal === "buy" && cash >= bar.open) {
        cash -= bar.open;
        holdings.set(symbol, [...(holdings.get(symbol) ?? []), { date, price: bar.open }]);
        point.buy = true;
      }
      latest.set(symbol, bar);
    }
    let value = cash;
    for (const [symbol, lots] of holdings) value += lots.length * latest.get(symbol)!.close;
    peak = Math.max(peak, value);
    maxDrawdown = Math.max(maxDrawdown, (peak - value) / peak * 100);
    equity.push({ date, value });
  }
  for (const [symbol, lots] of holdings) {
    const bar = latest.get(symbol)!;
    for (const lot of lots) trades.push({ symbol, bought: lot.date, purchasePrice: lot.price, sold: null, lastDate: bar.date, lastPrice: bar.close, gain: bar.close - lot.price, returnPercent: (bar.close / lot.price - 1) * 100 });
  }
  const closed = trades.filter((trade) => trade.sold !== null);
  const open = trades.filter((trade) => trade.sold === null);
  const finalBalance = equity[equity.length - 1].value;
  return {
    parameters, feed, equity, series, trades,
    metrics: {
      finalBalance, cash, returnPercent: (finalBalance / initialBalance - 1) * 100,
      realizedGain: closed.reduce((sum, trade) => sum + trade.gain, 0),
      unrealizedGain: open.reduce((sum, trade) => sum + trade.gain, 0),
      closedTrades: closed.length, openShares: open.length,
      winRate: closed.length ? closed.filter((trade) => trade.gain > 0).length / closed.length * 100 : null,
      maxDrawdown,
    },
  };
}
