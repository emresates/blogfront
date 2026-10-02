"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import type { Category } from "@/types";
import { categoriesApi } from "@/lib/api/categories";
import { errorMessage } from "@/lib/api/client";
import { useToast } from "@/components/ui/providers";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Field,
  EmptyState,
  LoadingSkeleton,
  ErrorState,
} from "@/components/ui/primitives";
export function CategoryManager() {
  const toast = useToast();
  const dialog = useRef<HTMLDialogElement>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const load = useCallback(async () => {
    try {
      setCategories((await categoriesApi.list()).data);
      setError("");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    // Initial remote-data synchronization; subsequent mutations reuse this loader.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);
  function open(category: Category | null) {
    setEditing(category);
    setName(category?.name || "");
    setFormError("");
    dialog.current?.showModal();
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !name.trim()) return;
    setBusy(true);
    try {
      if (editing) await categoriesApi.update(editing.id, name.trim());
      else await categoriesApi.create(name.trim());
      dialog.current?.close();
      toast("Kategori kaydedildi.");
      await load();
    } catch (e) {
      setFormError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!deleting || busy) return;
    setBusy(true);
    try {
      await categoriesApi.remove(deleting.id);
      setDeleting(null);
      toast("Kategori silindi.");
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
        <h1>
          Kategoriler<span className="brand-dot">.</span>
        </h1>
        <button className="button" onClick={() => open(null)}>
          + Yeni kategori
        </button>
      </div>
      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState message={error} />
      ) : categories.length ? (
        <div className="category-list">
          {categories.map((c) => (
            <div key={c.id}>
              <strong>{c.name}</strong>
              <div className="actions">
                <button className="text-link" onClick={() => open(c)}>
                  Düzenle
                </button>
                <button
                  className="text-link danger-text"
                  onClick={() => setDeleting(c)}
                >
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Konulara bir yer aç."
          description="İlk kategorini oluşturarak yazıları düzenlemeye başla."
        />
      )}
      <dialog
        ref={dialog}
        onCancel={(e) => {
          if (busy) e.preventDefault();
        }}
      >
        <h2>{editing ? "Kategoriyi düzenle" : "Yeni kategori"}</h2>
        <form onSubmit={save}>
          <Field
            label="Kategori adı"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={100}
            autoFocus
          />
          {formError && (
            <p role="alert" className="form-error">
              {formError}
            </p>
          )}
          <div className="actions">
            <button className="button" disabled={busy || !name.trim()}>
              {busy ? "Kaydediliyor…" : "Kaydet"}
            </button>
            <button
              className="button secondary"
              type="button"
              disabled={busy}
              onClick={() => dialog.current?.close()}
            >
              Vazgeç
            </button>
          </div>
        </form>
      </dialog>
      <ConfirmDialog
        open={!!deleting}
        title="Kategori silinsin mi?"
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={() => void remove()}
      />
    </>
  );
}
