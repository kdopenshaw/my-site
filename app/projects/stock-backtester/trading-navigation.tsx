"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./backtester.module.css";

const root = "/projects/stock-backtester";

const labels: Record<string, string> = {
  rsi: "RSI",
  sma: "SMA",
  custom: "Custom",
  results: "Results",
};

export default function TradingNavigation({ strategy }: { strategy?: "rsi" | "sma" }) {
  const path = usePathname();
  if (path === root) return null;

  const segments = path.slice(root.length).split("/").filter(Boolean);
  if (path.endsWith("/results") && strategy && segments[0] !== strategy) {
    segments.unshift(strategy);
  }

  const crumbs = [{ href: root, label: "Home" }, ...segments.map((segment, index) => ({
    href: segment === "results" ? path : `${root}/${segments.slice(0, index + 1).join("/")}`,
    label: labels[segment] ?? segment,
  }))];

  return (
    <nav className={styles.breadcrumb} aria-label="Trading application">
      <ol>
        {crumbs.map((crumb, index) => {
          const current = index === crumbs.length - 1;
          return (
            <li key={crumb.href}>
              {index > 0 && (
                <svg className={styles.breadcrumbSeparator} viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M6 3.5 10.5 8 6 12.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {current ? <span aria-current="page">{crumb.label}</span> : <Link href={crumb.href}>{crumb.label}</Link>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
