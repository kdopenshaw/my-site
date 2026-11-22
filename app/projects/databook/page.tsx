import type { Metadata } from "next";

import { BookEmbed } from "./book-embed";
import styles from "./databook.module.css";

const demo = "/demos/databook/index.html";

export const metadata: Metadata = {
  title: "Pokémon by the numbers | Keith Openshaw",
  description: "Explore the base stats of 721 Pokémon in an interactive DataBook.",
};

export default function DataBookPage() {
  return (
    <article className="page-shell">
      <h1>Pokémon by the numbers</h1>
      <p>
        Explore the base stats of 721 Pokémon from Generations I–VI. I built
        DataBook to put interactive charts, their queries, and the data behind
        them in one report.
      </p>
      <p className={styles.links}>
        <a href={demo}>Open editable DataBook</a>
        <a href="https://github.com/kdopenshaw/databook">View source on GitHub</a>
      </p>
      <section className={`wide ${styles.demo}`} aria-label="Pokémon analysis">
        <BookEmbed src={`${demo}?embed=1`} />
      </section>
    </article>
  );
}
