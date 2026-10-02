"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="container page-space empty">
      <h1>Bir şeyler ters gitti.</h1>
      <p>Lütfen tekrar deneyin.</p>
      <button className="button" onClick={reset}>
        Tekrar dene
      </button>
    </div>
  );
}
