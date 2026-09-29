// Home page. URL: /
// This file renders on the server. The moving image is a separate file
// because it needs the browser (see home-fractal.tsx).

import Image from "next/image";
import Link from "next/link";

import { formatDate, getContentPosts } from "./content/posts";
import HomeExperience from "./home-experience";
import styles from "./home.module.css";
import { projects } from "./projects/projects";

export default function Home() {
  const latestPost = getContentPosts()[0];
  const latestProject = projects[0];

  return (
    <HomeExperience>
      <div className={styles.introductionCopy}>
        <h1>Hi, I&apos;m Keith!</h1>

        <p>I have a lot of interests.</p>
        <p>Some of them are on this site. Check it out!</p>

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
      </div>

      <nav className={styles.homeDirectory} aria-label="Explore the site">
        <ul>
          <li className={styles.directoryRow}>
            <h3><Link href="/content">Content</Link></h3>
            {latestPost && (
              <>
                <Link className={styles.latest} href={`/content/${latestPost.slug}`}>
                  {latestPost.metadata.title}
                </Link>
                <time className={styles.latestDate} dateTime={latestPost.metadata.publishedAt}>
                  {formatDate(latestPost.metadata.publishedAt, false)}
                </time>
              </>
            )}
          </li>
          <li className={styles.directoryRow}>
            <h3><Link href="/projects">Projects</Link></h3>
            {latestProject && (
              <>
                <Link className={styles.latest} href={latestProject.href}>
                  {latestProject.title}
                </Link>
              </>
            )}
          </li>
          <li>
            <h3>
              <Link href="/blacksmithing">Blacksmithing</Link>
            </h3>
          </li>
        </ul>
      </nav>

      <footer className={styles.contact}>
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
    </HomeExperience>
  );
}
