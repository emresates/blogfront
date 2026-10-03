"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { userRoles } from "@/lib/auth/user-management";
export function UserFilters() {
  const params = useSearchParams();
  const router = useRouter();
  const current = params.get("search") ?? "";
  const [search, setSearch] = useState(current);
  const query = params.toString();
  useEffect(() => {
    if (search === current) return;
    const timer = setTimeout(() => {
      const q = new URLSearchParams(query);
      if (search.trim()) q.set("search", search.trim());
      else q.delete("search");
      q.delete("page");
      router.replace(`/admin/users?${q}`, { scroll: false });
    }, 350);
    return () => clearTimeout(timer);
  }, [search, current, query, router]);
  function change(key: string, value: string) {
    const q = new URLSearchParams(query);
    if (value) q.set(key, value);
    else q.delete(key);
    if (search.trim()) q.set("search", search.trim());
    else q.delete("search");
    q.delete("page");
    router.replace(`/admin/users?${q}`, { scroll: false });
  }
  return (
    <div className="user-filters">
      <label className="search-field">
        <Search size={18} />
        <input
          aria-label="Ad veya e-posta ara"
          placeholder="Ad veya e-posta ara…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>
      <label className="field">
        <span>Role</span>
        <select
          value={params.get("role") ?? ""}
          onChange={(e) => change("role", e.target.value)}
        >
          <option value="">All roles</option>
          {userRoles.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Status</span>
        <select
          value={params.get("status") ?? ""}
          onChange={(e) => change("status", e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
        </select>
      </label>
      <label className="field">
        <span>Page size</span>
        <select
          value={params.get("pageSize") ?? "20"}
          onChange={(e) => change("pageSize", e.target.value)}
        >
          {[10, 20, 50, 100].map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>
      </label>
    </div>
  );
}
