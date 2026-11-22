import type { AppProps } from "next/app";
import "@mdxeditor/editor/style.css";
import "@/app/projects/databook/components/theme/theme.css";

export default function BookApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
