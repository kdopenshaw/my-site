// Home page. URL: /
// This file renders on the server. The moving image is a separate file
// because it needs the browser (see home-fractal.tsx).

import Image from "next/image";
import Link from "next/link";

import { getContentPosts } from "./content/posts";
import HomeFractal from "./home-fractal";
import styles from "./home.module.css";
import { projects } from "./projects/projects";

export default function Home() {
  const posts = getContentPosts().slice(0, 3);
  const featuredProjects = projects.slice(0, 3);

  return (
    <div className={styles.homeExperience}>
      <section className={styles.fractalOpening} aria-label="Opening image">
        <div className={styles.fractalMedia} aria-hidden="true">
          <HomeFractal />
        </div>
      </section>

      <section className={styles.introduction} id="introduction" aria-labelledby="home-title">
        <div className={styles.introductionContent}>
          <h1 className={`${styles.homeTitle} mono-label`} id="home-title">
            Keith Openshaw
          </h1>
          <p className={styles.homeLead}>
            A home for things I&apos;m building and thinking about.
          </p>
          <div className={styles.homeDirectory}>
            <section aria-labelledby="home-content">
              <h2 className={`${styles.sectionHeading} mono-label`} id="home-content">
                <Link href="/content">Content</Link>
              </h2>
              <ul className={styles.pieceList}>
                {posts.map((post) => (
                  <li key={post.slug}>
                    <Link href={`/content/${post.slug}`}>{post.metadata.title}</Link>
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="home-projects">
              <h2 className={`${styles.sectionHeading} mono-label`} id="home-projects">
                <Link href="/projects">Projects</Link>
              </h2>
              <ul className={styles.pieceList}>
                {featuredProjects.map((project) => (
                  <li key={project.href}>
                    <Link href={project.href}>{project.title}</Link>
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="home-blacksmithing">
              <h2 className={`${styles.sectionHeading} mono-label`} id="home-blacksmithing">
                <Link href="/blacksmithing">Blacksmithing</Link>
              </h2>
              <p className={styles.sectionNote}>
                I am a hobbyist blacksmith and woodworker, and have been designing
                and selling custom pieces since 2018.
              </p>
            </section>
          </div>

          <footer className={styles.contact}>
            <div className={styles.iconLinks}>
              <a
                href="https://www.linkedin.com/in/keith-openshaw/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Keith Openshaw on LinkedIn"
                className={styles.iconLink}
              >
                <Image src="/linkedin.png" alt="" width={30} height={30} />
              </a>
              <a
                href="https://github.com/kdopenshaw"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Keith Openshaw on GitHub"
                className={styles.iconLink}
              >
                <svg viewBox="0 0 16 16" width="30" height="30" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"
                  />
                </svg>
              </a>
            </div>
            Contact me:
            <br />
            <a href="mailto:kopensha@gmail.com">kopensha@gmail.com</a>
            <br />
            <a
              href="https://www.linkedin.com/in/keith-openshaw/"
              target="_blank"
              rel="noopener noreferrer"
            >
              linkedin
            </a>
          </footer>
        </div>
      </section>
    </div>
  );
}
