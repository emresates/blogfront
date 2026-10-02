"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Folder,
  MessageCircle,
  ArrowUpRight,
} from "lucide-react";
import { Guard } from "@/components/auth/guard";
export function AdminShell({
  author = false,
  children,
}: {
  author?: boolean;
  children: React.ReactNode;
}) {
  const path = usePathname();
  const base = author ? "/dashboard" : "/admin";
  const items = [
    { href: base, label: "Genel bakış", icon: LayoutDashboard },
    {
      href: base + "/posts",
      label: author ? "Yazılarım" : "Yazılar",
      icon: FileText,
    },
    ...(!author
      ? [
          { href: base + "/categories", label: "Kategoriler", icon: Folder },
          { href: base + "/comments", label: "Yorumlar", icon: MessageCircle },
        ]
      : []),
  ];
  return (
    <div className="container page-space">
      <Guard
        roles={
          author ? ["Author", "Admin", "SuperAdmin"] : ["Admin", "SuperAdmin"]
        }
      >
        <div className="dashboard">
          <aside className="sidebar">
            <div className="eyebrow">
              {author ? "YAZAR ALANI" : "YÖNETİM ALANI"}
            </div>
            <nav aria-label="Yönetim menüsü">
              {items.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  className={path === href ? "selected" : ""}
                  href={href}
                >
                  <Icon size={18} />
                  {label}
                </Link>
              ))}
            </nav>
            <Link className="text-link small" href="/">
              Siteye dön <ArrowUpRight size={15} />
            </Link>
          </aside>
          <div className="dashboard-content">{children}</div>
        </div>
      </Guard>
    </div>
  );
}
// TODO: Enable when backend role-management endpoints are available.
