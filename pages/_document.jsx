import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body className="fixed top-0 w-screen h-screen bg-slate-500 p-8">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
