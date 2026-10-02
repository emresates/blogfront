"use client";
import { useEffect, useState } from "react";
import type { JSONContent } from "@tiptap/react";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import {
  emptyRichText,
  getPlainTextFromTiptap,
  isValidTiptapContent,
} from "@/lib/utils/richText";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Category } from "@/types";
import { postsApi, allPosts } from "@/lib/api/posts";
import { categoriesApi } from "@/lib/api/categories";
import { errorMessage } from "@/lib/api/client";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/components/ui/providers";
import { Field, LoadingSkeleton, ErrorState } from "@/components/ui/primitives";
export function PostEditor({
  id,
  author = false,
}: {
  id?: number;
  author?: boolean;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState<JSONContent>(emptyRichText);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const base = author ? "/dashboard" : "/admin";
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const cats = await categoriesApi.list();
        let post;
        if (id !== undefined) {
          post = (await allPosts()).find((p) => p.id === id);
          if (!post) throw new Error("Yazı bulunamadı.");
          if (author && String(post.userId) !== String(user?.userId))
            throw new Error("Bu yazıyı düzenleme yetkiniz yok.");
        }
        if (active) {
          setCategories(cats.data);
          if (post) {
            setTitle(post.title);
            setContent(
              isValidTiptapContent(post.content)
                ? post.content
                : emptyRichText(),
            );
            setSelected(post.categories.map((c) => c.id));
          }
        }
      } catch (e) {
        if (active) setLoadError(errorMessage(e));
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [id, author, user?.userId]);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const input = {
        title: title.trim(),
        content,
        categoryIds: selected,
      };
      if (input.title.length < 3)
        throw new Error("Başlık en az 3 karakter olmalı.");
      if (!getPlainTextFromTiptap(input.content))
        throw new Error("İçerik boş olamaz.");
      if (!input.categoryIds.length)
        throw new Error("En az bir kategori seçmelisin.");
      if (id !== undefined) await postsApi.update(id, input);
      else await postsApi.create(input);
      toast(id ? "Yazı güncellendi." : "Yazı yayınlandı.");
      router.push(`${base}/posts`);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  if (loading) return <LoadingSkeleton />;
  if (loadError) return <ErrorState message={loadError} />;
  return (
    <>
      <div className="eyebrow">EDİTÖR</div>
      <h1>
        {id ? "Yazıyı düzenle" : "Yeni bir fikir"}
        <span className="brand-dot">.</span>
      </h1>
      <form className="editor-form" onSubmit={submit}>
        <Field
          label="Başlık"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          minLength={3}
          disabled={busy}
          maxLength={250}
          placeholder="İyi bir hikâye, bir başlıkla başlar."
        />
        <RichTextEditor value={content} onChange={setContent} disabled={busy} />
        <p className="small muted">
          Başlıklar, listeler ve bağlantılarla yazını zenginleştir.
        </p>
        <fieldset disabled={busy}>
          <legend>Kategoriler</legend>
          <div className="category-options">
            {categories.length ? (
              categories.map((c) => (
                <label key={c.id} className="checkbox">
                  <input
                    type="checkbox"
                    checked={selected.includes(c.id)}
                    onChange={(e) =>
                      setSelected((s) =>
                        e.target.checked
                          ? [...s, c.id]
                          : s.filter((x) => x !== c.id),
                      )
                    }
                  />
                  {c.name}
                </label>
              ))
            ) : (
              <p className="muted">Henüz kategori oluşturulmamış.</p>
            )}
          </div>
        </fieldset>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <div className="actions">
          <button className="button" disabled={busy}>
            {busy
              ? "Kaydediliyor…"
              : id
                ? "Değişiklikleri kaydet"
                : "Yazıyı yayınla"}
          </button>
          <Link className="text-link" href={`${base}/posts`}>
            Vazgeç
          </Link>
        </div>
      </form>
    </>
  );
}
