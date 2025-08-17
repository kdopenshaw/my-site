// pages/_app.js - Loads global styles for entire site
import "../styles/globals.css";

export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
