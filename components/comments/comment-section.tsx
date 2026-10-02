"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { Comment } from "@/types";
import { commentsApi } from "@/lib/api/comments";
import { errorMessage } from "@/lib/api/client";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/components/ui/providers";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Textarea } from "@/components/ui/primitives";
import { isAdmin } from "@/lib/auth/roles";
import { date, initials } from "@/lib/utils";
export function CommentSection({ postId }: { postId: number }) {
  const { user } = useAuth();
  const toast = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [content, setContent] = useState("");
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);
  const load = useCallback(async () => {
    setError("");
    try {
      setComments((await commentsApi.list(postId)).data);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [postId]);
  useEffect(() => {
    // Initial remote-data synchronization; subsequent mutations reuse this loader.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);
  async function save(edit = false) {
    if (busy) return;
    const text = (edit ? draft : content).trim();
    if (!text) return;
    setBusy(true);
    try {
      if (edit && editing !== null) await commentsApi.update(editing, text);
      else await commentsApi.create(postId, text);
      setContent("");
      setEditing(null);
      await load();
      toast(edit ? "Yorum güncellendi." : "Yorum başarıyla eklendi.");
    } catch (e) {
      toast(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (deleting === null || busy) return;
    setBusy(true);
    try {
      await commentsApi.remove(deleting);
      setComments((c) => c.filter((x) => x.id !== deleting));
      setDeleting(null);
      toast("Yorum silindi.");
    } catch (e) {
      toast(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="comments">
      <div className="section-heading">
        <h2>
          Sohbete katıl<span className="brand-dot">.</span>
        </h2>
        <span className="badge">{comments.length} yorum</span>
      </div>
      {user ? (
        <form
          className="comment-form"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <Textarea
            label="Sen ne düşünüyorsun?"
            placeholder="Bir fikir, bir soru, yeni bir bakış açısı…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            maxLength={10000}
            rows={4}
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
      {loading ? (
        <p aria-busy="true">Yorumlar yükleniyor…</p>
      ) : error ? (
        <div role="alert" className="form-error">
          {error}
          <button onClick={() => void load()}>Tekrar dene</button>
        </div>
      ) : comments.length === 0 ? (
        <p className="empty-comment">
          İlk yorumu sen yaz. Güzel bir sohbet tek bir cümleyle başlar.
        </p>
      ) : (
        comments.map((c) => (
          <article className="comment" key={c.id}>
            <span className="avatar">{initials(c.userName || "U")}</span>
            <div className="comment-body">
              <div className="comment-heading">
                <strong>{c.userName}</strong>
                <time className="muted small">{date(c.createdAt)}</time>
              </div>
              {editing === c.id ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void save(true);
                  }}
                >
                  <Textarea
                    label="Yorumu düzenle"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    required
                    rows={3}
                  />
                  <div className="actions">
                    <button
                      disabled={busy || !draft.trim()}
                      className="button compact"
                    >
                      Kaydet
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setEditing(null)}
                      className="text-link"
                    >
                      Vazgeç
                    </button>
                  </div>
                </form>
              ) : (
                <p className="plain-text">{c.content}</p>
              )}
              {user &&
                (String(user.userId) === String(c.userId) ||
                  isAdmin(user.role)) && (
                  <div className="actions small">
                    <button
                      disabled={busy}
                      className="text-link"
                      onClick={() => {
                        setEditing(c.id);
                        setDraft(c.content);
                      }}
                    >
                      Düzenle
                    </button>
                    <button
                      disabled={busy}
                      className="text-link danger-text"
                      onClick={() => setDeleting(c.id)}
                    >
                      Sil
                    </button>
                  </div>
                )}
            </div>
          </article>
        ))
      )}
      <ConfirmDialog
        open={deleting !== null}
        title="Yorum silinsin mi?"
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={() => void remove()}
      />
    </section>
  );
}
