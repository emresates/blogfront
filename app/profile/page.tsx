"use client";
import { Guard } from "@/components/auth/guard";
import { useAuth } from "@/components/auth/auth-provider";
import { initials } from "@/lib/utils";
export default function Profile() {
  const { user } = useAuth();
  return (
    <div className="container page-space">
      <Guard>
        {user && (
          <div className="profile">
            <span className="avatar">{initials(user.name)}</span>
            <div className="eyebrow">PROFİLİM</div>
            <h1>{user.name}</h1>
            <p>{user.email}</p>
            <span className="badge">{user.role}</span>
          </div>
        )}
      </Guard>
    </div>
  );
}
