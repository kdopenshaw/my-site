import SiteLinks from "./site-links";
import styles from "./site-footer.module.css";

export default function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <SiteLinks />
      <p className={styles.contact}>
        Get in touch: <a href="mailto:kopensha@gmail.com">kopensha@gmail.com</a>
      </p>
    </footer>
  );
}
