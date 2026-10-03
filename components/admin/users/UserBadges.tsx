import type { UserRole } from "@/types/user";
export function UserRoleBadge({ role }: { role: UserRole }) {
  return (
    <span className={`badge user-role role-${role.toLowerCase()}`}>{role}</span>
  );
}
export function UserStatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`badge user-status ${active ? "status-active" : "status-disabled"}`}
    >
      <span aria-hidden="true">●</span>
      {active ? "Active" : "Disabled"}
    </span>
  );
}
