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
      <h1 className="mono-label" id="projects-heading">
        Projects
      </h1>
      <ul className={styles.list} aria-label="Projects">
        {projects.map((project) => {
          const external = "external" in project && project.external;
          const title = (
            <>
              <span className={styles.node} />
              {project.title}
            </>
          );

          return (
            <li className={styles.item} key={project.href}>
              <span className={styles.elbow} aria-hidden="true" />
              <p className={styles.copy}>
                {external ? (
                  <a
                    className={styles.title}
                    href={project.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {title}
                  </a>
                ) : (
                  <Link className={styles.title} href={project.href}>
                    {title}
                  </Link>
                )}{" "}
                <span className={styles.description}>{project.description}</span>
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
