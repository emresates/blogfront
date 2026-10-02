"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import {
  ArrowUpRight,
  Search,
  Sun,
  Moon,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/components/ui/providers";
import { isAdmin } from "@/lib/auth/roles";
import { initials } from "@/lib/utils";
export function Navbar() {
  const { user, loading, logout } = useAuth();
  const toast = useToast();
  const pathname = usePathname();
  const [mobile, setMobile] = useState(false);
  const dark = useSyncExternalStore(
    subscribeTheme,
    () => document.documentElement.dataset.theme === "dark",
    () => false,
  );
  function toggle() {
    const next = !dark;
    document.documentElement.dataset.theme = next ? "dark" : "light";
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
    window.dispatchEvent(new Event("theme-change"));
  }
  return (
    <header className="header">
      <div className="container nav">
        <Link className="brand" href="/" aria-label="Margin ana sayfa">
          <span className="brand-icon">
            m<span>·</span>
          </span>
          margin<span className="brand-dot">.</span>
        </Link>
        <nav className="desktop-nav" aria-label="Ana menü">
          {[
            ["/", "Ana sayfa"],
            ["/posts", "Keşfet"],
            ["/categories", "Kategoriler"],
          ].map(([href, label]) => (
            <Link
              className={pathname === href ? "active" : ""}
              href={href}
              key={href}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="nav-actions">
          <Link
            className="icon-button"
            href="/posts#search"
            aria-label="Yazı ara"
          >
            <Search size={19} />
          </Link>
          <button
            className="icon-button"
            onClick={toggle}
            aria-label={dark ? "Açık temaya geç" : "Koyu temaya geç"}
          >
            {dark ? <Sun size={19} /> : <Moon size={19} />}
          </button>
          <span className="nav-divider" />
          {loading ? (
            <span className="muted small">…</span>
          ) : user ? (
            <details className="user-menu">
              <summary>
                <span className="avatar small-avatar">
                  {initials(user.name)}
                </span>
                <ChevronDown size={14} />
              </summary>
              <div className="dropdown">
                <strong>{user.name}</strong>
                <Link href="/profile">Profilim</Link>
                {isAdmin(user.role) && (
                  <Link href="/admin">Yönetim paneli</Link>
                )}
                {user.role === "Author" && (
                  <Link href="/dashboard">Yazar paneli</Link>
                )}
                <button
                  onClick={() => void logout().catch((e) => toast(e.message))}
                >
                  Çıkış yap
                </button>
              </div>
            </details>
          ) : (
            <div className="auth-links">
              <Link href="/login">Giriş yap</Link>
              <Link className="button compact" href="/register">
                Aramıza katıl <ArrowUpRight size={16} />
              </Link>
            </div>
          )}
          <button
            className="icon-button mobile-toggle"
            onClick={() => setMobile(!mobile)}
            aria-expanded={mobile}
            aria-label="Menüyü aç"
          >
            {mobile ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {mobile && (
        <nav className="mobile-nav" aria-label="Mobil menü">
          {[
            ["/", "Ana sayfa"],
            ["/posts", "Keşfet"],
            ["/categories", "Kategoriler"],
            ...(!user
              ? [
                  ["/login", "Giriş yap"],
                  ["/register", "Aramıza katıl"],
                ]
              : []),
          ].map(([href, label]) => (
            <Link href={href} key={href} onClick={() => setMobile(false)}>
              {label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}

function subscribeTheme(callback: () => void) {
  window.addEventListener("theme-change", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("theme-change", callback);
    window.removeEventListener("storage", callback);
  };
}
