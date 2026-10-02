"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "./auth-provider";
import type { Role } from "@/types";
import { LoadingSkeleton } from "@/components/ui/primitives";
export function Guard({
  roles,
  children,
}: {
  roles?: Role[];
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const path = usePathname();
  useEffect(() => {
    if (!loading && !user)
      router.replace(`/login?next=${encodeURIComponent(path)}`);
  }, [loading, user, router, path]);
  if (loading || !user) return <LoadingSkeleton />;
  if (roles && !roles.includes(user.role))
    return (
      <div className="empty">
        <div className="eyebrow">403 / YETKİ GEREKİYOR</div>
        <h1>Bu alan sana açık değil.</h1>
        <p>Bu sayfayı görüntülemek için uygun bir rol gerekiyor.</p>
        <Link className="button" href="/">
          Ana sayfaya dön
        </Link>
      </div>
    );
  return <>{children}</>;
}
