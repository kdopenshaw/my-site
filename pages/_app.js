import "../styles/globals.css";
import { Inter, Lora, IBM_Plex_Mono } from "next/font/google";

export const inter = Inter({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-inter",
});

export const lora = Lora({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-lora",
});

export const plexMono = IBM_Plex_Mono({
  weight: ["400", "600"],
  subsets: ["latin"],
  variable: "--font-mono",
});
export default function App({ Component, pageProps }) {
  return (
    <main className={`${inter.variable} ${lora.variable} ${plexMono.variable}`}>
      <Component {...pageProps} />
    </main>
  );
}
