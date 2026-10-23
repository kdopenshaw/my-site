// Writing index. URL: /writing
// Posts are the .mdx files in ./posts. This page only lists them.

import styles from "./writing.module.css";
import Link from "next/link";
import type { Metadata } from "next";

import { formatDate, getPosts } from "./posts";

export const metadata: Metadata = {
  title: "Writing | Keith Openshaw",
  description: "Writing by Keith Openshaw.",
};

export default function WritingPage() {
  const posts = getPosts();

  return (
    <section className="page-shell" aria-labelledby="writing-heading">
      <h1 className="mono-label" id="writing-heading">Writing</h1>

      <ul className={styles.list} aria-label="Writing" role="list">
        {posts.map((post) => (
          <li className={styles.entry} key={post.slug}>
            <Link className={styles.entryLink} href={`/writing/${post.slug}`}>
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
