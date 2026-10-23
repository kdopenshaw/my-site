// One article. URL: /writing/[the filename of the .mdx file]
// generateStaticParams tells Next.js which filenames exist at build time.

import styles from "../writing.module.css";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import CustomMdx from "../mdx";
import { formatDate, getPosts } from "../posts";

export function generateStaticParams() {
  return getPosts().map((post) => ({ slug: post.slug }));
}

interface WritingPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: WritingPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPosts().find((item) => item.slug === slug);

  if (!post) return {};

  return {
    title: `${post.metadata.title} | Keith Openshaw`,
    description: post.metadata.summary,
    openGraph: {
      title: post.metadata.title,
      description: post.metadata.summary,
      type: "article",
      publishedTime: post.metadata.publishedAt,
    },
  };
}

export default async function WritingPost({ params }: WritingPostPageProps) {
  const { slug } = await params;
  const post = getPosts().find((item) => item.slug === slug);

  if (!post) notFound();

  return (
    <section className={`page-shell ${styles.post}`}>
      <h1>{post.metadata.title}</h1>
      <p className={styles.postDate}>
        {formatDate(post.metadata.publishedAt)}
      </p>
      <CustomMdx source={post.content} />
      <p className={styles.backLink}><Link href="/writing">← All writing</Link></p>
    </section>
  );
}
