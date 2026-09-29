import { Geologica, Inconsolata, Source_Serif_4 } from "next/font/google";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";
import Navigation from "./navigation";

// next/font downloads these at build time and exposes them as CSS variables.
// globals.css connects those variables to --font-primary, --font-display, and --font-code.

const geologica = Geologica({
  weight: "variable",
  subsets: ["latin"],
  variable: "--font-geologica",
});

const sourceSerif = Source_Serif_4({
  weight: "variable",
  subsets: ["latin"],
  variable: "--font-source-serif",
});

const inconsolata = Inconsolata({
  weight: "variable",
  subsets: ["latin"],
  variable: "--font-inconsolata",
});

export const metadata: Metadata = {
  title: "Keith Openshaw",
  description: "Keith Openshaw's personal portfolio.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geologica.variable} ${sourceSerif.variable} ${inconsolata.variable}`}
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
