// Blacksmithing page. URL: /blacksmithing
// Pin images are loaded in pins.ts, then handed to the board below.

import styles from "./page.module.css";
import Image from "next/image";
import type { Metadata } from "next";
import PinterestBoard from "./pinterest-board";
import { getPinterestPins, PINTEREST_BOARD_URL } from "./pins";

export const metadata: Metadata = {
  title: "Blacksmithing | Keith Openshaw",
  description:
    "Custom blacksmithing and woodworking projects by Keith Openshaw.",
};

export default async function BlacksmithingPage() {
  const pins = await getPinterestPins();

  return (
    <section
      className={`page-shell ${styles.page}`}
      aria-labelledby="blacksmithing-heading"
    >
      <h1 className="mono-label" id="blacksmithing-heading">Blacksmithing</h1>

      <div className={styles.intro}>
        <div className={styles.heroContent}>
          <p>
            I am a hobbyist blacksmith and woodworker, and have been designing
            and selling custom pieces since 2018. Some of my favorite projects include
            rings made from skateboard and a katana.
          </p>
          <p>
            A lot of my work can be found on my the pinterest board below or my Instagram{" "}
            <a href="https://www.instagram.com/cetsteel/">@cetsteel</a>, follow
            along to check out what projects I am currently working on!
          </p>
        </div>

        <div className={styles.heroPhoto}>
          <Image
            src="/blacksmith-profile.jpeg"
            alt="Keith wearing protective gear"
            width={1000}
            height={1000}
          />
        </div>
      </div>

      <PinterestBoard pins={pins} boardUrl={PINTEREST_BOARD_URL} />
    </section>
  );
}
