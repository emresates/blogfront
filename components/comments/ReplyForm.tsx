"use client";
import { useRef, useState } from "react";
import { Textarea } from "@/components/ui/primitives";
import { errorMessage } from "@/lib/api/client";
export function ReplyForm({
  label,
  initialValue = "",
  submitLabel = "Yanıt gönder",
  onSubmit,
  onCancel,
}: {
  label: string;
  initialValue?: string;
  submitLabel?: string;
  onSubmit: (text: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [text, setText] = useState(initialValue);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (lock.current || !text.trim()) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await onSubmit(text.trim());
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <form className="inline-comment-form" onSubmit={submit}>
      <Textarea
        label={label}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        required
        maxLength={10000}
        disabled={busy}
        autoFocus
      />
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="actions">
        <button className="button compact" disabled={busy || !text.trim()}>
          {busy ? "Gönderiliyor…" : submitLabel}
        </button>
        <button
          type="button"
          className="text-link"
          disabled={busy}
          onClick={onCancel}
        >
          Vazgeç
        </button>
      </div>
    </form>
  );
}
