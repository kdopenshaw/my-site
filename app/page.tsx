// Home page. URL: /
// This file renders on the server. The moving image is a separate file
// because it needs the browser (see home-fractal.tsx).

import Link from "next/link";

import { getContentPosts } from "./content/posts";
import HomeFractal from "./home-fractal";
import styles from "./home.module.css";
import { projects } from "./projects/projects";
import SiteLinks from "./site-links";

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
          <h1 className={styles.homeTitle} id="home-title">
            I&apos;m <span className={styles.homeName}>Keith Openshaw</span>, this is the
            home for the things I&apos;m building and thinking about.
          </h1>
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
                    {"external" in project && project.external ? (
                      <a href={project.href} target="_blank" rel="noopener noreferrer">
                        {project.title}
                      </a>
                    ) : (
                      <Link href={project.href}>{project.title}</Link>
                    )}
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
            <div className={styles.contactIcons}>
              <SiteLinks />
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
