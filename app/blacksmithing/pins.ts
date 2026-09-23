// Pinterest does not give this site a simple image API, so the page reads
// the board's public RSS feed. This runs on the server. The page passes
// the result into the board component.

export type PinterestPin = {
  title: string;
  link: string;
  image: string;
};

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

export async function getPinterestPins(): Promise<PinterestPin[]> {
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

export { PINTEREST_BOARD_URL };
