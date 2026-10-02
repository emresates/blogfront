import Link from "next/link";
import { ArrowUpRight, Hash } from "lucide-react";
import { categoriesApi } from "@/lib/api/categories";
import { errorMessage } from "@/lib/api/client";
import { EmptyState, ErrorState } from "@/components/ui/primitives";
export const metadata = { title: "Kategoriler" };
export const dynamic = "force-dynamic";
export default async function Categories() {
  let data;
  try {
    data = (await categoriesApi.list()).data;
  } catch (e) {
    return (
      <div className="container page-space">
        <ErrorState message={errorMessage(e)} />
      </div>
    );
  }
  return (
    <div className="container page-space">
      <div className="page-heading">
        <div className="eyebrow">MERAKINA BİR YÖN VER</div>
        <h1>
          Kategoriler<span className="brand-dot">.</span>
        </h1>
        <p>İlgini çeken konulara biraz daha yakından bak.</p>
      </div>
      {data.length ? (
        <div className="post-grid">
          {data.map((c) => (
            <Link
              className="category-card"
              key={c.id}
              href={`/posts?categoryId=${c.id}`}
            >
              <Hash />
              <h2>{c.name}</h2>
              <ArrowUpRight />
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Yeni konular yolda."
          description="Kategoriler eklendiğinde burada listelenecek."
        />
      )}
    </div>
  );
}
