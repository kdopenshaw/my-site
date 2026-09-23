"use client";

// Shows the pins the server already loaded. This file is a client component
// only so "load more" can reveal the next 10 without another request.

import styles from "./pinterest-board.module.css";
import { useEffect, useRef, useState } from "react";

import type { PinterestPin } from "./pins";

const PINS_PER_PAGE = 10;

interface PinterestBoardProps {
  pins: PinterestPin[];
  boardUrl: string;
}

export default function PinterestBoard({
  pins,
  boardUrl,
}: PinterestBoardProps) {
  const [visibleCount, setVisibleCount] = useState(PINS_PER_PAGE);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const hasMore = visibleCount < pins.length;

  useEffect(() => {
    const loadMore = loadMoreRef.current;

    if (!loadMore || !hasMore) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((count) =>
            Math.min(count + PINS_PER_PAGE, pins.length),
          );
        }
      },
      { rootMargin: "320px 0px" },
    );

    observer.observe(loadMore);
    return () => observer.disconnect();
  }, [hasMore, pins.length]);

  return (
    <section aria-labelledby="pinterest-board-title">
      <header className={styles.header}>
        <div className={styles.identity}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className={styles.avatar}
            src="https://i.pinimg.com/140x140_RS/91/ce/62/91ce6252a44d3bb6c04e43f8d36d36ae.jpg"
            alt=""
            width="48"
            height="48"
          />
          <div>
            <h2 id="pinterest-board-title">Kopenshaw</h2>
            <p>Keith Blacksmithing</p>
          </div>
        </div>

        <a href={boardUrl} target="_blank" rel="noreferrer">
          View board <span aria-hidden="true">&rarr;</span>
        </a>
      </header>

      {pins.length ? (
        <>
          <div className="image-grid">
            {pins.slice(0, visibleCount).map((pin, index) => (
              <a
                className="image-tile"
                href={pin.link || boardUrl}
                key={pin.link || pin.image}
                target="_blank"
                rel="noreferrer"
              >
                {/* Pinterest's 736px CDN variant stays sharp at this layout width. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pin.image}
                  alt={pin.title || `Blacksmithing project ${index + 1}`}
                  loading={index < PINS_PER_PAGE ? "eager" : "lazy"}
                  decoding="async"
                />
              </a>
            ))}
          </div>

          {hasMore ? (
            <div ref={loadMoreRef} className={styles.loadMore}>
              <button
                type="button"
                onClick={() =>
                  setVisibleCount((count) =>
                    Math.min(count + PINS_PER_PAGE, pins.length),
                  )
                }
              >
                Load more pins
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <p>
          The preview is temporarily unavailable.{" "}
          <a href={boardUrl}>View the board on Pinterest</a>.
        </p>
      )}
    </section>
  );
}
