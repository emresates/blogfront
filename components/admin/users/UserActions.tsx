"use client";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import type { AdminUser } from "@/types/user";
import { useAuth } from "@/components/auth/auth-provider";
import { managementReason } from "@/lib/auth/user-management";
export type UserAction = { target: AdminUser; kind: "role" | "status" };
export function UserActions({
  target,
  busy,
  onAction,
}: {
  target: AdminUser;
  busy: boolean;
  onAction: (action: UserAction) => void;
}) {
  const { user } = useAuth();
  const reason = managementReason(user, target);
  return (
    <details className="user-row-menu">
      <summary aria-label={`${target.name} için işlemler`}>
        <MoreHorizontal size={20} />
      </summary>
      <div className="user-row-dropdown">
        <Link href={`/admin/users/${target.id}`}>View details</Link>
        <button
          type="button"
          disabled={busy || !!reason}
          title={reason ?? undefined}
          onClick={(e) => {
            e.currentTarget.closest("details")?.removeAttribute("open");
            onAction({ target, kind: "role" });
          }}
        >
          Change role
        </button>
        <button
          type="button"
          className={target.isActive ? "danger-text" : ""}
          disabled={busy || !!reason}
          title={reason ?? undefined}
          onClick={(e) => {
            e.currentTarget.closest("details")?.removeAttribute("open");
            onAction({ target, kind: "status" });
          }}
        >
          {target.isActive ? "Disable account" : "Enable account"}
        </button>
        {reason && <p className="small muted">{reason}</p>}
      </div>
    </details>
  );
}
