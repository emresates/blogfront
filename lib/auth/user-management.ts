import type { CurrentUser } from "../../types/index";
import type { AdminUser, UserRole } from "../../types/user";
export const userRoles: UserRole[] = ["User", "Author", "Admin", "SuperAdmin"];
export function managementReason(
  actor: CurrentUser | null,
  target: AdminUser,
): string | null {
  if (!actor || !["Admin", "SuperAdmin"].includes(actor.role))
    return "Bu işlem için yetkiniz yok.";
  if (String(actor.userId) === String(target.id))
    return "Kendi rolünü veya hesap durumunu değiştiremezsin.";
  if (actor.role === "Admin" && ["Admin", "SuperAdmin"].includes(target.role))
    return "Admin, Admin veya SuperAdmin hesaplarını yönetemez.";
  return null;
}
export function assignableRoles(actor: CurrentUser | null): UserRole[] {
  return actor?.role === "SuperAdmin"
    ? userRoles
    : actor?.role === "Admin"
      ? ["User", "Author"]
      : [];
}
