import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { initializeFirebase } from "../lib/firebase";

export default function App({ Component, pageProps }: AppProps) {
  initializeFirebase();
  return <Component {...pageProps} />;
}
