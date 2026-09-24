import styles from "./backtester.module.css";

export default function TradingLayout({ children }: { children: React.ReactNode }) {
  return <div className={`page-shell ${styles.page}`}>{children}</div>;
}
