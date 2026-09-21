"use client";

import styles from "./navigation.module.css";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/content", label: "Content" },
  { href: "/fractals", label: "Fractals" },
  { href: "/blacksmithing", label: "Blacksmithing" },
];

export default function Navigation() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === href : pathname.startsWith(href);

  return (
    <header className={styles.siteHeader}>
      {/* <Link href="/" aria-label="Keith Openshaw — home">
        <Image src="/logo.png" alt="" width={60} height={60} priority />
      </Link> */}

      <nav aria-label="Primary navigation">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive(link.href) ? "page" : undefined}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
