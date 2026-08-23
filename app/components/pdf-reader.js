"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

export default function PdfReader({ href, title }) {
  const containerRef = useRef(null);
  const [pageCount, setPageCount] = useState(0);
  const [pageWidth, setPageWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return undefined;

    const observer = new ResizeObserver(([entry]) => {
      setPageWidth(Math.floor(entry.contentRect.width));
    });

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <div className="pdf-document">
      <a
        className="pdf-document__open"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
      >
        Open full PDF
      </a>
      <div
        ref={containerRef}
        className="pdf-document__pages"
        role="region"
        aria-label={`${title} document preview`}
        tabIndex="0"
      >
        <Document
          file={href}
          onLoadSuccess={({ numPages }) => setPageCount(numPages)}
          loading={
            <p className="pdf-document__status" role="status">
              Loading document…
            </p>
          }
          error={
            <p className="pdf-document__status">
              The document preview could not be loaded.
            </p>
          }
        >
          {pageWidth > 0 &&
            Array.from({ length: pageCount }, (_, index) => (
              <Page
                key={index + 1}
                pageNumber={index + 1}
                width={pageWidth}
                loading={null}
              />
            ))}
        </Document>
      </div>
    </div>
  );
}
