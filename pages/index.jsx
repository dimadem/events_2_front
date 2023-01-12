import Head from "next/head";
import Header from "../components/Header";

export default function Home() {
  return (
    <>
      <Head>
        <title>Events 2 front</title>
        <meta name="description" content="We create great Etherium projects!" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <p className="p-4">
        Wellcome to <b>Events to front</b> project!
      </p>

      <div className="flex flex-col">
        <Header />
      </div>
    </>
  );
}
