import { parseParameters, runBacktest } from "../../projects/stock-backtester/engine";
import { fetchHistory, MarketDataError } from "./market-data";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  let parameters;
  try {
    const body = await request.text();
    if (body.length > 4096) return Response.json({ error: "The request is too large." }, { status: 413, headers });
    parameters = parseParameters(JSON.parse(body));
  } catch (error) {
    return Response.json({ error: error instanceof SyntaxError ? "Send valid backtest parameters." : error instanceof Error ? error.message : "Invalid parameters." }, { status: 400, headers });
  }
  try {
    // Warm the indicator with earlier sessions so the requested start isn't a blind period.
    const warmup = new Date(Date.parse(parameters.start) - (parameters.period * 2 + 14) * 86_400_000).toISOString().slice(0, 10);
    const { history, feed } = await fetchHistory(parameters.symbols, warmup, parameters.end);
    return Response.json(runBacktest(parameters, history, feed), { headers });
  } catch (error) {
    if (error instanceof MarketDataError) return Response.json({ error: error.message }, { status: error.status, headers });
    if (error instanceof Error && error.message.startsWith("Not enough historical prices")) return Response.json({ error: error.message }, { status: 422, headers });
    return Response.json({ error: "The backtest could not be completed. Please try again." }, { status: 500, headers });
  }
}
