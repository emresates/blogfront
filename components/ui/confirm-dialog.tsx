"use client";
import { useEffect, useRef } from "react";
export function ConfirmDialog({
  open,
  title,
  busy,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open) ref.current?.showModal();
    else ref.current?.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onCancel();
      }}
    >
      <h2>{title}</h2>
      <p>Bu işlem geri alınamaz. Devam etmek istiyor musun?</p>
      <div className="actions">
        <button
          className="button secondary"
          disabled={busy}
          onClick={onCancel}
          autoFocus
        >
          Vazgeç
        </button>
        <button className="button danger" disabled={busy} onClick={onConfirm}>
          {busy ? "Siliniyor…" : "Evet, sil"}
        </button>
      </div>
    </dialog>
  );
}
