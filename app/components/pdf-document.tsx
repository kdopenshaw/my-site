"use client";

import styles from "./pdf-document.module.css";
import dynamic from "next/dynamic";
import type { PdfReaderProps } from "./pdf-reader";

const PdfReader = dynamic(() => import("./pdf-reader"), {
  ssr: false,
  loading: () => (
    <div className={styles.loading} role="status">
      Loading document…
    </div>
  ),
});

export default function PdfDocument(props: PdfReaderProps) {
  return <PdfReader {...props} />;
}
