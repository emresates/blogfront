"use client";
import { useState, useId } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Comment, CurrentUser } from "@/types";
import { date, initials } from "@/lib/utils";
import { canManageComment } from "@/lib/utils/comments";
import { ReplyForm } from "./ReplyForm";
interface Props {
  comment: Comment;
  currentUser: CurrentUser | null;
  depth?: number;
  busy: boolean;
  onReply: (id: number, text: string) => Promise<void>;
  onUpdated: (id: number, text: string) => Promise<void>;
  onDeleted: (id: number) => void;
}
export function CommentItem({
  comment,
  currentUser,
  depth = 0,
  busy,
  onReply,
  onUpdated,
  onDeleted,
}: Props) {
  const [mode, setMode] = useState<"reply" | "edit" | null>(null);
  const panelId = useId();
  const path = usePathname();
  const canManage = canManageComment(currentUser, comment);
  const replies = Array.isArray(comment.replies) ? comment.replies : [];
  return (
    <li className={`comment-thread ${depth > 0 ? "is-reply" : ""}`}>
      <article className="comment" id={`comment-${comment.id}`}>
        <span className="avatar">{initials(comment.userName || "U")}</span>
        <div className="comment-body">
          <div className="comment-heading">
            <strong>{comment.userName}</strong>
            <time className="muted small" dateTime={comment.createdAt}>
              {date(comment.createdAt)}
            </time>
          </div>
          {mode === "edit" && canManage ? (
            <ReplyForm
              label="Yorumu düzenle"
              initialValue={comment.content}
              submitLabel="Kaydet"
              onCancel={() => setMode(null)}
              onSubmit={async (text) => {
                await onUpdated(comment.id, text);
                setMode(null);
              }}
            />
          ) : (
            <p className="plain-text">{comment.content}</p>
          )}
          <div className="actions small comment-actions">
            {currentUser ? (
              <button
                className="text-link"
                disabled={busy}
                aria-expanded={mode === "reply"}
                aria-controls={panelId}
                onClick={() => setMode(mode === "reply" ? null : "reply")}
              >
                Yanıtla
              </button>
            ) : (
              <Link
                className="text-link"
                href={`/login?next=${encodeURIComponent(path)}`}
              >
                Yanıtlamak için giriş yap
              </Link>
            )}
            {canManage && (
              <>
                <button
                  className="text-link"
                  disabled={busy}
                  onClick={() => setMode("edit")}
                >
                  Düzenle
                </button>
                <button
                  className="text-link danger-text"
                  disabled={busy}
                  onClick={() => onDeleted(comment.id)}
                >
                  Sil
                </button>
              </>
            )}
          </div>
          <div id={panelId}>
            {mode === "reply" && currentUser && (
              <ReplyForm
                label={`${comment.userName} için yanıtın`}
                onCancel={() => setMode(null)}
                onSubmit={async (text) => {
                  await onReply(comment.id, text);
                  setMode(null);
                }}
              />
            )}
          </div>
        </div>
      </article>
      {replies.length > 0 && (
        <ul
          className={`comment-replies ${depth >= 2 ? "indent-capped" : ""}`}
          aria-label={`${comment.userName} yorumuna yanıtlar`}
        >
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUser={currentUser}
              depth={depth + 1}
              busy={busy}
              onReply={onReply}
              onUpdated={onUpdated}
              onDeleted={onDeleted}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
