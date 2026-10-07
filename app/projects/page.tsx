import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

import styles from "./projects.module.css";
import { projects } from "./projects";

export const metadata: Metadata = {
  title: "Projects | Keith Openshaw",
  description: "Selected projects by Keith Openshaw.",
};

export default function ProjectsPage() {
  return (
    <section className="page-shell" aria-labelledby="projects-heading">
      <h1 className="mono-label" id="projects-heading">Projects</h1>
      <ul className={styles.list} aria-label="Projects" role="list">
        {projects.map((project, index) => {
          const imageDark = project.imageDark;
          const imageDarkAlt = project.imageDarkAlt;

          const entry = (
            <>
                <span className={styles.media}>
                  {project.image === "github" ? (
                    <svg className={styles.mark} viewBox="0 0 16 16" aria-hidden="true">
                      <path
                        fill="currentColor"
                        d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"
                      />
                    </svg>
                  ) : (
                    <>
                  <Image
                    className={`${styles.image} ${imageDark ? styles.imageLight : ""}`}
                    src={project.image}
                    alt={project.imageAlt}
                    fill
                    priority={index < 3}
                    sizes="4.5rem"
                  />
                  {imageDark && imageDarkAlt && (
                    <Image
                      className={`${styles.image} ${styles.imageDark}`}
                      src={imageDark}
                      alt={imageDarkAlt}
                      fill
                      sizes="4.5rem"
                    />
                  )}
                    </>
                  )}
                </span>
                <span className={styles.copy}>
                  <span className={styles.titleRow}>
                    <span className={styles.title}>{project.title}</span>
                    <span className={styles.kind}>{project.kind}</span>
                  </span>
                  <span className={styles.description}>{project.description}</span>
                </span>
            </>
          );

          return (
            <li key={project.href}>
              {"external" in project && project.external ? (
                <a
                  className={styles.entry}
                  href={project.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {entry}
                </a>
              ) : (
                <Link className={styles.entry} href={project.href}>
                  {entry}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
