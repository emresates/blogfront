"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import type { AdminUser } from "@/types/user";
import type { PaginationMeta } from "@/types";
import { getUsers } from "@/lib/api/users";
import { readUserQuery } from "@/lib/api/user-query";
import { errorMessage } from "@/lib/api/client";
import { LoadingSkeleton, EmptyState } from "@/components/ui/primitives";
import { UserFilters } from "./UserFilters";
import { UserTable } from "./UserTable";
import { UserMutationDialog } from "./UserMutationDialog";
import type { UserAction } from "./UserActions";
export function UserList() {
  const params = useSearchParams();
  return <UserListContent key={params.toString()} query={params.toString()} />;
}
function UserListContent({ query }: { query: string }) {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [action, setAction] = useState<UserAction | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    getUsers(readUserQuery(new URLSearchParams(query)), controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        const page = readUserQuery(new URLSearchParams(query)).page ?? 1;
        if (res.pagination && page > Math.max(1, res.pagination.totalPages)) {
          const q = new URLSearchParams(query);
          q.set("page", String(Math.max(1, res.pagination.totalPages)));
          router.replace(`/admin/users?${q}`, { scroll: false });
          return;
        }
        setUsers(res.data);
        setMeta(res.pagination);
        setError("");
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(errorMessage(e));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [query, revision, router]);
  function pageLink(page: number) {
    const q = new URLSearchParams(query);
    q.set("page", String(page));
    return `/admin/users?${q}`;
  }
  return (
    <>
      <div className="section-heading">
        <div>
          <div className="eyebrow">ACCOUNT MANAGEMENT</div>
          <h1>
            Users<span className="brand-dot">.</span>
          </h1>
          <p className="muted">Manage user roles and account access.</p>
        </div>
        {meta && <span className="badge">{meta.totalCount} users</span>}
      </div>
      <UserFilters />
      {error && (
        <div className="notice" role="alert">
          <p>{error}</p>
          <button
            className="text-link"
            onClick={() => {
              setLoading(true);
              setRevision((r) => r + 1);
            }}
          >
            Tekrar dene
          </button>
        </div>
      )}
      {loading ? (
        <LoadingSkeleton />
      ) : (
        !error &&
        (users.length ? (
          <UserTable users={users} busy={!!action} onAction={setAction} />
        ) : (
          <EmptyState
            title="Kullanıcı bulunamadı."
            description="Arama veya filtreleri değiştirerek tekrar deneyebilirsin."
            action={
              <Link className="text-link" href="/admin/users">
                Filtreleri temizle
              </Link>
            }
          />
        ))
      )}
      {!loading && !error && meta && meta.totalPages > 1 && (
        <nav className="pagination" aria-label="Kullanıcı sayfaları">
          {meta.page > 1 ? (
            <Link className="button secondary" href={pageLink(meta.page - 1)}>
              ← Previous
            </Link>
          ) : (
            <span />
          )}
          <span>
            {meta.page} / {meta.totalPages}
          </span>
          {meta.page < meta.totalPages ? (
            <Link className="button secondary" href={pageLink(meta.page + 1)}>
              Next →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
      {action && (
        <UserMutationDialog
          action={action}
          onClose={() => setAction(null)}
          onSuccess={(updated) => {
            setUsers((rows) =>
              rows.map((row) => (row.id === updated.id ? updated : row)),
            );
            setRevision((r) => r + 1);
          }}
        />
      )}
    </>
  );
}
