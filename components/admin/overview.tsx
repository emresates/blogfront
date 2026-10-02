"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, FileText, Folder, PenLine } from "lucide-react";
import { postsApi, allPosts } from "@/lib/api/posts";
import { categoriesApi } from "@/lib/api/categories";
import { errorMessage } from "@/lib/api/client";
import { useAuth } from "@/components/auth/auth-provider";
import { LoadingSkeleton, ErrorState } from "@/components/ui/primitives";
export function Overview({ author = false }: { author?: boolean }) {
  const { user } = useAuth();
  const [stats, setStats] = useState<{
    posts: number;
    categories: number;
  } | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [posts, cats] = await Promise.all([
          author ? allPosts() : postsApi.list("page=1&pageSize=1"),
          categoriesApi.list(),
        ]);
        const count = Array.isArray(posts)
          ? posts.filter((p) => String(p.userId) === String(user?.userId))
              .length
          : posts.pagination?.totalCount;
        if (count === undefined)
          throw new Error("Toplam yazı sayısı sunucudan alınamadı.");
        if (active) setStats({ posts: count, categories: cats.data.length });
      } catch (e) {
        if (active) setError(errorMessage(e));
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [author, user?.userId]);
  const base = author ? "/dashboard" : "/admin";
  return (
    <>
      <div className="section-heading">
        <div>
          <div className="eyebrow">GENEL BAKIŞ</div>
          <h1>
            Merhaba, {user?.name.split(" ")[0]}
            <span className="brand-dot">.</span>
          </h1>
          <p className="muted">Bugün hangi fikre hayat vereceksin?</p>
        </div>
        <Link className="button" href={`${base}/posts/new`}>
          <PenLine size={17} />
          Yeni yazı
        </Link>
      </div>
      {error ? (
        <ErrorState message={error} />
      ) : !stats ? (
        <LoadingSkeleton />
      ) : (
        <div className="stats">
          <div className="stat">
            <FileText />
            <span>{author ? "Yazılarım" : "Toplam yazı"}</span>
            <strong>{stats.posts}</strong>
          </div>
          <div className="stat">
            <Folder />
            <span>Kategoriler</span>
            <strong>{stats.categories}</strong>
          </div>
        </div>
      )}
      <div className="editor-note">
        <div className="eyebrow">BİR FİKİRLE BAŞLAR</div>
        <h2>Bir sonraki yazının ilk cümlesi.</h2>
        <p>
          Öğrendiğin bir şey, çözdüğün bir problem veya paylaşmaya değer bir
          düşünce.
        </p>
        <Link className="text-link" href={`${base}/posts/new`}>
          Yazmaya başla <ArrowUpRight size={17} />
        </Link>
      </div>
    </>
  );
}
