// components/FractalNav.js
import Link from "next/link";
import { useRouter } from "next/router";
import s from "../styles/fractals.module.css"; // match exact casing

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

export default function FractalNav() {
  return (
    <nav className={s.nav}>
      <NavLink href="/fractals">Home</NavLink>
      <NavLink href="/fractals/mandelbrot">Mandelbrot</NavLink>
      <NavLink href="/fractals/julia">Julia</NavLink>
      <NavLink href="/fractals/gallery">Gallery</NavLink>
    </nav>
  );
}
