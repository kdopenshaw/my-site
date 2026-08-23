import Image from "next/image";
import Script from "next/script";

export const metadata = {
  title: "Blacksmithing | Keith Openshaw",
  description:
    "Custom blacksmithing and woodworking projects by Keith Openshaw.",
};

export default function BlacksmithingPage() {
  return (
    <section
      className="blacksmithing-page"
      aria-labelledby="blacksmithing-heading"
    >
      <h1 id="blacksmithing-heading">Blacksmithing</h1>

      <div className="blacksmithing-intro">
        <div className="blacksmithing-hero__content">
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

        <div className="blacksmithing-hero__photo">
          <Image
            src="/blacksmith-profile.jpeg"
            alt="Keith wearing protective gear"
            width={1000}
            height={1000}
          />
        </div>
      </div>

      <div
        className="pinterest-embed"
        aria-label="Keith Blacksmithing Pinterest board"
      >
        <a
          data-pin-do="embedBoard"
          data-pin-board-width="650"
          data-pin-scale-height="520"
          data-pin-scale-width="236"
          href="https://www.pinterest.com/kopenshaw0014/keith-blacksmithing/"
        >
          View Keith Blacksmithing on Pinterest
        </a>
      </div>

      <Script
        src="https://assets.pinterest.com/js/pinit.js"
        strategy="afterInteractive"
      />
    </section>
  );
}
