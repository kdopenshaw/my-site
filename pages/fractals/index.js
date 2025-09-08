// pages/fractals.js - Fractal Generator page
import Navigation from "../../components/Navigation";
import s from "../../styles/fractals.module.css";
import Link from "next/link";
import { useRouter } from "next/router";

function NavLink({ href, children }) {
  const router = useRouter();
  const isActive = router.pathname === href;

  return (
    <Link
      href={href}
      className={`${s.navLink} ${isActive ? s.navLinkActive : ""}`}
    >
      {children}
    </Link>
  );
}

export default function Fractals() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#ffffff" }}>
      <Navigation />

      <div className={s.page}>
        <header className={s.mainHeader}>
          <h1 className={s.heading1}>Fractal Explorer</h1>
          <nav className={s.nav}>
            <NavLink href="/fractals">Home</NavLink>
            <NavLink href="/fractals/mandelbrot">Mandelbrot</NavLink>
            <NavLink href="/fractals/julia">Julia</NavLink>
            <NavLink href="/fractals/gallery">Gallery</NavLink>
          </nav>
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
              <a href="mandelbrot.html" className={s.landingButton}>
                Explore Mandelbrot
              </a>
              <a href="julia.html" className={s.landingButton}>
                Explore Julia
              </a>
            </div>
          </section>
          <section id="gallery">
            <h2 className={s.heading2}>Gallery</h2>
            <Gallery />
          </section>
        </main>
      </div>
    </div>
  );
}

// Gallery function
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
