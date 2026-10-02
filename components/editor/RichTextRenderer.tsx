"use client";

import { useEffect } from "react";
import { EditorContent, useEditor, type JSONContent } from "@tiptap/react";
import { richTextExtensions } from "./extensions";
import {
  getPlainTextFromTiptap,
  isValidTiptapContent,
  sanitizeRichText,
} from "@/lib/utils/richText";

export function RichTextRenderer({ content }: { content: JSONContent }) {
  if (!isValidTiptapContent(content) || !getPlainTextFromTiptap(content))
    return <p className="muted">İçerik bulunamadı.</p>;
  return <ReadonlyDocument content={content} />;
}
function ReadonlyDocument({ content }: { content: JSONContent }) {
  const editor = useEditor({
    extensions: richTextExtensions(true),
    content: sanitizeRichText(content),
    editable: false,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "rich-text article-prose",
        "aria-label": "Yazı içeriği",
      },
    },
  });
  useEffect(() => {
    editor?.commands.setContent(sanitizeRichText(content), {
      emitUpdate: false,
    });
  }, [editor, content]);
  return (
    <>
      {!editor && (
        <p className="plain-text">{getPlainTextFromTiptap(content)}</p>
      )}
      <EditorContent editor={editor} />
    </>
  );
}
