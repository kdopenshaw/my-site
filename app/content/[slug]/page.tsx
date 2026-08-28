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
    <section className="content-post">
      <h1>{post.metadata.title}</h1>
      <p className="content-post__date">
        {formatDate(post.metadata.publishedAt)}
      </p>
      <article className="prose">
        <CustomMdx source={post.content} />
      </article>
    </section>
  );
}
