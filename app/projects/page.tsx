import Link from "next/link";
import type { Metadata } from "next";

import styles from "./projects.module.css";
import { projects } from "./projects";

export const metadata: Metadata = {
  title: "Projects | Keith Openshaw",
  description: "Selected projects by Keith Openshaw.",
};

function panelImages(project: (typeof projects)[number]) {
  if (project.href === "/projects/fractal-generator") {
    return {
      light: "/fractals/julia-growth-light-last.png",
      dark: "/fractals/julia-growth-dark-last.png",
    };
  }
  if (!("image" in project) || project.image === "github") return null;
  return {
    light: project.image,
    dark: "imageDark" in project ? project.imageDark : null,
  };
}

export default function ProjectsPage() {
  return (
    <section className="page-shell" aria-labelledby="projects-heading">
      <h1 className="mono-label" id="projects-heading">
        Projects
      </h1>
      <ul className={styles.list} aria-label="Projects">
        {projects.map((project) => {
          const external = "external" in project && project.external;
          const images = panelImages(project);
          const isFractal = project.href === "/projects/fractal-generator";
          const body = (
            <>
              <p className={styles.copy}>
                <span className={styles.title}>{project.title}</span>
                <span className={styles.description}>{project.description}</span>
              </p>
              {images ? (
                <div className={styles.media} aria-hidden="true">
                  <img
                    className={[images.dark ? styles.light : "", isFractal ? styles.fractal : ""].filter(Boolean).join(" ") || undefined}
                    src={images.light}
                    alt=""
                  />
                  {images.dark ? (
                    <img className={[styles.dark, isFractal ? styles.fractal : ""].filter(Boolean).join(" ")} src={images.dark} alt="" />
                  ) : null}
                </div>
              ) : null}
            </>
          );

          return (
            <li className={styles.item} key={project.href}>
              <span className={styles.elbow} aria-hidden="true" />
              <span className={styles.node} aria-hidden="true" />
              {external ? (
                <a className={styles.panel} href={project.href} target="_blank" rel="noopener noreferrer">
                  {body}
                </a>
              ) : (
                <Link className={styles.panel} href={project.href}>
                  {body}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
