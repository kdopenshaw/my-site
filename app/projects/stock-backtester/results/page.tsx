import ResultsLoader from "./results-loader";
export const metadata = { title: "Backtesting Results | Keith Openshaw" };
export default async function ResultsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const value = (name: string) => typeof query[name] === "string" ? query[name] : "";
  const payload = { strategy: value("strategy"), symbols: value("symbols"), start: value("start"), end: value("end"), period: Number(value("period")), initialBalance: Number(value("initialBalance")), buy: Number(value("buy")), sell: Number(value("sell")) };
  const search = new URLSearchParams(Object.fromEntries(Object.entries(payload).map(([key, val]) => [key, String(val)])));
  const strategy = payload.strategy === "sma" ? "sma" : "rsi";
  const backHref = `/projects/stock-backtester/${strategy}${value("mode") === "basic" ? "" : "/custom"}?${search}`;
  return <ResultsLoader payload={JSON.stringify(payload)} backHref={backHref} />;
}
