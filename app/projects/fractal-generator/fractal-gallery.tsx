"use client";

// Community gallery with stable randomized paging and an accessible image lightbox.
import styles from "./fractal-gallery.module.css";
import { useCallback, useEffect, useRef, useState } from "react";

import type { FractalParameters } from "./presets";

const FRACTALS_PER_PAGE = 8;

type GalleryFractal = {
  id: string;
  imageUrl: string;
  width: number;
  height: number;
  family: FractalParameters["family"];
  power: number;
  palette: string;
  createdAt: string;
  parameters: FractalParameters;
};

type GalleryResponse = {
  items: GalleryFractal[];
  nextCursor: { orderKey: string; id: string } | null;
};

const familyLabels: Record<FractalParameters["family"], string> = {
  mandelbrot: "Mandelbrot",
  julia: "Julia",
  burning_ship: "Burning Ship",
  tricorn: "Tricorn",
  newton: "Newton",
};

function fractalAlt(fractal: GalleryFractal) {
  return `${familyLabels[fractal.family]} fractal using a power of ${fractal.power}`;
}

function formatValue(value: number) {
  return Number(value.toPrecision(8)).toString();
}

function SettingGroup({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div className={styles.settingGroup}>
      <p>{title}</p>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path fill="currentColor" d="M8 1.5a.75.75 0 0 1 .75.75v6.19l1.72-1.72a.75.75 0 1 1 1.06 1.06l-3 3a.75.75 0 0 1-1.06 0l-3-3a.75.75 0 1 1 1.06-1.06l1.72 1.72V2.25A.75.75 0 0 1 8 1.5ZM3.25 12a.75.75 0 0 0 0 1.5h9.5a.75.75 0 0 0 0-1.5h-9.5Z" />
    </svg>
  );
}

function downloadHref(fractal: GalleryFractal) {
  const filename = `${fractal.parameters.family}-${fractal.parameters.width}x${fractal.parameters.height}.png`;
  const query = new URLSearchParams({ url: fractal.imageUrl, filename });
  return `/api/fractal-gallery/download?${query}`;
}

function FractalSettingsRail({
  fractal,
  onApply,
}: {
  fractal: GalleryFractal;
  onApply: (parameters: FractalParameters) => void;
}) {
  const parameters = fractal.parameters;
  const constant = `${formatValue(parameters.cReal)} ${parameters.cImag < 0 ? "−" : "+"} ${formatValue(Math.abs(parameters.cImag))}i`;

  return (
    <aside className={styles.rail} aria-label="Fractal settings">
      <div className={styles.railBody}>
        <SettingGroup
          title="Family"
          rows={[
            ["Family", familyLabels[parameters.family]],
            ["Exponent p", String(parameters.power)],
            ["Constant c", constant],
          ]}
        />
        <SettingGroup
          title="Orbit"
          rows={[
            ["Iterations", String(parameters.iterations)],
            ["Escape radius", formatValue(parameters.escapeRadius)],
            ["Gamma", formatValue(parameters.gamma)],
          ]}
        />
        <SettingGroup
          title="Complex plane"
          rows={[
            ["Center x", formatValue(parameters.centerX)],
            ["Center y", formatValue(parameters.centerY)],
            ["Scale", formatValue(parameters.scale)],
          ]}
        />
        <div className={styles.colorSettings}>
          <span>Color stops</span>
          <div className={styles.colorStops}>
            {parameters.colors.map((color, index) => (
              <code key={`${color}-${index}`}><i style={{ backgroundColor: color }} />{color.toUpperCase()}</code>
            ))}
          </div>
        </div>
        <SettingGroup
          title="Resolution"
          rows={[["Size", `${parameters.width} × ${parameters.height} px`]]}
        />
      </div>
      <footer className={styles.railFooter}>
        <button className="button" type="button" onClick={() => onApply(parameters)}>
          Use these settings
        </button>
        <a className={`button-outline ${styles.download}`} href={downloadHref(fractal)} download aria-label="Download image">
          <DownloadIcon />
        </a>
      </footer>
    </aside>
  );
}

export default function FractalGallery({
  refreshKey,
  onApplySettings,
}: {
  refreshKey: number;
  onApplySettings: (parameters: FractalParameters) => void;
}) {
  const [seed, setSeed] = useState("");
  const [fractals, setFractals] = useState<GalleryFractal[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<GalleryResponse["nextCursor"]>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inFlightRef = useRef(false);
  const selectedFractal = selectedIndex === null ? null : fractals[selectedIndex] ?? null;

  useEffect(() => {
    setSeed(crypto.randomUUID());
    setFractals([]);
    setHasMore(true);
    setCursor(null);
    setMessage("");
    setSelectedIndex(null);
    inFlightRef.current = false;
  }, [refreshKey]);

  const loadMore = useCallback(async () => {
    if (!seed || inFlightRef.current || !hasMore) return;

    inFlightRef.current = true;
    setIsLoading(true);
    setMessage("");

    try {
      const query = new URLSearchParams({ seed, limit: String(FRACTALS_PER_PAGE) });
      if (cursor) {
        query.set("afterOrder", cursor.orderKey);
        query.set("afterId", cursor.id);
      }
      const response = await fetch(`/api/fractal-gallery?${query}`, { cache: "no-store" });
      const result = await response.json().catch(() => null) as GalleryResponse | { error?: string } | null;

      if (!response.ok) {
        throw new Error(result && "error" in result && result.error ? result.error : "The gallery could not be loaded.");
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
    const target = loadMoreRef.current;
    if (!target || !hasMore) return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) void loadMore();
    }, { rootMargin: "480px 0px" });
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !selectedFractal) return undefined;
    dialog.showModal();
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = oldOverflow;
      if (dialog.open) dialog.close();
    };
  }, [selectedFractal]);

  useEffect(() => {
    if (!selectedFractal) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") setSelectedIndex((index) => index === null ? 0 : (index + 1) % fractals.length);
      if (event.key === "ArrowLeft") setSelectedIndex((index) => index === null ? 0 : (index - 1 + fractals.length) % fractals.length);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [fractals.length, selectedFractal]);

  return (
    <section className={styles.gallery} aria-labelledby="fractal-gallery-title">
      <header className={styles.galleryHeader}>
        <h2 id="fractal-gallery-title">Fractal gallery</h2>
        {fractals.length > 0 && <span>{fractals.length} shown</span>}
      </header>

      {fractals.length > 0 && (
        <div className={`image-grid ${styles.galleryGrid}`}>
          {fractals.map((fractal, index) => (
            <figure className="image-tile" key={fractal.id}>
              <button
                className={styles.galleryImageButton}
                type="button"
                onClick={() => setSelectedIndex(index)}
                aria-label={`View ${fractalAlt(fractal)} and settings`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={fractal.imageUrl} alt={fractalAlt(fractal)} width={fractal.width} height={fractal.height} loading={index < FRACTALS_PER_PAGE ? "eager" : "lazy"} decoding="async" />
              </button>
            </figure>
          ))}
        </div>
      )}

      <div ref={loadMoreRef} className={styles.galleryLoadMore} aria-live="polite">
        {isLoading && <span>Loading fractals…</span>}
        {!isLoading && message && <p>{message}</p>}
        {!isLoading && !message && fractals.length === 0 && !hasMore && <p>The gallery is waiting for its first fractal.</p>}
        {!isLoading && hasMore && fractals.length > 0 && (
          <button className="button-outline" type="button" onClick={() => void loadMore()}>Load 8 more</button>
        )}
      </div>

      {selectedFractal && (
        <dialog
          ref={dialogRef}
          className={styles.lightbox}
          aria-label={`${fractalAlt(selectedFractal)} details`}
          onCancel={(event) => { event.preventDefault(); setSelectedIndex(null); }}
          onClick={(event) => { if (event.target === dialogRef.current) setSelectedIndex(null); }}
        >
          <div
            className={styles.lightboxStage}
            onClick={(event) => { if (event.target === event.currentTarget) setSelectedIndex(null); }}
          >
            <div
              className={styles.lightboxImage}
              onClick={(event) => { if (event.target === event.currentTarget) setSelectedIndex(null); }}
            >
              <div className={styles.lightboxFrame}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selectedFractal.imageUrl} alt={fractalAlt(selectedFractal)} width={selectedFractal.width} height={selectedFractal.height} />
                <button type="button" className={`${styles.lightboxArrow} ${styles.previous}`} onClick={() => setSelectedIndex((index) => index === null ? 0 : (index - 1 + fractals.length) % fractals.length)} aria-label="Previous fractal">‹</button>
                <button type="button" className={styles.lightboxClose} onClick={() => setSelectedIndex(null)} aria-label="Close image">×</button>
                <button type="button" className={`${styles.lightboxArrow} ${styles.next}`} onClick={() => setSelectedIndex((index) => index === null ? 0 : (index + 1) % fractals.length)} aria-label="Next fractal">›</button>
              </div>
            </div>
            <FractalSettingsRail
              fractal={selectedFractal}
              onApply={(parameters) => {
                onApplySettings({ ...parameters, colors: [...parameters.colors] });
                setSelectedIndex(null);
              }}
            />
          </div>
        </dialog>
      )}
    </section>
  );
}
