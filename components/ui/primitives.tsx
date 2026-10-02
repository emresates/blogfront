import Link from "next/link";
import { ArrowUpRight, BookOpen } from "lucide-react";
export function EmptyState({
  title = "Henüz bir yazı yok",
  description = "Yeni fikirler burada yerini alacak. Yakında tekrar uğra.",
  action,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty">
      <BookOpen size={28} />
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function ErrorState({ message }: { message: string }) {
  return (
    <div className="notice" role="alert">
      <strong>İçerik yüklenemedi</strong>
      <p>{message}</p>
      <Link href="/posts">
        Yazıları tekrar aç <ArrowUpRight size={15} />
      </Link>
    </div>
  );
}
export function LoadingSkeleton() {
  return (
    <div className="post-grid" aria-label="Yükleniyor" aria-busy="true">
      {[1, 2, 3].map((i) => (
        <div className="skeleton" key={i}>
          <div />
          <div />
          <div />
        </div>
      ))}
    </div>
  );
}
export function Field({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input {...props} />
    </label>
  );
}
export function Textarea({
  label,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea {...props} />
    </label>
  );
}
