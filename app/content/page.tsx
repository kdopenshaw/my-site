// Content index. URL: /content
// Posts are the .mdx files in ./posts. This page only lists them.

import styles from "./content.module.css";
import Link from "next/link";
import type { Metadata } from "next";

import { formatDate, getContentPosts } from "./posts";

export const metadata: Metadata = {
  title: "Content | Keith Openshaw",
  description: "Writing, projects, and other work by Keith Openshaw.",
};

export default function ContentPage() {
  const posts = getContentPosts();

  return (
    <section className="page-shell" aria-labelledby="content-heading">
      <h1 className="mono-label" id="content-heading">Content</h1>

      <ul className={styles.list} aria-label="Content" role="list">
        {posts.map((post) => (
          <li className={styles.entry} key={post.slug}>
            <Link className={styles.entryLink} href={`/content/${post.slug}`}>
              {post.metadata.title}
            </Link>
            <p className={styles.entryDate}>
              {formatDate(post.metadata.publishedAt, false)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
