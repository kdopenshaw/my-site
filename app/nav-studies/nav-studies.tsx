"use client";

import { useEffect, useId, useState, type ReactNode } from "react";

import styles from "./nav-studies.module.css";

const links = [
  { href: "/", label: "Home" },
  { href: "/content", label: "Content" },
  { href: "/projects", label: "Projects" },
  { href: "/blacksmithing", label: "Blacksmithing" },
];

const current = "/content";

function useEscape(open: boolean, close: () => void) {
  useEffect(() => {
    if (!open) return undefined;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open, close]);
}

function Burger({ open }: { open: boolean }) {
  return <span className={styles.burger} data-open={open || undefined} aria-hidden="true" />;
}

function LinkList({ className, onNavigate }: { className: string; onNavigate: () => void }) {
  return (
    <ul className={className}>
      {links.map((link) => {
        const active = link.href === current;

        return (
          <li key={link.href}>
            <a
              href={link.href}
              aria-current={active ? "page" : undefined}
              onClick={(event) => {
                event.preventDefault();
                onNavigate();
              }}
            >
              {link.label}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

function Hamburger({
  open,
  menuId,
  onClick,
}: {
  open: boolean;
  menuId: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={styles.trigger}
      aria-expanded={open}
      aria-controls={menuId}
      aria-label={open ? "Close navigation menu" : "Open navigation menu"}
      onClick={onClick}
    >
      <Burger open={open} />
    </button>
  );
}

function PlainColumn() {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const close = () => setOpen(false);
  useEscape(open, close);

  return (
    <div className={styles.stage}>
      <header className={styles.stageHeader}>
        <div className={styles.anchor}>
          <Hamburger open={open} menuId={menuId} onClick={() => setOpen((isOpen) => !isOpen)} />
          {open && (
            <nav id={menuId} className={styles.plain} aria-label="Site">
              <LinkList className={styles.column} onNavigate={close} />
            </nav>
          )}
        </div>
      </header>
      <SamplePage />
    </div>
  );
}

function HeaderStack() {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const close = () => setOpen(false);
  useEscape(open, close);

  return (
    <div className={styles.stage}>
      <header className={styles.stackHeader}>
        <Hamburger open={open} menuId={menuId} onClick={() => setOpen((isOpen) => !isOpen)} />
        {open && (
          <nav id={menuId} className={styles.stack} aria-label="Site">
            <LinkList className={styles.column} onNavigate={close} />
          </nav>
        )}
      </header>
      <SamplePage />
    </div>
  );
}

function NarrowColumn() {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const close = () => setOpen(false);
  useEscape(open, close);

  return (
    <div className={styles.stage}>
      <header className={styles.stageHeader}>
        <Hamburger open={open} menuId={menuId} onClick={() => setOpen((isOpen) => !isOpen)} />
      </header>
      <SamplePage />
      {open && (
        <div className={styles.scrim}>
          <nav id={menuId} className={styles.narrow} aria-label="Site">
            <LinkList className={styles.column} onNavigate={close} />
          </nav>
        </div>
      )}
    </div>
  );
}

function SamplePage() {
  return (
    <div className={styles.sample}>
      <p className={styles.sampleKicker}>Content</p>
      <h2>Forecasting cocoa futures</h2>
      <p>
        A short stand-in for a page, so the menu can be judged against real type
        rather than an empty frame.
      </p>
    </div>
  );
}

function Study({ title, note, children }: { title: string; note: string; children: ReactNode }) {
  return (
    <section>
      <h2>{title}</h2>
      <p>{note}</p>
      {children}
    </section>
  );
}

export default function NavStudies() {
  return (
    <div className={styles.page}>
      <h1>Nav studies</h1>
      <p className={styles.intro}>
        Three hamburger menus. Content is the current page in each one. These links stay on this page.
      </p>

      <Study title="Plain column" note="The links sit under the icon, with no border or fill.">
        <PlainColumn />
      </Study>
      <Study title="Header stack" note="The list joins the header and the page moves down to make room.">
        <HeaderStack />
      </Study>
      <Study title="Narrow column" note="A slim column of links, with the page behind it dimmed.">
        <NarrowColumn />
      </Study>
    </div>
  );
}
