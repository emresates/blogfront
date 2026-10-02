import { Suspense } from "react";
import { postsApi } from "@/lib/api/posts";
import { categoriesApi } from "@/lib/api/categories";
import { errorMessage } from "@/lib/api/client";
import { Filters } from "@/components/posts/filters";
import { Pagination } from "@/components/posts/pagination";
import { PostGrid } from "@/components/posts/post-card";
import { EmptyState, ErrorState } from "@/components/ui/primitives";
export const metadata = { title: "Keşfet" };
export default async function Posts({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query: Record<string, string> = {
    page: String(Math.max(1, Number(params.page) || 1)),
    pageSize: "12",
  };
  if (typeof params.search === "string") query.search = params.search;
  if (typeof params.categoryId === "string")
    query.categoryId = params.categoryId;
  const [posts, cats] = await Promise.allSettled([
    postsApi.list(new URLSearchParams(query).toString()),
    categoriesApi.list(),
  ]);
  return (
    <div className="container page-space">
      <div className="page-heading">
        <div className="eyebrow">FİKİRLERİN PEŞİNDEN</div>
        <h1>
          Keşfet<span className="brand-dot">.</span>
        </h1>
        <p>Bir sonraki ilhamın, bir sonraki satırda olabilir.</p>
      </div>
      <Suspense>
        <Filters
          key={new URLSearchParams(query).toString()}
          categories={cats.status === "fulfilled" ? cats.value.data : []}
        />
      </Suspense>
      {cats.status === "rejected" && (
        <p className="form-error">
          Kategoriler yüklenemedi. Yazılarda arama yapabilirsin.
        </p>
      )}
      {posts.status === "rejected" ? (
        <ErrorState message={errorMessage(posts.reason)} />
      ) : (
        <>
          <div className="result-count">
            {posts.value.pagination?.totalCount ?? posts.value.data.length} yazı
          </div>
          {posts.value.data.length ? (
            <PostGrid posts={posts.value.data} />
          ) : (
            <EmptyState
              title={
                query.search
                  ? "Aradığın yazıyı bulamadık."
                  : "Henüz yayınlanmış yazı yok."
              }
              description="Başka bir arama dene veya yeni yazılar için tekrar uğra."
            />
          )}
          {posts.value.pagination && (
            <Pagination meta={posts.value.pagination} query={query} />
          )}
        </>
      )}
    </div>
  );
}
