import dynamic from "next/dynamic";
import Head from "next/head";

const DataBook = dynamic(() => import("@/app/projects/databook/App"), { ssr: false });

export default function DataBookPage() {
  return <>
    <Head><title>DataBook</title></Head>
    <DataBook />
  </>;
}
