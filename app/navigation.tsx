"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import styles from "./navigation.module.css";
import ThemeToggle from "./theme-toggle";

// The menu on every page. "use client" is required because open/closed
// and the current URL only exist in the browser.
// To add a page to the menu, add it to this list.

const links = [
  { href: "/", label: "Home" },
  { href: "/content", label: "Content" },
  { href: "/projects", label: "Projects" },
  { href: "/blacksmithing", label: "Blacksmithing" },
];

function pageLabel(segment: string) {
  return decodeURIComponent(segment)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function Navigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // After a click, ignore hover until the pointer moves.
  // Otherwise the menu reopens immediately under the cursor.
  const [hoverEnabled, setHoverEnabled] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);
  const openedByHoverAt = useRef(0);
  const segments = pathname.split("/").filter(Boolean);

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  const closeAfterNavigation = () => {
    setOpen(false);
    setHoverEnabled(false);
    window.addEventListener("pointermove", () => setHoverEnabled(true), { once: true });
  };

  useEffect(() => {
    if (!open) return undefined;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <header className={styles.siteHeader}>
      <div
        className={styles.menu}
        ref={menuRef}
        onMouseEnter={() => {
          if (!hoverEnabled) return;
          openedByHoverAt.current = Date.now();
          setOpen(true);
        }}
        onMouseLeave={() => {
          openedByHoverAt.current = 0;
          setOpen(false);
        }}
      >
        <button
          type="button"
          className={styles.menuTrigger}
          aria-expanded={open}
          aria-controls="site-menu"
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          onClick={() => {
            // Moving onto the button already opens the menu, and that
            // mouseenter happens before this click. Ignore that first click
            // so it does not immediately close the menu.
            const justOpenedByHover = Date.now() - openedByHoverAt.current < 400;
            if (justOpenedByHover) {
              openedByHoverAt.current = 0;
              setOpen(true);
              return;
            }
            setOpen((isOpen) => !isOpen);
          }}
        >
          <span className={styles.burger} aria-hidden="true" />
        </button>
        {open && (
          <nav id="site-menu" className={styles.menuDropdown} aria-label="Site">
            <ul>
              {links.map((link) => {
                const active = isActive(link.href);

                if (active && segments.length > 1) {
                  return (
                    <li key={link.href} className={styles.breadcrumbItem}>
                      {segments.map((segment, index) => {
                        const href = `/${segments.slice(0, index + 1).join("/")}`;
                        const isCurrent = index === segments.length - 1;

                        return (
                          <span key={href} className={styles.breadcrumbPart}>
                            {index > 0 && (
                              <span aria-hidden="true" className={styles.breadcrumbSeparator}>/</span>
                            )}
                            <Link
                              href={href}
                              aria-current={isCurrent ? "page" : undefined}
                              className={isCurrent ? styles.currentPage : styles.breadcrumbLink}
                              onClick={closeAfterNavigation}
                            >
                              {index === 0 ? link.label : pageLabel(segment)}
                            </Link>
                          </span>
                        );
                      })}
                    </li>
                  );
                }

                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      className={active ? styles.menuItemActive : styles.menuItem}
                      onClick={closeAfterNavigation}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}
      </div>
      <ThemeToggle />
    </header>
  );
}
