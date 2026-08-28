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
    <section className="content-index" aria-labelledby="content-heading">
      <h1 id="content-heading">Content</h1>

      <div className="content-list" aria-label="Content">
        {posts.map((post) => (
          <article className="content-entry" key={post.slug}>
            <p className="content-entry__date">
              {formatDate(post.metadata.publishedAt, false)}
            </p>
            <h2>
              <Link href={`/content/${post.slug}`}>{post.metadata.title}</Link>
            </h2>
          </article>
        ))}
      </div>
    </section>
  );
}
