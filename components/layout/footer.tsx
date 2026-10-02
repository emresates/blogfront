import Link from "next/link";
export function Footer() {
  return (
    <footer className="footer container">
      <div>
        <Link href="/" className="brand">
          margin<span className="brand-dot">.</span>
        </Link>
        <p>Bir fikrin, başka bir fikre açıldığı yer.</p>
      </div>
      <div className="footer-links">
        <Link href="/posts">Tüm yazılar</Link>
        <Link href="/categories">Kategoriler</Link>
        <span>© {new Date().getFullYear()} Margin</span>
      </div>
    </footer>
  );
}
