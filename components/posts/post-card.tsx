import { getPlainTextFromTiptap } from "@/lib/utils/richText";
import Link from "next/link";
import { ArrowUpRight, Eye, Heart, MessageCircle } from "lucide-react";
import type { Post } from "@/types";
import { date, readingTime, initials } from "@/lib/utils";
export function PostMeta({ post }: { post: Post }) {
  return (
    <div className="post-meta">
      <span className="avatar small-avatar">
        {initials(post.authorName || "Yazar")}
      </span>
      <span>{post.authorName}</span>
      <span>·</span>
      <span>{date(post.createdAt)}</span>
    </div>
  );
}
export function PostCard({ post }: { post: Post }) {
  const preview = getPlainTextFromTiptap(post.content);
  return (
    <article className="post-card">
      <div className="card-top">
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
        <span className="small muted">{readingTime(post.content)} dk</span>
      </div>
      <Link
        prefetch={false}
        href={`/posts/${post.slug}`}
        className="post-title"
      >
        <h3>{post.title}</h3>
        <ArrowUpRight size={21} />
      </Link>
      <p className="preview">
        {preview.length > 150
          ? `${preview.slice(0, 150)}…`
          : preview || "İçerik bulunamadı."}
      </p>
      <div className="card-bottom">
        <PostMeta post={post} />
        <div className="counts">
          <span>
            <Eye size={14} />
            {post.viewCount}
          </span>
          <span>
            <Heart size={14} />
            {post.likeCount}
          </span>
          <span>
            <MessageCircle size={14} />
            {post.commentCount}
          </span>
        </div>
      </div>
    </article>
  );
}
export function PostGrid({ posts }: { posts: Post[] }) {
  return (
    <div className="post-grid">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
