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
      <h1 className="heading-accent" id="projects-heading">Projects</h1>
      <ul className={styles.list} aria-label="Projects" role="list">
        {projects.map((project, index) => (
          <li key={project.href}>
            <Link className={styles.entry} href={project.href} aria-label={project.title}>
              <div className={styles.copy}>
                <span className={styles.title}>{project.title}</span>
                <p className={styles.description}>{project.description}</p>
              </div>
              {project.image && (
                <Image
                  className={styles.thumbnail}
                  src={project.image}
                  alt=""
                  width={160}
                  height={160}
                  priority={index === 0}
                  sizes="88px"
                />
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
