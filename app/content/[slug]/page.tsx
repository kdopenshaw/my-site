import styles from "../content.module.css";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import CustomMdx from "../../components/mdx";
import { formatDate, getContentPosts } from "../utils";

export function generateStaticParams() {
  return getContentPosts().map((post) => ({ slug: post.slug }));
}

interface ContentPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ContentPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getContentPosts().find((item) => item.slug === slug);

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

export default async function ContentPost({ params }: ContentPostPageProps) {
  const { slug } = await params;
  const post = getContentPosts().find((item) => item.slug === slug);

  if (!post) notFound();

  return (
    <section className={`page-shell ${styles.post}`}>
      <h1 className="section-title">{post.metadata.title}</h1>
      <p className={styles.postDate}>
        {formatDate(post.metadata.publishedAt)}
      </p>
      <CustomMdx source={post.content} />
    </section>
  );
}
