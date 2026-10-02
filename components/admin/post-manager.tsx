"use client";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import type { Post, PaginationMeta } from "@/types";
import { postsApi, allPosts } from "@/lib/api/posts";
import { errorMessage } from "@/lib/api/client";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/components/ui/providers";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  LoadingSkeleton,
  EmptyState,
  ErrorState,
} from "@/components/ui/primitives";
import { date } from "@/lib/utils";
export function PostManager({
  author = false,
  moderation = false,
}: {
  author?: boolean;
  moderation?: boolean;
}) {
  const { user } = useAuth();
  const toast = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<Post | null>(null);
  const [busy, setBusy] = useState(false);
  const base = author ? "/dashboard" : "/admin";
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (author) {
        const own = (await allPosts()).filter(
          (p) => String(p.userId) === String(user?.userId),
        );
        setPosts(own.slice((page - 1) * 12, page * 12));
        setMeta({
          page,
          pageSize: 12,
          totalCount: own.length,
          totalPages: Math.ceil(own.length / 12),
        });
      } else {
        const res = await postsApi.list(`page=${page}&pageSize=12`);
        setPosts(res.data);
        setMeta(res.pagination);
      }
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [author, user?.userId, page]);
  useEffect(() => {
    // Initial remote-data synchronization; subsequent mutations reuse this loader.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);
  async function remove() {
    if (!deleting || busy) return;
    setBusy(true);
    try {
      await postsApi.remove(deleting.id);
      setDeleting(null);
      toast("Yazı silindi.");
      await load();
    } catch (e) {
      toast(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="section-heading">
        <div>
          <div className="eyebrow">İÇERİK YÖNETİMİ</div>
          <h1>
            {moderation ? "Yorumlar" : author ? "Yazılarım" : "Yazılar"}
            <span className="brand-dot">.</span>
          </h1>
        </div>
        {!moderation && (
          <Link className="button" href={`${base}/posts/new`}>
            + Yeni yazı
          </Link>
        )}
      </div>
      {moderation && (
        <p className="notice">
          Yorumları yazı bazında yönet. Bir yazıyı açarak yorumları
          düzenleyebilir veya silebilirsin.
        </p>
      )}
      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState message={error} />
      ) : posts.length === 0 ? (
        <EmptyState title={author ? "İlk yazını paylaş." : "Henüz yazı yok."} />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Yazı / Yazar</th>
                <th>Kategoriler</th>
                <th>Görüntülenme</th>
                <th>Beğeni</th>
                <th>Yorum</th>
                <th>Tarih</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.title}</strong>
                    <div className="muted small">{p.authorName}</div>
                  </td>
                  <td>{p.categories?.map((c) => c.name).join(", ") || "—"}</td>
                  <td>{p.viewCount}</td>
                  <td>{p.likeCount}</td>
                  <td>{p.commentCount}</td>
                  <td className="small">{date(p.createdAt)}</td>
                  <td>
                    <div className="table-actions">
                      <Link prefetch={false} href={`/posts/${p.slug}`}>
                        {moderation ? "Yorumları yönet" : "Görüntüle"}
                      </Link>
                      {!moderation && (
                        <>
                          <Link href={`${base}/posts/${p.id}/edit`}>
                            Düzenle
                          </Link>
                          <button
                            className="danger-text"
                            onClick={() => setDeleting(p)}
                          >
                            Sil
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {meta && meta.totalPages > 1 && (
        <div className="pagination">
          <button
            className="button secondary"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Önceki
          </button>
          <span>
            {page} / {meta.totalPages}
          </span>
          <button
            className="button secondary"
            disabled={page >= meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Sonraki
          </button>
        </div>
      )}
      <ConfirmDialog
        open={!!deleting}
        title="Yazı silinsin mi?"
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={() => void remove()}
      />
    </>
  );
}
