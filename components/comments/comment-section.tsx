"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import type { Comment } from "@/types";
import { commentsApi, createCommentReply } from "@/lib/api/comments";
import { errorMessage } from "@/lib/api/client";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/components/ui/providers";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Textarea } from "@/components/ui/primitives";
import { CommentItem } from "./CommentItem";
import { countComments, removeComment } from "@/lib/utils/comments";
export function CommentSection({ postId }: { postId: number }) {
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [content, setContent] = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);
  const lock = useRef(false);
  const requestId = useRef(0);
  const load = useCallback(() => {
    const request = ++requestId.current;
    return commentsApi
      .list(postId)
      .then((response) => {
        if (request === requestId.current) {
          setComments(response.data);
          setError("");
        }
      })
      .catch((e) => {
        if (request === requestId.current) setError(errorMessage(e));
      })
      .finally(() => {
        if (request === requestId.current) setLoading(false);
      });
  }, [postId]);
  useEffect(() => {
    const tracker = requestId;
    void load();
    return () => {
      tracker.current++;
    };
  }, [load]);
  async function mutate(
    action: () => Promise<unknown>,
    message: string,
    after?: () => void,
  ) {
    if (lock.current)
      throw new Error("Lütfen devam eden işlemin bitmesini bekle.");
    if (!user) throw new Error("Bu işlem için giriş yapmalısın.");
    lock.current = true;
    setBusy(true);
    try {
      await action();
      after?.();
      toast(message);
      await load();
    } catch (e) {
      toast(errorMessage(e));
      throw e;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || lock.current) return;
    try {
      await mutate(
        () => commentsApi.create(postId, content.trim()),
        "Yorum başarıyla eklendi.",
        () => setContent(""),
      );
    } catch {
      /* error is shown by mutate */
    }
  }
  async function remove() {
    if (deleting === null || lock.current) return;
    const id = deleting;
    try {
      await mutate(
        () => commentsApi.remove(id),
        "Yorum silindi.",
        () => {
          setComments((tree) => removeComment(tree, id));
          setDeleting(null);
        },
      );
    } catch {
      /* keep confirmation open on failure */
    }
  }
  return (
    <section className="comments">
      <div className="section-heading">
        <h2>
          Sohbete katıl<span className="brand-dot">.</span>
        </h2>
        <span className="badge">{countComments(comments)} yorum</span>
      </div>
      {authLoading ? (
        <p className="muted small" role="status">
          Oturum kontrol ediliyor…
        </p>
      ) : user ? (
        <form className="comment-form" onSubmit={create}>
          <Textarea
            label="Sen ne düşünüyorsun?"
            placeholder="Bir fikir, bir soru, yeni bir bakış açısı…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            maxLength={10000}
            rows={4}
            disabled={busy}
          />
          <button className="button" disabled={busy || !content.trim()}>
            {busy ? "İşleniyor…" : "Yorum gönder"}
          </button>
        </form>
      ) : (
        <div className="notice">
          Sohbete katılmak için <Link href="/login">giriş yap</Link> veya{" "}
          <Link href="/register">hesap oluştur</Link>.
        </div>
      )}
      {error && (
        <div role="alert" className="form-error">
          {error}{" "}
          <button
            className="text-link"
            disabled={busy}
            onClick={() => void load()}
          >
            Tekrar dene
          </button>
        </div>
      )}
      {loading ? (
        <p aria-busy="true">Yorumlar yükleniyor…</p>
      ) : comments.length === 0 ? (
        !error && (
          <p className="empty-comment">
            İlk yorumu sen yaz. Güzel bir sohbet tek bir cümleyle başlar.
          </p>
        )
      ) : (
        <ul className="comment-tree">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUser={user}
              busy={busy}
              onReply={(id, text) =>
                mutate(() => createCommentReply(id, text), "Yanıt eklendi.")
              }
              onUpdated={(id, text) =>
                mutate(() => commentsApi.update(id, text), "Yorum güncellendi.")
              }
              onDeleted={setDeleting}
            />
          ))}
        </ul>
      )}
      <ConfirmDialog
        open={deleting !== null}
        title="Yorum ve varsa yanıtları silinsin mi?"
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={() => void remove()}
      />
    </section>
  );
}
