import { Hanken_Grotesk, IBM_Plex_Mono } from "next/font/google";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import "./globals.css";
import Navigation from "./navigation";

const hankenGrotesk = Hanken_Grotesk({
  weight: "variable",
  subsets: ["latin"],
  variable: "--font-hanken-grotesk",
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
});

export const metadata: Metadata = {
  title: "Keith Openshaw",
  description: "Keith Openshaw's personal portfolio.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${hankenGrotesk.variable} ${ibmPlexMono.variable}`}
    >
      <body>
        <Navigation />

        <main>{children}</main>
      </body>
    </html>
  );
}
