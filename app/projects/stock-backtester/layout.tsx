import Link from "next/link";
import TradingNavigation from "./trading-navigation";
import styles from "./backtester.module.css";

export default function TradingLayout({ children }: { children: React.ReactNode }) {
  return <div className={`page-shell ${styles.page}`}>
    <TradingNavigation />
    {children}
  </div>;
}
