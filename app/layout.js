import { Hanken_Grotesk } from "next/font/google";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import "./globals.css";
import Navigation from "./navigation";

const hankenGrotesk = Hanken_Grotesk({
  weight: "variable",
  subsets: ["latin"],
  variable: "--font-hanken-grotesk",
});

export const metadata = {
  title: "Keith Openshaw",
  description: "Keith Openshaw's personal portfolio.",
};

export default function RootLayout({ children }) {
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
