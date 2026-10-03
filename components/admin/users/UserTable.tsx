import Link from "next/link";
import type { AdminUser } from "@/types/user";
import { initials, date } from "@/lib/utils";
import { UserRoleBadge, UserStatusBadge } from "./UserBadges";
import { UserActions, type UserAction } from "./UserActions";
export function UserTable({
  users,
  busy,
  onAction,
}: {
  users: AdminUser[];
  busy: boolean;
  onAction: (action: UserAction) => void;
}) {
  return (
    <div className="users-table-wrap">
      <table className="users-table">
        <thead>
          <tr>
            {["User", "Email", "Role", "Status", "Created At", "Actions"].map(
              (h) => (
                <th key={h} scope="col">
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td data-label="User">
                <Link
                  className="user-identity"
                  href={`/admin/users/${user.id}`}
                >
                  <span className="avatar">{initials(user.name)}</span>
                  <span>
                    <strong>{user.name}</strong>
                    <span className="small muted user-id">#{user.id}</span>
                  </span>
                </Link>
              </td>
              <td data-label="Email" className="user-email">
                {user.email}
              </td>
              <td data-label="Role">
                <UserRoleBadge role={user.role} />
              </td>
              <td data-label="Status">
                <UserStatusBadge active={user.isActive} />
              </td>
              <td data-label="Created At">{date(user.createdAt)}</td>
              <td data-label="Actions">
                <UserActions target={user} busy={busy} onAction={onAction} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
