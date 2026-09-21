import styles from "./page.module.css";
import Image from "next/image";
import type { Metadata } from "next";
import PinterestBoard, {
  type PinterestPin,
} from "../components/pinterest-board";

const PINTEREST_BOARD_URL =
  "https://www.pinterest.com/kopenshaw0014/keith-blacksmithing/";

function decodeXml(value = "") {
  return value
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
}

function readTag(item: string, tag: string) {
  const match = item.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
  return decodeXml(match?.[1]?.trim());
}

function getHighResolutionImage(url: string) {
  return url.replace("/236x/", "/736x/");
}

async function getPinterestPins(): Promise<PinterestPin[]> {
  try {
    const response = await fetch(`${PINTEREST_BOARD_URL.slice(0, -1)}.rss`, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) return [];

    const xml = await response.text();

    return Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/g))
      .map(([, item]) => {
        const description = readTag(item, "description");
        const image = description.match(/<img[^>]+src="([^"]+)"/)?.[1];

        return {
          title: readTag(item, "title"),
          link: readTag(item, "link"),
          image: image ? getHighResolutionImage(image) : "",
        };
      })
      .filter((pin) => pin.image);
  } catch (error) {
    console.error("Unable to load the Pinterest board preview:", error);
    return [];
  }
}

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
      <h1 className="section-title section-title--accent" id="blacksmithing-heading">Blacksmithing</h1>

      <div className={styles.intro}>
        <div className={styles.heroContent}>
          <p>
            I am a hobbyist blacksmith and woodworker, and have been designing
            and selling custom pieces since 2018. I have made everything from
            rings out of skateboard ply to wine racks and a katana.
          </p>
          <p>
            A lot of my work can be found on my Instagram{" "}
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
