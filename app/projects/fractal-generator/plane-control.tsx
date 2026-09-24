"use client";

import { useId, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import styles from "./fractal-studio.module.css";

type Viewport = { centerX: number; centerY: number; scale: number };
type Corner = "nw" | "ne" | "sw" | "se";
type Props = Viewport & { aspectRatio: number; onChange: (value: Viewport) => void };
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function PlaneControl({ centerX, centerY, scale, aspectRatio, onChange }: Props) {
  const helpId = useId();
  const grid = useRef<HTMLDivElement>(null);
  const [domain] = useState(() =>
    Math.max(
      8,
      Math.abs(centerX) * 2 + scale * 1.6,
      Math.abs(centerY) * 2 + (scale / aspectRatio) * 1.6,
    ),
  );
  const drag = useRef<null | {
    x: number;
    y: number;
    units: number;
    start: Viewport;
    corner?: Corner;
  }>(null);
  const height = scale / aspectRatio;

  function apply(next: Viewport) {
    const nextScale = clamp(
      next.scale,
      0.000001,
      Math.min(20, domain * 0.95, domain * aspectRatio * 0.95),
    );
    onChange({
      centerX: clamp(
        next.centerX,
        Math.max(-10, -domain / 2 + nextScale / 2),
        Math.min(10, domain / 2 - nextScale / 2),
      ),
      centerY: clamp(
        next.centerY,
        Math.max(-10, -domain / 2 + nextScale / aspectRatio / 2),
        Math.min(10, domain / 2 - nextScale / aspectRatio / 2),
      ),
      scale: nextScale,
    });
  }

  function start(event: PointerEvent<HTMLButtonElement>, corner?: Corner) {
    if (event.button !== 0 || !grid.current) return;
    event.preventDefault();
    event.currentTarget.focus();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      x: event.clientX,
      y: event.clientY,
      units: domain / grid.current.getBoundingClientRect().width,
      start: { centerX, centerY, scale },
      corner,
    };
  }

  function move(event: PointerEvent<HTMLButtonElement>) {
    const active = drag.current;
    if (!active) return;
    const dx = (event.clientX - active.x) * active.units;
    const dy = -(event.clientY - active.y) * active.units;
    if (!active.corner) {
      apply({
        ...active.start,
        centerX: active.start.centerX + dx,
        centerY: active.start.centerY + dy,
      });
      return;
    }
    const sx = active.corner.includes("e") ? 1 : -1;
    const sy = active.corner.includes("n") ? 1 : -1;
    const ratio = 1 / aspectRatio;
    const delta = (sx * dx + sy * dy * ratio) / (1 + ratio * ratio);
    const nextScale = clamp(
      active.start.scale + delta,
      0.000001,
      Math.min(20, domain * 0.95, domain * aspectRatio * 0.95),
    );
    apply({
      scale: nextScale,
      centerX: active.start.centerX + (sx * (nextScale - active.start.scale)) / 2,
      centerY: active.start.centerY + (sy * (nextScale - active.start.scale)) / aspectRatio / 2,
    });
  }

  function keyboard(event: KeyboardEvent<HTMLButtonElement>, resizing = false) {
    const step = Math.max(scale / (event.shiftKey ? 10 : 50), 0.000001);
    let next = { centerX, centerY, scale };
    if (
      event.key === "+" ||
      event.key === "=" ||
      (resizing && ["ArrowRight", "ArrowUp"].includes(event.key))
    )
      next.scale *= 1.1;
    else if (event.key === "-" || (resizing && ["ArrowLeft", "ArrowDown"].includes(event.key)))
      next.scale /= 1.1;
    else if (event.key === "ArrowRight") next.centerX += step;
    else if (event.key === "ArrowLeft") next.centerX -= step;
    else if (event.key === "ArrowUp") next.centerY += step;
    else if (event.key === "ArrowDown") next.centerY -= step;
    else return;
    event.preventDefault();
    apply(next);
  }

  const pointerEvents = {
    onPointerMove: move,
    onPointerUp: () => {
      drag.current = null;
    },
    onPointerCancel: () => {
      drag.current = null;
    },
    onLostPointerCapture: () => {
      drag.current = null;
    },
  };
  return (
    <>
      <div className={styles.planeGrid} ref={grid}>
        <span className={styles.planeAxisX} aria-hidden="true">
          Re
        </span>
        <span className={styles.planeAxisY} aria-hidden="true">
          Im
        </span>
        <div
          className={styles.planeViewport}
          style={{
            left: `${(0.5 + (centerX - scale / 2) / domain) * 100}%`,
            top: `${(0.5 - (centerY + height / 2) / domain) * 100}%`,
            width: `${(scale / domain) * 100}%`,
            height: `${(height / domain) * 100}%`,
          }}
        >
          <button
            type="button"
            className={styles.planeMove}
            aria-label="Move complex-plane viewport"
            aria-describedby={helpId}
            onPointerDown={(event) => start(event)}
            onKeyDown={(event) => keyboard(event)}
            {...pointerEvents}
          />
          {(["nw", "ne", "sw", "se"] as Corner[]).map((corner) => (
            <button
              key={corner}
              type="button"
              className={styles.planeHandle}
              data-corner={corner}
              aria-label={`Resize viewport ${corner}`}
              aria-describedby={helpId}
              onPointerDown={(event) => start(event, corner)}
              onKeyDown={(event) => keyboard(event, true)}
              {...pointerEvents}
            />
          ))}
        </div>
      </div>
      <p className={styles.planeHint} id={helpId}>
        Drag to pan · corners to resize.<span> Arrow keys move; + / − resize.</span>
      </p>
      <output className={styles.planeReadout} aria-live="polite">
        {centerX.toPrecision(3)}, {centerY.toPrecision(3)} · span {scale.toPrecision(3)}
      </output>
    </>
  );
}
