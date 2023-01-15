import Head from "next/head";
import Link from "next/link";
import DataLayout from "../components/DataLayout";

export default function Home() {
  return (
    <>
      <Head>
        <title>Events 2 front</title>
        <meta name="description" content="We create Ethereum projects!" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="flex justify-center text-5xl text-zinc-200">
        <div className="px-5">
          <b>Events 2 front</b> project
        </div>
        <div className="px-5">
          Contract in{" "}
          <Link
            href="https://goerli.etherscan.io/address/0x7876a574e6faa409514c30dc2d8da732254c9af6"
            target="_blank"
            className="my-link"
          >
            Goerli
          </Link>
        </div>
      </div>
      <div className="flex flex-col justify-end p-2 text-4xl text-zinc-200 ">
        <DataLayout />
      </div>
    </>
  );
}
