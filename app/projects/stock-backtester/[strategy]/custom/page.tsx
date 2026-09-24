import { notFound } from "next/navigation";
import Backtester from "../../backtester";
export async function generateMetadata({ params }: { params: Promise<{ strategy: string }> }) {
  const { strategy } = await params;
  return { title: `Custom ${strategy.toUpperCase()} Strategy | Keith Openshaw` };
}
export default async function CustomPage({ params, searchParams }: { params: Promise<{ strategy: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { strategy } = await params;
  if (strategy !== "rsi" && strategy !== "sma") notFound();
  return <Backtester strategy={strategy} custom initial={await searchParams} />;
}
