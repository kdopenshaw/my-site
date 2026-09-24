"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./fractal-studio.module.css";

export default function DiagramHelp({
  label,
  help,
  diagrams,
}: {
  label: string;
  help: string;
  diagrams: { src: string; label?: string }[];
}) {
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [position, setPosition] = useState<{
    left: number;
    top: number;
    width: number;
    maxHeight: number;
  } | null>(null);
  function cancelClose() {
    if (timer.current) clearTimeout(timer.current);
  }
  function close() {
    cancelClose();
    setPosition(null);
  }
  function scheduleClose() {
    cancelClose();
    timer.current = setTimeout(() => setPosition(null), 150);
  }
  function open() {
    cancelClose();
    const rect = trigger.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.min(320, window.innerWidth - 32);
    const maxHeight = Math.min(360, window.innerHeight - 32);
    setPosition({
      left: Math.max(16, Math.min(rect.left, window.innerWidth - width - 16)),
      top: Math.max(16, Math.min(rect.bottom + 8, window.innerHeight - maxHeight - 16)),
      width,
      maxHeight,
    });
  }
  useEffect(() => {
    if (!position) return;
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPosition(null);
    };
    const outside = (event: PointerEvent) => {
      if (
        !trigger.current?.contains(event.target as Node) &&
        !document.getElementById(id)?.contains(event.target as Node)
      )
        setPosition(null);
    };
    const resize = () => setPosition(null);
    document.addEventListener("keydown", dismiss);
    document.addEventListener("pointerdown", outside);
    window.addEventListener("resize", resize);
    return () => {
      document.removeEventListener("keydown", dismiss);
      document.removeEventListener("pointerdown", outside);
      window.removeEventListener("resize", resize);
    };
  }, [position, id]);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  return (
    <>
      <button
        ref={trigger}
        type="button"
        className={styles.helpInfo}
        aria-label={`Explain ${label}`}
        aria-describedby={position ? id : undefined}
        onMouseEnter={open}
        onMouseLeave={scheduleClose}
        onFocus={open}
        onBlur={scheduleClose}
        onClick={open}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v6" strokeLinecap="round" />
          <circle cx="12" cy="7.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      </button>
      {position &&
        createPortal(
          <div
            id={id}
            role="tooltip"
            className={styles.diagramTooltip}
            style={position}
            onMouseEnter={cancelClose}
            onMouseLeave={close}
          >
            <div
              className={`${styles.configHelpVisuals} ${diagrams.length > 1 ? styles.isGrid : ""}`}
            >
              {diagrams.map((diagram) => (
                <figure key={diagram.src}>
                  <img
                    src={diagram.src}
                    alt={diagram.label ?? `${label} diagram`}
                    width="240"
                    height="104"
                  />
                  {diagram.label && <figcaption>{diagram.label}</figcaption>}
                </figure>
              ))}
            </div>
            <p>{help}</p>
          </div>,
          document.body,
        )}
    </>
  );
}
