import styles from "./content.module.css";
import Link from "next/link";
import type { Metadata } from "next";

import { formatDate, getContentPosts } from "./utils";

export const metadata: Metadata = {
  title: "Content | Keith Openshaw",
  description: "Writing, projects, and other work by Keith Openshaw.",
};

export default function ContentPage() {
  const posts = getContentPosts().sort(
    (a, b) =>
      new Date(b.metadata.publishedAt).getTime() -
      new Date(a.metadata.publishedAt).getTime(),
  );

  return (
    <section className="page-shell" aria-labelledby="content-heading">
      <h1 className="heading-accent" id="content-heading">Content</h1>

      <ul className={styles.list} aria-label="Content" role="list">
        {posts.map((post) => (
          <li className={styles.entry} key={post.slug}>
            <p className={styles.entryDate}>
              {formatDate(post.metadata.publishedAt, false)}
            </p>
            <Link className={styles.entryLink} href={`/content/${post.slug}`}>
              {post.metadata.title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
