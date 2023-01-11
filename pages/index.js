import Head from "next/head";
import Header from "./componets/Header";

export default function Home() {
  return (
    <>
      <Head>
        <title>Events to front project</title>
        <meta name="description" content="We create great Etherium projects!" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <div>
          <p>
          Wellcome to <b>Events to front</b> project!
          </p>
        </div>
<div style={{ textAlign: "center" }}>
    <Header/>
      </div>
      </main>
    </>
  );
}
