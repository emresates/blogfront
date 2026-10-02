import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Code2,
  Terminal,
  Braces,
  Sparkles,
} from "lucide-react";
import { postsApi } from "@/lib/api/posts";
import { categoriesApi } from "@/lib/api/categories";
import { errorMessage } from "@/lib/api/client";
import { PostGrid } from "@/components/posts/post-card";
import { EmptyState, ErrorState } from "@/components/ui/primitives";
export const dynamic = "force-dynamic";
export default async function Home() {
  const [posts, categories] = await Promise.allSettled([
    postsApi.list("page=1&pageSize=6"),
    categoriesApi.list(),
  ]);
  return (
    <div className="container">
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="live-dot" /> MERAK ET. ÖĞREN. PAYLAŞ.
          </div>
          <h1>
            Biraz kod.
            <br />
            Biraz fikir.
            <br />
            <span>Bolca keşif.</span>
          </h1>
          <p>
            Yazılım, teknoloji ve üretmek üzerine notlar.
            <br className="desktop-break" /> Birlikte düşünen, öğrendikçe
            paylaşan bir topluluk.
          </p>
          <div className="actions">
            <Link href="/posts" className="button">
              Yazıları keşfet <ArrowUpRight size={18} />
            </Link>
            <Link href="#latest" className="text-link">
              Son yazılara göz at <ArrowRight size={17} />
            </Link>
          </div>
          <div className="hero-footnote">
            <span className="tiny-line" /> Yeni bakış açılarına her zaman yer
            var.
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="art-grid" />
          <span className="art-label">THE SPACE BETWEEN IDEAS</span>
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="art-center">
            m<span>·</span>
          </div>
          <div className="floating-symbol symbol-one">
            <Code2 />
          </div>
          <div className="floating-symbol symbol-two">
            <Braces />
          </div>
          <div className="floating-symbol symbol-three">
            <Terminal />
          </div>
          <div className="art-note">
            <span className="live-dot" /> always curious<span>↗</span>
          </div>
          <span className="art-index">EST. 2026 / OPEN TO IDEAS</span>
        </div>
      </section>
      <div className="topic-strip">
        <span>İLGİ ALANINI BUL</span>
        <Link className="topic active-topic" href="/posts">
          Tüm yazılar <ArrowUpRight size={14} />
        </Link>
        {categories.status === "fulfilled" &&
          categories.value.data.slice(0, 5).map((c) => (
            <Link
              className="topic"
              key={c.id}
              href={`/posts?categoryId=${c.id}`}
            >
              {c.name}
            </Link>
          ))}
        <Link href="/categories" className="topic-all">
          Kategorileri keşfet <ArrowRight size={16} />
        </Link>
      </div>
      <section id="latest" className="section">
        <div className="section-heading">
          <div>
            <div className="eyebrow muted">BLOG / SON EKLENENLER</div>
            <h2>
              Yeni fikirler, taze notlar<span className="brand-dot">.</span>
            </h2>
          </div>
          <Link href="/posts" className="text-link">
            Tüm yazılar <ArrowUpRight size={17} />
          </Link>
        </div>
        {posts.status === "rejected" ? (
          <ErrorState message={errorMessage(posts.reason)} />
        ) : posts.value.data.length ? (
          <PostGrid posts={posts.value.data} />
        ) : (
          <EmptyState
            title="İlk satır için yer hazır."
            description="Bu hikâye yeni başlıyor. Yayınlanan yazılar burada seni bekleyecek."
            action={
              <Link href="/register" className="text-link">
                Topluluğa katıl <ArrowRight size={16} />
              </Link>
            }
          />
        )}
      </section>
      <section className="join-banner">
        <div className="join-icon">
          <Sparkles size={27} />
        </div>
        <div>
          <div className="eyebrow">BİRLİKTE DAHA FAZLASI</div>
          <h2>Sadece okuma. Sohbete katıl.</h2>
          <p>Fikirlerini paylaş, sorular sor, yeni bakış açıları keşfet.</p>
        </div>
        <Link className="button secondary" href="/register">
          Bir hesap oluştur <ArrowUpRight size={18} />
        </Link>
      </section>
    </div>
  );
}
