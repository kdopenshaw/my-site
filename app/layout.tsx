import { Geologica, Hanken_Grotesk, Space_Mono } from "next/font/google";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";
import Navigation from "./navigation";

// next/font downloads these at build time and exposes them as CSS variables.
// globals.css connects those variables to --font-primary, --font-display, and --font-code.

const hankenGrotesk = Hanken_Grotesk({
  weight: "variable",
  subsets: ["latin"],
  variable: "--font-hanken-grotesk",
});

const geologica = Geologica({
  weight: "variable",
  subsets: ["latin"],
  variable: "--font-geologica",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-space-mono",
});

export const metadata: Metadata = {
  title: "Keith Openshaw",
  description: "Keith Openshaw's personal portfolio.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${hankenGrotesk.variable} ${geologica.variable} ${spaceMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var saved=localStorage.getItem("site-theme");document.documentElement.dataset.theme=saved==="light"||saved==="dark"?saved:matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}catch{document.documentElement.dataset.theme=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}`,
          }}
        />
      </head>
      <body>
        <Navigation />
        <main>{children}</main>
      </body>
    </html>
  );
}
