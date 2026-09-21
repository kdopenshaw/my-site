import { Hanken_Grotesk } from "next/font/google";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";
import Navigation from "./navigation";

const hankenGrotesk = Hanken_Grotesk({
  weight: "variable",
  subsets: ["latin"],
  variable: "--font-hanken-grotesk",
});

export const metadata: Metadata = {
  title: "Keith Openshaw",
  description: "Keith Openshaw's personal portfolio.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="en"
      className={hankenGrotesk.variable}
    >
      <body>
        <Navigation />

        <main>{children}</main>
      </body>
    </html>
  );
}
