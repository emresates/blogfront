"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { AdminUser } from "@/types/user";
import { getUserById } from "@/lib/api/users";
import { errorMessage } from "@/lib/api/client";
import { LoadingSkeleton } from "@/components/ui/primitives";
import { initials, date } from "@/lib/utils";
import { UserRoleBadge, UserStatusBadge } from "./UserBadges";
import { UserActions, type UserAction } from "./UserActions";
import { UserMutationDialog } from "./UserMutationDialog";
export function UserDetail({ id }: { id: number }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [action, setAction] = useState<UserAction | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    getUserById(id, controller.signal)
      .then((res) => {
        if (!controller.signal.aborted) {
          setUser(res.data);
          setError("");
        }
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(errorMessage(e));
      });
    return () => controller.abort();
  }, [id, revision]);
  return (
    <>
      <Link href="/admin/users" className="text-link muted">
        <ArrowLeft size={16} />
        Users
      </Link>
      {error ? (
        <div className="notice" role="alert">
          <p>{error}</p>
          <button
            className="text-link"
            onClick={() => {
              setError("");
              setRevision((r) => r + 1);
            }}
          >
            Tekrar dene
          </button>
        </div>
      ) : !user ? (
        <LoadingSkeleton />
      ) : (
        <section className="user-detail">
          <div className="section-heading">
            <div className="user-identity">
              <span className="avatar">{initials(user.name)}</span>
              <div>
                <div className="eyebrow">USER DETAILS</div>
                <h1>{user.name}</h1>
              </div>
            </div>
            <UserActions target={user} busy={!!action} onAction={setAction} />
          </div>
          <dl className="user-detail-grid">
            <div>
              <dt>Name</dt>
              <dd>{user.name}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>
                <UserRoleBadge role={user.role} />
              </dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <UserStatusBadge active={user.isActive} />
              </dd>
            </div>
            <div>
              <dt>Created At</dt>
              <dd>{date(user.createdAt)}</dd>
            </div>
            <div>
              <dt>User ID</dt>
              <dd>#{user.id}</dd>
            </div>
          </dl>
        </section>
      )}
      {action && (
        <UserMutationDialog
          action={action}
          onClose={() => setAction(null)}
          onSuccess={(updated) => {
            setUser(updated);
            setRevision((r) => r + 1);
          }}
        />
      )}
    </>
  );
}
