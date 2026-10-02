import { RichTextRenderer } from "@/components/editor/RichTextRenderer";
import { getPlainTextFromTiptap } from "@/lib/utils/richText";
import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Eye, Clock, ArrowLeft, MessageCircle } from "lucide-react";
import { postsApi } from "@/lib/api/posts";
import { ApiError } from "@/lib/api/client";
import { PostMeta } from "@/components/posts/post-card";
import { ArticleActions } from "@/components/posts/article-actions";
import { CommentSection } from "@/components/comments/comment-section";
import { readingTime } from "@/lib/utils";
const getPost = cache(async (slug: string) => {
  try {
    return (await postsApi.bySlug(slug)).data;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
});
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  return {
    title: post.title,
    description: getPlainTextFromTiptap(post.content).slice(0, 160),
    alternates: { canonical: `/posts/${encodeURIComponent(post.slug)}` },
  };
}
export default async function Article({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  return (
    <article className="article container">
      <Link href="/posts" className="text-link muted">
        <ArrowLeft size={16} />
        Keşfet’e dön
      </Link>
      <header className="article-header">
        <div className="badges">
          {post.categories?.map((c) => (
            <Link
              className="badge"
              key={c.id}
              href={`/posts?categoryId=${c.id}`}
            >
              {c.name}
            </Link>
          ))}
        </div>
        <h1>{post.title}</h1>
        <PostMeta post={post} />
        <div className="counts">
          <span>
            <Clock size={15} />
            {readingTime(post.content)} dk okuma
          </span>
          <span>
            <Eye size={15} />
            {post.viewCount} görüntülenme
          </span>
          <span>
            <MessageCircle size={15} />
            {post.commentCount} yorum
          </span>
        </div>
      </header>
      <div className="article-content">
        <RichTextRenderer content={post.content} />
      </div>
      <ArticleActions
        slug={post.slug}
        id={post.id}
        initialCount={post.likeCount}
      />
      <CommentSection postId={post.id} />
    </article>
  );
}
