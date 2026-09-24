"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./backtester.module.css";
const root = "/projects/stock-backtester";
export default function TradingNavigation() {
  const path = usePathname();
  return <nav className={styles.localNav} aria-label="Trading application">
    {[[root, "Home"], [`${root}/rsi`, "RSI"], [`${root}/sma`, "SMA"]].map(([href, label]) => <Link key={href} href={href} aria-current={(href === root ? path === href : path.startsWith(href)) ? "page" : undefined}>{label}</Link>)}
  </nav>;
}
