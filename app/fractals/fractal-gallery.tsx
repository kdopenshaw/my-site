"use client";

import styles from "./fractal-gallery.module.css";
import { useCallback, useEffect, useRef, useState } from "react";

const FRACTALS_PER_PAGE = 10;

type GalleryFractal = {
  id: string;
  imageUrl: string;
  width: number;
  height: number;
  family: "mandelbrot" | "julia" | "burning_ship" | "tricorn" | "newton";
  power: number;
  palette: string;
  createdAt: string;
};

type GalleryResponse = {
  items: GalleryFractal[];
  nextCursor: { orderKey: string; id: string } | null;
};

function fractalAlt(fractal: GalleryFractal) {
  const family = {
    mandelbrot: "Mandelbrot set",
    julia: "Julia set",
    burning_ship: "Burning Ship set",
    tricorn: "Tricorn set",
    newton: "Newton fractal",
  }[fractal.family];
  return `${family} fractal using a power of ${fractal.power}`;
}

export default function FractalGallery({ refreshKey }: { refreshKey: number }) {
  const [seed, setSeed] = useState("");
  const [fractals, setFractals] = useState<GalleryFractal[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<GalleryResponse["nextCursor"]>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const inFlightRef = useRef(false);

  useEffect(() => {
    setSeed(crypto.randomUUID());
    setFractals([]);
    setHasMore(true);
    setCursor(null);
    setMessage("");
  }, [refreshKey]);

  const loadMore = useCallback(async () => {
    if (!seed || inFlightRef.current || !hasMore) return;

    inFlightRef.current = true;
    setIsLoading(true);
    setMessage("");

    try {
      const query = new URLSearchParams({
        seed,
        limit: String(FRACTALS_PER_PAGE),
      });
      if (cursor) {
        query.set("afterOrder", cursor.orderKey);
        query.set("afterId", cursor.id);
      }
      const response = await fetch(`/api/fractal-gallery?${query}`, {
        cache: "no-store",
      });
      const result = await response.json().catch(() => null) as GalleryResponse | { error?: string } | null;

      if (!response.ok) {
        throw new Error(result && "error" in result && result.error
          ? result.error
          : "The gallery could not be loaded.");
      }

      const page = result as GalleryResponse;
      setFractals((current) => [...current, ...page.items]);
      setCursor(page.nextCursor);
      setHasMore(page.nextCursor !== null);
    } catch (error) {
      setHasMore(false);
      setMessage(error instanceof Error ? error.message : "The gallery could not be loaded.");
    } finally {
      inFlightRef.current = false;
      setIsLoading(false);
    }
  }, [cursor, hasMore, seed]);

  useEffect(() => {
    if (seed && fractals.length === 0 && hasMore && !isLoading) void loadMore();
  }, [fractals.length, hasMore, isLoading, loadMore, seed]);

  useEffect(() => {
    const loadMoreTarget = loadMoreRef.current;
    if (!loadMoreTarget || !hasMore) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void loadMore();
      },
      { rootMargin: "480px 0px" },
    );

    observer.observe(loadMoreTarget);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  return (
    <section className={styles.gallery} aria-labelledby="fractal-gallery-title">
      <header className={styles.galleryHeader}>
        <h2 className="heading-accent" id="fractal-gallery-title">Fractal gallery</h2>
        {fractals.length > 0 && <span>{fractals.length} shown</span>}
      </header>

      {fractals.length > 0 && (
        <div className={`image-grid ${styles.galleryGrid}`}>
          {fractals.map((fractal, index) => (
            <figure className="image-tile" key={fractal.id}>
              <a
                href={fractal.imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open ${fractalAlt(fractal)} full size in a new tab`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={fractal.imageUrl}
                  alt={fractalAlt(fractal)}
                  width={fractal.width}
                  height={fractal.height}
                  loading={index < FRACTALS_PER_PAGE ? "eager" : "lazy"}
                  decoding="async"
                />
              </a>
            </figure>
          ))}
        </div>
      )}

      <div ref={loadMoreRef} className={styles.galleryLoadMore} aria-live="polite">
        {isLoading && <span>Loading fractals…</span>}
        {!isLoading && message && <p>{message}</p>}
        {!isLoading && !message && fractals.length === 0 && !hasMore && (
          <p>The gallery is waiting for its first fractal.</p>
        )}
        {!isLoading && hasMore && fractals.length > 0 && (
          <button className="button" type="button" onClick={() => void loadMore()}>Load 10 more</button>
        )}
      </div>
    </section>
  );
}
