"use client";
import { useState } from "react";
import { Heart, Share2 } from "lucide-react";
import { postsApi } from "@/lib/api/posts";
import { ApiError, errorMessage } from "@/lib/api/client";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/components/ui/providers";
import Link from "next/link";
export function ArticleActions({
  id,
  slug,
  initialCount,
  initialLiked,
}: {
  id: number;
  slug: string;
  initialCount: number;
  initialLiked?: boolean;
}) {
  const { user } = useAuth();
  const toast = useToast();
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState<boolean | undefined>(initialLiked);
  const [busy, setBusy] = useState(false);
  async function like(remove = false) {
    if (busy) return;
    setBusy(true);
    try {
      await postsApi.like(id, remove);
      setLiked(!remove);
      setCount((c) => Math.max(0, c + (remove ? -1 : 1)));
      toast(remove ? "Beğeni kaldırıldı." : "Yazı beğenildi.");
    } catch (e) {
      if (
        e instanceof ApiError &&
        e.errCode?.toLowerCase() === "postalreadyliked"
      )
        setLiked(true);
      toast(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function share() {
    try {
      if (navigator.share)
        await navigator.share({ title: document.title, url: location.href });
      else {
        await navigator.clipboard.writeText(location.href);
        toast("Bağlantı kopyalandı.");
      }
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError"))
        toast("Bağlantı paylaşılamadı. Adres çubuğundan kopyalayabilirsin.");
    }
  }
  return (
    <div className="article-actions">
      {user ? (
        <>
          <button
            className={`button secondary ${liked ? "liked" : ""}`}
            disabled={busy}
            onClick={() => void like(liked === true)}
          >
            <Heart size={18} fill={liked ? "currentColor" : "none"} />
            {count} ·{" "}
            {busy ? "İşleniyor…" : liked ? "Beğeniyi kaldır" : "Beğen"}
          </button>
          {liked === undefined && (
            <button
              className="text-link small"
              disabled={busy}
              onClick={() => void like(true)}
            >
              Önceki beğenimi kaldır
            </button>
          )}
        </>
      ) : (
        <Link
          className="button secondary"
          href={`/login?next=${encodeURIComponent(`/posts/${slug}`)}`}
        >
          <Heart size={18} />
          {count} · Beğenmek için giriş yap
        </Link>
      )}
      <button className="button secondary" onClick={() => void share()}>
        <Share2 size={17} />
        Paylaş
      </button>
    </div>
  );
}
