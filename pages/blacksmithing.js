// pages/blacksmithing.js

import { useEffect, useState } from "react";
import Script from "next/script";
import Head from "next/head";
import fs from "fs";
import path from "path";
import { useGLightbox } from "../hooks/useGLightbox";
import Navigation from "../components/Navigation";

export default function BlacksmithingPage({ initialImages, initialFeatures }) {
  const [galleries, setGalleries] = useState(initialImages);
  const [features, setFeatures] = useState(() => {
    const map = {};
    initialFeatures.forEach((f) => {
      map[f.id] = { ...f, currentIndex: 0 };
    });
    return map;
  });

  useGLightbox([galleries, features]);

  const navigateFeature = (featureId, direction) => {
    const feature = features[featureId];
    if (!feature) return;
    const images = feature.data.images;
    let newIndex;

    if (typeof direction === "number") {
      newIndex = direction;
    } else if (direction === "prev") {
      newIndex = (feature.currentIndex - 1 + images.length) % images.length;
    } else {
      newIndex = (feature.currentIndex + 1) % images.length;
    }

    setFeatures((prev) => ({
      ...prev,
      [featureId]: { ...prev[featureId], currentIndex: newIndex },
    }));
  };

  return (
    <>
      <Navigation />
      <Head>
        <title>Blacksmith Portfolio</title>
        <meta
          name="description"
          content="Professional blacksmith work showcasing swords, axes, and custom metalwork"
        />
      </Head>

      <main className="blacksmith-page">
        <h1>Blacksmith Work</h1>

        {/* Instagram Profile Card */}
        <div>
          <InstagramCard />
          <p>Some more text</p>
        </div>

        {/* Your galleries/features */}
        {features.sword && (
          <FeatureSection
            featureId="sword"
            featureData={features.sword}
            onNavigate={navigateFeature}
          />
        )}
        {galleries[0] && <GallerySection images={galleries[0]} />}
        {features.axe && (
          <FeatureSection
            featureId="axe"
            featureData={features.axe}
            onNavigate={navigateFeature}
          />
        )}
        {galleries[1] && <GallerySection images={galleries[1]} />}
        {galleries[2] && <GallerySection images={galleries[2]} />}
      </main>
    </>
  );
}

function InstagramCard() {
  useEffect(() => {
    // Poll until the embed script is ready, then process
    const interval = setInterval(() => {
      if (window.instgrm && window.instgrm.Embeds) {
        window.instgrm.Embeds.process();
        clearInterval(interval);
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ maxWidth: "540px", margin: "20px auto" }}>
      <blockquote
        className="instagram-media"
        data-instgrm-permalink="https://www.instagram.com/cetsteel/"
        data-instgrm-version="14"
        style={{
          background: "#FFF",
          border: 0,
          borderRadius: "3px",
          margin: "1px",
          maxWidth: "540px",
          minWidth: "326px",
          width: "calc(100% - 2px)",
        }}
      ></blockquote>

      <Script
        src="https://www.instagram.com/embed.js"
        strategy="afterInteractive"
      />
    </div>
  );
}

function FeatureSection({ featureId, featureData, onNavigate }) {
  const { data, currentIndex } = featureData;

  if (!data || !data.images || data.images.length === 0) return null;

  const currentImage = data.images[currentIndex];

  return (
    <section className="featured-section">
      <div className="feature-content">
        <div className="feature-box">
          {/* Visible image */}
          <a
            href={currentImage.src}
            className="glightbox"
            data-gallery={`feature-${featureId}`}
            data-title={currentImage.heading}
            data-description={currentImage.description}
          >
            <img src={currentImage.src} alt={currentImage.alt} />
          </a>

          {/* Hidden images for GLightbox navigation */}
          {data.images.map((image, index) =>
            index !== currentIndex ? (
              <a
                key={index}
                href={image.src}
                className="glightbox"
                data-gallery={`feature-${featureId}`}
                data-title={image.heading}
                data-description={image.description}
                style={{ display: "none" }}
              />
            ) : null
          )}

          {/* Navigation arrows */}
          <button
            className="nav-arrow prev"
            onClick={() => onNavigate(featureId, "prev")}
            aria-label="Previous image"
          >
            ‹
          </button>
          <button
            className="nav-arrow next"
            onClick={() => onNavigate(featureId, "next")}
            aria-label="Next image"
          >
            ›
          </button>

          {/* Dots */}
          <div className="feature-dots">
            {data.images.map((_, index) => (
              <button
                key={index}
                className={`dot ${index === currentIndex ? "active" : ""}`}
                onClick={() => onNavigate(featureId, index)}
                aria-label={`Show image ${index + 1}`}
              />
            ))}
          </div>
        </div>

        <div className="feature-text">
          <h2 className="feature-title">{data.title}</h2>
          <h3>{currentImage.heading}</h3>
          <p>{currentImage.description}</p>
        </div>
      </div>
    </section>
  );
}

function GallerySection({ images }) {
  if (!images || images.length === 0) return null;

  return (
    <section className="gallery-wrap">
      <div className="gallery">
        {images.map((image, index) => {
          const isVideo = /\.mp4$/i.test(image.url);
          return (
            <a
              key={index}
              href={image.url}
              className="glightbox"
              data-gallery="blacksmith"
              {...(isVideo ? { "data-type": "video" } : {})}
            >
              {isVideo ? (
                <div className="video-thumbnail">
                  <video
                    src={image.url}
                    muted
                    playsInline
                    preload="metadata" // This enables thumbnails!
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: "6px",
                    }}
                    // Add error handling
                    onError={(e) => {
                      console.warn(`Video load error for ${image.url}:`, e);
                    }}
                    onLoadedMetadata={(e) => {
                      console.log(`Video metadata loaded for ${image.url}`);
                    }}
                  />
                  <div className="play-overlay">
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="white"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              ) : (
                <img
                  src={image.url}
                  alt={image.name}
                  loading="lazy"
                  decoding="async"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              )}
            </a>
          );
        })}
      </div>
    </section>
  );
}

// ==================== SERVER-SIDE DATA LOADING ====================

export async function getStaticProps() {
  try {
    const publicDir = path.join(process.cwd(), "public/blacksmithing");

    let galleries = [];
    const galleriesDir = path.join(publicDir, "galleries");
    const galleryFolders = ["gallery1", "gallery2", "gallery3", "gallery4"];

    if (fs.existsSync(galleriesDir)) {
      for (const folderName of galleryFolders) {
        const galleryDir = path.join(galleriesDir, folderName);
        if (fs.existsSync(galleryDir)) {
          const imageFiles = fs
            .readdirSync(galleryDir)
            .filter((file) => file.match(/\.(jpg|jpeg|png|gif|mp4)$/i))
            .sort()
            .map((filename) => ({
              name: filename,
              url: `/blacksmithing/galleries/${folderName}/${filename}`,
            }));
          if (imageFiles.length > 0) galleries.push(imageFiles);
        }
      }
    }

    if (galleries.length === 0) {
      const imagesDir = path.join(publicDir, "images");
      if (fs.existsSync(imagesDir)) {
        const imageFiles = fs
          .readdirSync(imagesDir)
          .filter((file) => file.match(/\.(jpg|jpeg|png|gif|mp4)$/i))
          .sort()
          .map((filename) => ({
            name: filename,
            url: `/blacksmithing/images/${filename}`,
          }));

        for (let i = 0; i < imageFiles.length; i += 8) {
          galleries.push(imageFiles.slice(i, i + 8));
        }
      }
    }

    let features = [];
    const featuresDir = path.join(publicDir, "features");
    const featureIds = ["sword", "axe"];

    if (fs.existsSync(featuresDir)) {
      for (const featureId of featureIds) {
        const featureDir = path.join(featuresDir, featureId);
        if (fs.existsSync(featureDir)) {
          const jsonPath = path.join(featureDir, "images.json");
          if (fs.existsSync(jsonPath)) {
            const imageData = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
            features.push({ id: featureId, data: imageData });
          }
        }
      }
    }

    return {
      props: { initialImages: galleries, initialFeatures: features },
      revalidate: 3600,
    };
  } catch (error) {
    console.error("Error in getStaticProps:", error);
    return { props: { initialImages: [], initialFeatures: [] } };
  }
}
