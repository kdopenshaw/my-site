import type { Metadata } from "next";

import styles from "./databook.module.css";

const demo = "/demos/databook/index.html";

export const metadata: Metadata = {
  title: "DataBook | Keith Openshaw",
  description: "An interactive example of a data report built with DataBook.",
};

export default function DataBookPage() {
  return (
    <article className="page-shell">
      <h1>DataBook</h1>
      <p>
        I built DataBook to make it easier to share an analysis with the data
        and queries that produced it. A book combines Markdown, interactive
        React charts, and one shared table. Each chart declares which rows it
        needs, and the book can be published as a static site.
      </p>
      <p>
        The sample follows nine synthetic points through a doubling experiment.
        Compare the full curve with its first five steps, then open
        <strong> How it works</strong> to trace the charts back to their queries
        and try editing the book.
      </p>
      <p>
        <a href={demo}>Open full-screen demo</a>
        {" · "}
        <a href="https://github.com/kdopenshaw/databook">View source on GitHub</a>
      </p>
      <section className={`wide ${styles.demo}`} aria-label="Live DataBook demo">
        <iframe src={demo} title="DataBook demo: What does doubling look like?" />
      </section>
    </article>
  );
}
