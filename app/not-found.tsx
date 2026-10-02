import Link from "next/link";
export default function NotFound() {
  return (
    <div className="container page-space empty">
      <div className="eyebrow">404 / KAYIP BİR SATIR</div>
      <h1>Bu sayfa burada değil.</h1>
      <p>Yeni bir fikir keşfetmek için ana sayfaya dönebilirsin.</p>
      <Link className="button" href="/">
        Ana sayfaya dön
      </Link>
    </div>
  );
}
