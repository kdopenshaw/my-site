import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";

import ImpaktMdx from "./mdx-components";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Impakt Beanies | Keith Openshaw",
  description:
    "A product design case study for discreet head protection made to fit naturally into skate culture.",
};

export default function ImpaktBeaniesPage() {
  const source = fs.readFileSync(
    path.join(process.cwd(), "app", "projects", "impakt-beanies", "content.mdx"),
    "utf-8",
  );

  return (
    <section className={`page-shell ${styles.page}`}>
      <ImpaktMdx source={source} />
    </section>
  );
}
