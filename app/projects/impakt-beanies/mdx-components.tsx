import Image from "next/image";
import { MDXRemote } from "next-mdx-remote/rsc";
import type { ReactNode } from "react";

import styles from "./page.module.css";

interface ChildrenProps {
  children?: ReactNode;
}

interface ProjectImageProps {
  src: string;
  alt: string;
  width: number | string;
  height: number | string;
  variant?: "hero" | "mockup" | "process";
}

function ProjectImage({
  src,
  alt,
  width,
  height,
  variant = "process",
}: ProjectImageProps) {
  const variantClass =
    variant === "hero"
      ? styles.heroMedia
      : variant === "mockup"
        ? styles.mockup
        : "";

  return (
    <figure className={`${styles.mediaFigure} ${variantClass}`}>
      <Image
        className={styles.mediaImage}
        src={src}
        alt={alt}
        width={Number(width)}
        height={Number(height)}
        priority={variant === "hero"}
        sizes={variant === "process"
          ? "(max-width: 48rem) calc(100vw - 2rem), 21rem"
          : "(max-width: 38rem) calc(100vw - 2rem), 36rem"}
      />
    </figure>
  );
}

function ProjectHero({ children }: ChildrenProps) {
  return (
    <header className={styles.hero}>
      <div>
        <h1 className="heading-accent">Impakt Beanies</h1>
        {children}
      </div>
      <ProjectImage
        src="/projects/impakt-beanies/hero.jpg"
        alt="A skateboarder wearing a beanie at the Venice Beach skatepark"
        width={2560}
        height={1440}
        variant="hero"
      />
    </header>
  );
}

function ProductMockup() {
  return (
    <ProjectImage
        src="/projects/impakt-beanies/product-mockup.png"
      alt="Impakt Beanies online shop displayed on a laptop mockup"
      width={1205}
      height={802}
      variant="mockup"
    />
  );
}

function FeatureHighlights({ children }: ChildrenProps) {
  return <div className={styles.featureHighlights}>{children}</div>;
}

function SectionHeading({ children }: ChildrenProps) {
  return (
    <div className={styles.sectionHeading}>
      <h2>{children}</h2>
    </div>
  );
}

interface FeatureProps extends ChildrenProps {
  title: string;
}

function Feature({ title, children }: FeatureProps) {
  return (
    <section className={styles.feature}>
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function StatGrid({ children }: ChildrenProps) {
  return <div className={styles.statGrid}>{children}</div>;
}

interface StatProps {
  value: string;
  label: string;
  detail: string;
}

function Stat({ value, label, detail }: StatProps) {
  return (
    <div className={styles.stat}>
      <strong>{value}</strong>
      <span>{label}</span>
      <small>{detail}</small>
    </div>
  );
}

interface ProcessStepProps extends ChildrenProps {
  number: string;
  title: string;
  mediaSrc: string;
  mediaAlt: string;
  mediaWidth: number | string;
  mediaHeight: number | string;
}

function ProcessStep({
  number,
  title,
  mediaSrc,
  mediaAlt,
  mediaWidth,
  mediaHeight,
  children,
}: ProcessStepProps) {
  return (
    <section className={styles.processStep}>
      <div className={styles.processCopy}>
        <span className={styles.stepNumber}>{number}</span>
        <h3>{title}</h3>
        {children}
      </div>
      <ProjectImage
        src={mediaSrc}
        alt={mediaAlt}
        width={mediaWidth}
        height={mediaHeight}
      />
    </section>
  );
}

function FundingList({ children }: ChildrenProps) {
  return <dl className={styles.fundingList}>{children}</dl>;
}

interface FundingItemProps {
  event: string;
  award: string;
}

function FundingItem({ event, award }: FundingItemProps) {
  return (
    <div className={styles.fundingItem}>
      <dt>{event}</dt>
      <dd>{award}</dd>
    </div>
  );
}

function ProjectGallery({ children }: ChildrenProps) {
  return (
    <section className={styles.gallery} aria-label="Competition photographs">
      {children}
    </section>
  );
}

interface GalleryImageProps {
  src: string;
  alt: string;
  width: number | string;
  height: number | string;
}

function GalleryImage({ src, alt, width, height }: GalleryImageProps) {
  return (
    <figure className={styles.galleryItem}>
      <Image
        className={styles.galleryImage}
        src={src}
        alt={alt}
        width={Number(width)}
        height={Number(height)}
        sizes="(max-width: 36rem) calc(100vw - 2rem), 11.5rem"
      />
    </figure>
  );
}

const components = {
  h2: SectionHeading,
  ProjectHero,
  ProductMockup,
  FeatureHighlights,
  Feature,
  StatGrid,
  Stat,
  ProcessStep,
  FundingList,
  FundingItem,
  ProjectGallery,
  GalleryImage,
};

export default function ImpaktMdx({ source }: { source: string }) {
  return (
    <article className={styles.article}>
      <MDXRemote source={source} components={components} />
    </article>
  );
}
