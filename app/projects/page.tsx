import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

import styles from "./projects.module.css";
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "./card";

export const metadata: Metadata = {
  title: "Projects | Keith Openshaw",
  description: "Selected projects by Keith Openshaw.",
};

const projects = [
  {
    href: "/projects/fractal-generator",
    title: "Fractal Generator",
    description: "Explore and render fractals by adjusting their mathematical parameters.",
    image: "/fractals/julia-minus-0.8-0.156.png",
    imageAlt: "Blue spirals of the Julia set for c = -0.8 + 0.156i on a white background",
  },
];

export default function ProjectsPage() {
  return (
    <section className={`page-shell ${styles.page}`} aria-labelledby="projects-heading">
      <h1 className="heading-accent" id="projects-heading">Projects</h1>
      <ul className={styles.list} aria-label="Projects" role="list">
        {projects.map((project) => (
          <li key={project.href}>
            <Link className={styles.projectLink} href={project.href}>
              <Card>
                <Image
                  className={styles.thumbnail}
                  src={project.image}
                  alt={project.imageAlt}
                  width={3500}
                  height={3570}
                  sizes="(max-width: 40rem) calc(100vw - 32px), (max-width: 52rem) calc((100vw - 64px) / 2), 384px"
                />
                <CardHeader>
                  <CardAction>
                    <span className={styles.badge}>Featured</span>
                  </CardAction>
                  <CardTitle>{project.title}</CardTitle>
                  <CardDescription>{project.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
