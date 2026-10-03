"use client";
import { useEffect, useRef, useState, useId } from "react";
import type { AdminUser, UserRole } from "@/types/user";
import type { UserAction } from "./UserActions";
import { assignableRoles, managementReason } from "@/lib/auth/user-management";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/components/ui/providers";
import { changeUserRole, changeUserStatus } from "@/lib/api/users";
import { errorMessage } from "@/lib/api/client";
export function UserMutationDialog({
  action,
  onClose,
  onSuccess,
}: {
  action: UserAction;
  onClose: () => void;
  onSuccess: (user: AdminUser) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const lock = useRef(false);
  const label = useId();
  const { user } = useAuth();
  const toast = useToast();
  const [role, setRole] = useState<UserRole>(action.target.role);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const target = action.target;
  const roleChange = action.kind === "role";
  const reason = managementReason(user, target);
  const options = assignableRoles(user);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (lock.current || reason) return;
    if (roleChange && (!options.includes(role) || role === target.role)) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      if (roleChange) await changeUserRole(target.id, role);
      else await changeUserStatus(target.id, !target.isActive);
      // Apply only after the backend confirms the mutation. The list revalidates afterwards.
      onSuccess({
        ...target,
        ...(roleChange ? { role } : { isActive: !target.isActive }),
      });
      toast(
        roleChange
          ? "Kullanıcı rolü güncellendi."
          : target.isActive
            ? "Kullanıcı devre dışı bırakıldı."
            : "Kullanıcı tekrar aktif edildi.",
      );
      onClose();
    } catch (e) {
      const message = errorMessage(e);
      setError(message);
      toast(message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <dialog
      ref={ref}
      aria-labelledby={label}
      onCancel={(e) => {
        e.preventDefault();
        if (!lock.current) onClose();
      }}
    >
      <form onSubmit={submit}>
        <h2 id={label}>
          {roleChange
            ? "Kullanıcı rolünü değiştir"
            : target.isActive
              ? "Hesabı devre dışı bırak"
              : "Hesabı aktif et"}
        </h2>
        <p>
          <strong>{target.name}</strong> · {target.email}
        </p>
        {roleChange ? (
          <>
            <label className="field">
              <span>Yeni rol</span>
              <select
                value={role}
                disabled={busy || !!reason}
                onChange={(e) => setRole(e.target.value as UserRole)}
              >
                {options.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            <p>
              {target.name} kullanıcısının rolünü {role} olarak değiştirmek
              istediğine emin misin?
            </p>
          </>
        ) : (
          <p>
            {target.isActive
              ? "Bu hesabı devre dışı bırakmak istediğine emin misin? Kullanıcı yeni giriş yapamayacaktır."
              : "Kullanıcı hesabını tekrar aktif etmek istediğine emin misin?"}
          </p>
        )}
        {(reason || error) && (
          <p className="form-error" role="alert">
            {reason || error}
          </p>
        )}
        <div className="actions">
          <button
            type="button"
            className="button secondary"
            autoFocus
            disabled={busy}
            onClick={onClose}
          >
            Vazgeç
          </button>
          <button
            className={`button ${!roleChange && target.isActive ? "danger" : ""}`}
            disabled={busy || !!reason || (roleChange && role === target.role)}
          >
            {busy ? "Kaydediliyor…" : "Değişikliği onayla"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
