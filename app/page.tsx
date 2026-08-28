import Image from "next/image";

export default function Home() {
  return (
    <section className="split-layout" aria-labelledby="home-heading">
      <div className="split-layout__content">
        <h1 id="home-heading">Hi, I&apos;m Keith!</h1>

        <p>I have a lot of interests.</p>
        <p>Some of them are on this site. Check it out!</p>

        <a
          href="https://www.linkedin.com/in/keith-openshaw/"
          aria-label="Keith Openshaw on LinkedIn"
          className="icon-link"
        >
          <Image src="/linkedin.png" alt="" width={30} height={30} />
        </a>
      </div>

      <div className="split-layout__media">
        <Image
          src="/fractals/julia_0.2841_notext.png"
          alt="A colorful Julia set fractal"
          width={640}
          height={640}
          priority
        />
      </div>
    </section>
  );
}
