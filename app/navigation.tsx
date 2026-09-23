"use client";

import { Burger, Menu } from "@mantine/core";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import styles from "./navigation.module.css";

const links = [
  { href: "/", label: "Home" },
  { href: "/content", label: "Content" },
  { href: "/fractals", label: "Fractals" },
  { href: "/blacksmithing", label: "Blacksmithing" },
];

export default function Navigation() {
  const pathname = usePathname();
  const [menuOpened, setMenuOpened] = useState(false);
  const [hoverTriggerEnabled, setHoverTriggerEnabled] = useState(true);
  const segments = pathname.split("/").filter(Boolean);
  const pageLabel = (segment: string) =>
    decodeURIComponent(segment)
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  const handleNavigationClick = () => {
    setMenuOpened(false);
    setHoverTriggerEnabled(false);
    window.addEventListener(
      "pointermove",
      () => setHoverTriggerEnabled(true),
      { once: true },
    );
  };

  return (
    <header className={styles.siteHeader}>
      <Menu
        opened={menuOpened}
        onChange={setMenuOpened}
        trigger={hoverTriggerEnabled ? "click-hover" : "click"}
        position="bottom"
        shadow="none"
        width={280}
        withinPortal={false}
      >
        <Menu.Target>
          <Burger
            opened={menuOpened}
            size={18}
            aria-label={menuOpened ? "Close navigation menu" : "Open navigation menu"}
            className={styles.menuTrigger}
          />
        </Menu.Target>
        <Menu.Dropdown className={styles.menuDropdown}>
          {links.map((link) => {
            const active = isActive(link.href);

            if (active && segments.length > 1) {
              return (
                <div key={link.href} className={styles.breadcrumbItem}>
                  {segments.map((segment, index) => {
                    const href = `/${segments.slice(0, index + 1).join("/")}`;
                    const isCurrent = index === segments.length - 1;

                    return (
                      <span key={href} className={styles.breadcrumbPart}>
                        {index > 0 && (
                          <span aria-hidden="true" className={styles.breadcrumbSeparator}>
                            /
                          </span>
                        )}
                        <Link
                          href={href}
                          aria-current={isCurrent ? "page" : undefined}
                          className={isCurrent ? styles.currentPage : styles.breadcrumbLink}
                          onClick={handleNavigationClick}
                        >
                          {index === 0 ? link.label : pageLabel(segment)}
                        </Link>
                      </span>
                    );
                  })}
                </div>
              );
            }

            return (
              <Menu.Item
                key={link.href}
                component={Link}
                href={link.href}
                color={active ? "blue" : undefined}
                aria-current={active ? "page" : undefined}
                className={active ? styles.menuItemActive : styles.menuItem}
                onClick={handleNavigationClick}
              >
                {link.label}
              </Menu.Item>
            );
          })}
        </Menu.Dropdown>
      </Menu>
    </header>
  );
}
