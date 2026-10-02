import Link from "next/link";
import type { PaginationMeta } from "@/types";
export function Pagination({
  meta,
  query,
}: {
  meta: PaginationMeta;
  query: Record<string, string>;
}) {
  if (meta.totalPages <= 1) return null;
  const href = (page: number) =>
    `/posts?${new URLSearchParams({ ...query, page: String(page) })}`;
  return (
    <nav className="pagination" aria-label="Sayfalar">
      {meta.page > 1 ? (
        <Link className="button secondary" href={href(meta.page - 1)}>
          ← Önceki
        </Link>
      ) : (
        <span />
      )}
      <span>
        {meta.page} / {meta.totalPages}
      </span>
      {meta.page < meta.totalPages ? (
        <Link className="button secondary" href={href(meta.page + 1)}>
          Sonraki →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
