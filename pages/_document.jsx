import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body className="top-0">
        <div className=" w-screen h-screen p-8 bg-gradient-to-r from-slate-300 via-slate-400 to-slate-500 overflow-y-auto">
          <Main />
          <NextScript />
        </div>
      </body>
    </Html>
  );
}
