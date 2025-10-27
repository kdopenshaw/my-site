// pages/fractals.js
import Navigation from "../../components/Navigation";
import FractalNav from "../../components/FractalNav";
import whatAreFractls from "../.
import s from "../../styles/fractals.module.css";

export default function Fractals() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#ffffff" }}>
      <Navigation />

      <div className={s.page}>
        <header className={s.mainHeader}>
          <h1 className={s.heading1}>Fractal Explorer</h1>
          <FractalNav />
        </header>

        <main className={s.main}>
          <section id="landing" className={s.landingHero}>
            <h2 className={s.heading2}>Explore the Beauty of Fractals</h2>
            <p>
              Generate and learn about fractals—mathematical objects of infinite
              complexity and beauty. Choose a fractal type to begin, or browse
              the gallery and learning resources below.
            </p>
            <div className={s.landingButtons}>
              <a href="/fractals/mandelbrot" className={s.landingButton}>
                Explore Mandelbrot
              </a>
              <a href="/fractals/julia" className={s.landingButton}>
                Explore Julia
              </a>
            </div>
          </section>

          <section id="gallery">
            {/* <h2 className={s.heading2}>Gallery</h2> */}
            <Gallery />
          </section>

        </main>
      </div>
    </div>
  );
}

function Gallery() {
  const images = ["/fractals/julia_-0.8_0.156.png", "/fractals/fractal1.png"];
  return (
    <div className={s.galleryGrid}>
      {images.map((src, i) => (
        <div key={i} className={s.galleryItem}>
          <img
            src={src}
            alt={`Gallery image ${i + 1}`}
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </div>
      ))}
    </div>
  );
}
