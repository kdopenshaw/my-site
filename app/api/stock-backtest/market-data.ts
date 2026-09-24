import type { Bar } from "../../projects/stock-backtester/engine";

export class MarketDataError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.status = status;
  }
}

type AlpacaBar = { t: string; o: number; c: number };

export async function fetchHistory(symbols: string[], start: string, end: string): Promise<{ history: Record<string, Bar[]>; feed: string }> {
  const key = process.env.ALPACA_API_KEY;
  const secret = process.env.ALPACA_SECRET_KEY;
  const feed = process.env.ALPACA_DATA_FEED || "iex";
  if (!key || !secret) throw new MarketDataError("Historical market data is not connected yet. Please try again once the site owner has enabled it.", 503);
  if (feed !== "iex" && feed !== "sip") throw new MarketDataError("The market data connection needs attention.", 503);
  const history: Record<string, Bar[]> = Object.fromEntries(symbols.map((symbol) => [symbol, []]));
  let pageToken: string | undefined;
  const signal = AbortSignal.timeout(20_000);
  for (let page = 0; page < 10; page++) {
    const url = new URL("https://data.alpaca.markets/v2/stocks/bars");
    url.search = new URLSearchParams({ symbols: symbols.join(","), timeframe: "1Day", start, end: `${end}T23:59:59Z`, adjustment: "split", feed, limit: "10000", sort: "asc", ...(pageToken ? { page_token: pageToken } : {}) }).toString();
    let response: Response;
    try {
      response = await fetch(url, {
        headers: { "APCA-API-KEY-ID": key, "APCA-API-SECRET-KEY": secret },
        signal,
        next: { revalidate: 3600 },
      });
    } catch {
      throw new MarketDataError("The market data provider did not respond in time. Please try again.", 504);
    }
    if (!response.ok) {
      if (response.status === 429) throw new MarketDataError("The market data provider is busy. Please wait a minute and try again.", 429);
      if (response.status === 401 || response.status === 403) throw new MarketDataError("The market data connection needs attention. Please contact the site owner.", 503);
      throw new MarketDataError("Historical prices could not be loaded. Check the symbols and date range, then try again.");
    }
    const data = await response.json() as { bars?: Record<string, AlpacaBar[]>; next_page_token?: string | null };
    for (const symbol of symbols) {
      for (const bar of data.bars?.[symbol] ?? []) {
        if (typeof bar.t !== "string" || !Number.isFinite(bar.o) || !Number.isFinite(bar.c) || bar.o <= 0 || bar.c <= 0) throw new MarketDataError("The provider returned an invalid historical price. Please try another date range.");
        history[symbol].push({ date: bar.t.slice(0, 10), open: bar.o, close: bar.c });
      }
    }
    pageToken = data.next_page_token ?? undefined;
    if (!pageToken) {
      for (const symbol of symbols) {
        history[symbol] = [...new Map(history[symbol].map((bar) => [bar.date, bar])).values()].sort((a, b) => a.date.localeCompare(b.date));
      }
      return { history, feed };
    }
  }
  throw new MarketDataError("This request returned too many prices. Try a shorter date range.", 400);
}
