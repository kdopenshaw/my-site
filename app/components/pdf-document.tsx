"use client";

import dynamic from "next/dynamic";
import type { PdfReaderProps } from "./pdf-reader";

const PdfReader = dynamic(() => import("./pdf-reader"), {
  ssr: false,
  loading: () => (
    <div className="pdf-document__loading" role="status">
      Loading document…
    </div>
  ),
});

export default function PdfDocument(props: PdfReaderProps) {
  return <PdfReader {...props} />;
}
