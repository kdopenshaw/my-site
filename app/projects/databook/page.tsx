"use client";

import dynamic from "next/dynamic";
import "./components/theme/theme.css";

const DataBook = dynamic(() => import("./App"), { ssr: false });

export default function DataBookPage() {
  return <div className="databook-project"><DataBook /></div>;
}
