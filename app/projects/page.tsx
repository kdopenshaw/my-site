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
        {projects.map((project, index) => (
          <li key={project.href}>
            <Link className={styles.entry} href={project.href}>
              <span className={styles.media}>
                <Image
                  className={`${styles.image} ${"imageDark" in project ? styles.imageLight : ""}`}
                  src={project.image}
                  alt={project.imageAlt}
                  fill
                  priority={index < 3}
                  sizes="4.5rem"
                />
                {"imageDark" in project && (
                  <Image
                    className={`${styles.image} ${styles.imageDark}`}
                    src={project.imageDark}
                    alt={project.imageDarkAlt}
                    fill
                    sizes="4.5rem"
                  />
                )}
              </span>
              <span className={styles.copy}>
                <span className={styles.titleRow}>
                  <span className={styles.title}>{project.title}</span>
                  <span className={styles.kind}>{project.kind}</span>
                </span>
                <span className={styles.description}>{project.description}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
