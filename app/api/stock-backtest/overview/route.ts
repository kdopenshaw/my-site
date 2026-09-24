import { fetchHistory, MarketDataError } from "../market-data";

export const runtime = "nodejs";
export const maxDuration = 30;

const symbols = ["SPY", "QQQ", "DIA", "AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "V", "NVDA", "META", "UNH", "LLY", "JPM", "XOM", "JNJ", "PG"];

export async function GET() {
  const endDate = new Date(Date.now() - 86_400_000);
  const end = endDate.toISOString().slice(0, 10);
  const start = new Date(endDate.getTime() - 365 * 86_400_000).toISOString().slice(0, 10);
  const year = `${end.slice(0, 4)}-01-01`;
  try {
    const { history, feed } = await fetchHistory(symbols, start, end);
    return Response.json({
      feed, start, end,
      indices: symbols.slice(0, 3).map((symbol) => ({ symbol, points: history[symbol] })),
      stocks: symbols.map((symbol) => {
        const bars = history[symbol];
        const latest = bars.at(-1);
        const baseline = bars.filter((bar) => bar.date < year).at(-1);
        return { symbol, date: latest?.date ?? null, close: latest?.close ?? null, ytd: latest && baseline ? (latest.close / baseline.close - 1) * 100 : null };
      }),
    }, { headers: { "Cache-Control": "public, max-age=300, s-maxage=3600" } });
  } catch (error) {
    return Response.json({ error: error instanceof MarketDataError ? error.message : "The market overview could not be loaded." }, { status: error instanceof MarketDataError ? error.status : 502, headers: { "Cache-Control": "no-store" } });
  }
}
