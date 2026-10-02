"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import type { Category } from "@/types";
export function Filters({ categories }: { categories: Category[] }) {
  const params = useSearchParams();
  const router = useRouter();
  const current = params.get("search") || "";
  const [search, setSearch] = useState(current);
  const latest = useRef(params.toString());
  useEffect(() => {
    latest.current = params.toString();
  }, [params, current]);
  useEffect(() => {
    if (search === current) return;
    const timer = setTimeout(() => {
      const q = new URLSearchParams(latest.current);
      if (search.trim()) q.set("search", search.trim());
      else q.delete("search");
      q.delete("page");
      router.replace(`/posts?${q}`, { scroll: false });
    }, 350);
    return () => clearTimeout(timer);
  }, [search, current, router]);
  return (
    <div className="filters">
      <label className="search-field" htmlFor="search">
        <Search size={19} />
        <input
          aria-label="Başlıklarda ara"
          id="search"
          placeholder="Başlıklarda ara…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>
      <label className="category-filter">
        <span className="sr-only">Kategori</span>
        <select
          value={params.get("categoryId") || ""}
          onChange={(e) => {
            const q = new URLSearchParams(params);
            if (e.target.value) q.set("categoryId", e.target.value);
            else q.delete("categoryId");
            q.delete("page");
            router.push(`/posts?${q}`);
          }}
        >
          <option value="">Tüm kategoriler</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
