import test from "node:test";
import assert from "node:assert/strict";
import { indicators, parseParameters, runBacktest } from "../app/projects/stock-backtester/engine.ts";
import { fetchHistory } from "../app/api/stock-backtest/market-data.ts";

const input = { strategy: "rsi", symbols: "AAA", start: "2024-01-04", end: "2024-01-08", period: 2, initialBalance: 100, buy: 30, sell: 65 };
const prices = [10, 8, 6, 12, 14, 16, 14].map((close, index) => ({ date: `2024-01-${String(index + 2).padStart(2, "0")}`, close, open: [10, 8, 7, 11, 15, 16, 14][index] }));
const parameters = (overrides = {}) => parseParameters({ ...input, ...overrides });

test("normalizes symbols and rejects invalid or unbounded requests", () => {
  assert.deepEqual(parameters({ symbols: "msft, aapl MSFT" }).symbols, ["AAPL", "MSFT"]);
  for (const changes of [{ symbols: "" }, { symbols: "A B C D E F" }, { symbols: "../secret" }, { start: "2024-02-30" }, { end: "2099-01-01" }, { start: "2016-01-01" }, { period: 2.5 }, { initialBalance: -1 }, { buy: 70 }, { sell: NaN }, { period: "14" }]) {
    assert.throws(() => parameters(changes), Error);
  }
});

test("rolling RSI and SMA have known values, including flat/up/down edge cases", () => {
  assert.deepEqual(indicators(prices.slice(0, 4), 2, "rsi"), [null, 0, 0, 75]);
  assert.deepEqual(indicators(prices.slice(0, 4), 2, "sma"), [null, 9, 7, 9]);
  assert.deepEqual(indicators(prices.map((p) => ({ ...p, close: 10 })), 2, "rsi"), [null, 50, 50, 50, 50, 50, 50]);
  assert.equal(indicators(prices.map((p, i) => ({ ...p, close: i + 1 })), 2, "rsi").at(-1), 100);
});

test("signals fill at the next open and all closed lots reconcile to equity", () => {
  const result = runBacktest(parameters(), { AAA: prices });
  assert.equal(result.trades.length, 2);
  assert.deepEqual(result.trades.map((t) => [t.bought, t.purchasePrice, t.sold, t.lastPrice]), [
    ["2024-01-04", 7, "2024-01-06", 15], ["2024-01-05", 11, "2024-01-06", 15],
  ]);
  assert.equal(result.metrics.finalBalance, 112);
  assert.equal(result.metrics.realizedGain, 12);
  assert.equal(result.metrics.cash, 112);
  assert.equal(result.metrics.winRate, 100);
});

test("cash-constrained purchases never create leverage or phantom buy markers", () => {
  const result = runBacktest(parameters({ initialBalance: 6 }), { AAA: prices });
  assert.equal(result.metrics.cash, 6);
  assert.equal(result.trades.length, 0);
  assert.ok(result.series[0].points.every((p) => !p.buy && !p.sell));
  assert.equal(result.metrics.winRate, null);
});

test("multiple symbols share chronological cash and preserve every closed trade", () => {
  const result = runBacktest(parameters({ symbols: "BBB AAA" }), { AAA: prices, BBB: prices });
  assert.equal(result.trades.length, 4);
  assert.equal(result.metrics.finalBalance, 124);
  const limited = runBacktest(parameters({ symbols: "BBB AAA", initialBalance: 7 }), { AAA: prices, BBB: prices });
  assert.deepEqual(limited.trades.map((t) => t.symbol), ["AAA"]);
  assert.equal(limited.metrics.cash, 15);
});

test("open holdings use each symbol's last available close", () => {
  const result = runBacktest(parameters({ start: "2024-01-03", end: "2024-01-05", symbols: "AAA BBB" }), { AAA: prices, BBB: prices.slice(0, 3) });
  assert.equal(result.metrics.openShares, 3);
  assert.equal(result.metrics.finalBalance, 105);
  assert.equal(result.metrics.unrealizedGain, 5);
  assert.equal(result.trades.find((t) => t.symbol === "BBB").lastDate, "2024-01-04");
});

test("SMA uses the original nonnegative premium band and sells all lots", () => {
  const bars = [100, 100, 101, 120, 125].map((close, i) => ({ date: `2024-01-0${i + 2}`, open: close, close }));
  const result = runBacktest(parameters({ strategy: "sma", buy: 2, sell: 5, initialBalance: 1000 }), { AAA: bars });
  assert.equal(result.metrics.closedTrades, 2);
  assert.equal(result.metrics.finalBalance, 1029);
});

test("no-trade runs are finite and incomplete histories fail clearly", () => {
  const result = runBacktest(parameters(), { AAA: prices.map((p) => ({ ...p, close: 10, open: 10 })) });
  assert.equal(result.metrics.finalBalance, 100);
  assert.equal(result.metrics.maxDrawdown, 0);
  assert.equal(result.metrics.returnPercent, 0);
  assert.throws(() => runBacktest(parameters(), { AAA: [] }), /Not enough historical prices/);
});

function mockCredentials(t) {
  t.mock.property(process, "env", { ...process.env, ALPACA_API_KEY: "test-key", ALPACA_SECRET_KEY: "test-secret", ALPACA_DATA_FEED: "iex" });
}

test("Alpaca pagination includes later symbols and keeps keys in headers", async (t) => {
  mockCredentials(t);
  const requests = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    requests.push([url, options]);
    return Response.json(requests.length === 1
      ? { bars: { AAA: [{ t: "2024-01-04T05:00:00Z", o: 7, c: 6 }] }, next_page_token: "page-2" }
      : { bars: { BBB: [{ t: "2024-01-04T05:00:00Z", o: 11, c: 12 }] }, next_page_token: null });
  });
  const result = await fetchHistory(["AAA", "BBB"], "2024-01-01", "2024-01-08");
  assert.equal(result.history.BBB.length, 1);
  assert.equal(requests[1][0].searchParams.get("page_token"), "page-2");
  assert.equal(requests[0][0].searchParams.get("adjustment"), "split");
  assert.equal(requests[0][1].headers["APCA-API-KEY-ID"], "test-key");
  assert.ok(!requests[0][0].href.includes("test-key"));
});

test("missing credentials and provider failures return safe errors", async (t) => {
  mockCredentials(t);
  process.env.ALPACA_API_KEY = "";
  await assert.rejects(fetchHistory(["AAA"], "2024-01-01", "2024-01-08"), (error) => error.status === 503);
  process.env.ALPACA_API_KEY = "test-key";
  t.mock.method(globalThis, "fetch", async () => new Response("private upstream details", { status: 403 }));
  await assert.rejects(fetchHistory(["AAA"], "2024-01-01", "2024-01-08"), (error) => error.status === 503 && !error.message.includes("private"));
});
