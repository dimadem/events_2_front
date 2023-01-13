import Head from "next/head";
import DataLayout from "../components/DataLayout";

export default function Home() {
  return (
    <>
      <Head>
        <title>Events 2 front</title>
        <meta name="description" content="We create great Etherium projects!" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <p className="p-4 text-2xl">
        <b>Events 2 front</b> project
      </p>
      <div className="flex flex-col">
        <DataLayout />
      </div>
    </>
  );
}
