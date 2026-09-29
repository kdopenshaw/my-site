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

export default function Navigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  // After a click, ignore hover until the pointer moves.
  // Otherwise the menu reopens immediately under the cursor.
  const [hoverEnabled, setHoverEnabled] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);
  const openedByHoverAt = useRef(0);
  const lastScrollY = useRef(0);

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  const closeAfterNavigation = () => {
    setOpen(false);
    setHoverEnabled(false);
    window.addEventListener("pointermove", () => setHoverEnabled(true), { once: true });
  };

  useEffect(() => {
    lastScrollY.current = window.scrollY;
    setHidden(false);

    if (pathname === "/") return undefined;

    const updateVisibility = () => {
      const currentScrollY = Math.max(window.scrollY, 0);

      if (open || currentScrollY <= 1) {
        setHidden(false);
      } else if (currentScrollY > lastScrollY.current + 4) {
        setHidden(true);
      } else if (currentScrollY < lastScrollY.current - 4) {
        setHidden(false);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", updateVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateVisibility);
  }, [open, pathname]);

  useEffect(() => {
    if (!open) return undefined;

    if (pathname === "/") {
      window.dispatchEvent(new Event("homepage-navigation-open"));
    }

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
  }, [open, pathname]);

  return (
    <header className={`${styles.siteHeader} ${pathname === "/" ? styles.homeHeader : ""} ${hidden ? styles.headerHidden : ""}`}>
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
