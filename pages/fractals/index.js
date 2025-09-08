// pages/fractals.js - Fractal Generator page
import Navigation from "../../components/Navigation";
import styles from "../../styles/fractals.module.css";
import Link from "next/link";
import { useRouter } from "next/router";

function NavLink({ href, children }) {
  const router = useRouter();
  const isActive = router.pathname === href;

  return (
    <Link
      href={href}
      className={`${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}
    >
      {children}
    </Link>
  );
}

export default function Fractals() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#ffffff" }}>
      <Navigation />

      <div className={styles.page}>
        <header className={styles.mainHeader}>
          <h1 className={styles.heading1}>Fractal Explorer</h1>
          <nav className={styles.nav}>
            <NavLink href="/fractals">Home</NavLink>
            <NavLink href="/fractals/mandelbrot">Mandelbrot</NavLink>
            <NavLink href="/fractals/julia">Julia</NavLink>
            <NavLink href="/fractals/gallery">Gallery</NavLink>
          </nav>
        </header>
      </div>
    </div>
  );
}
