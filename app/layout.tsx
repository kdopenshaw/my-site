import { Geologica, Hanken_Grotesk, Space_Mono } from "next/font/google";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@mantine/core/styles.css";
import "./globals.css";
import Navigation from "./navigation";
import Providers from "./providers";

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
    >
      <body>
        <Providers>
          <Navigation />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
