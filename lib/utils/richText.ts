import type { JSONContent } from "@tiptap/react";

export const emptyRichText = (): JSONContent => ({
  type: "doc",
  content: [{ type: "paragraph" }],
});
const blocks = new Set([
  "paragraph",
  "heading",
  "bulletList",
  "orderedList",
  "blockquote",
  "codeBlock",
  "horizontalRule",
]);
const inline = new Set(["text", "hardBreak"]);
const marks = new Set([
  "bold",
  "italic",
  "underline",
  "strike",
  "code",
  "link",
]);
const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

// Validate the supported StarterKit schema before giving external JSON to ProseMirror.
export function isValidTiptapContent(value: unknown): value is JSONContent {
  let count = 0;
  function valid(node: unknown, parent: string, depth: number): boolean {
    if (
      !record(node) ||
      typeof node.type !== "string" ||
      depth > 64 ||
      ++count > 50000
    )
      return false;
    const type = node.type;
    const permitted =
      parent === ""
        ? type === "doc"
        : ["doc", "blockquote", "listItem"].includes(parent)
          ? blocks.has(type)
          : ["bulletList", "orderedList"].includes(parent)
            ? type === "listItem"
            : parent === "codeBlock"
              ? type === "text"
              : ["paragraph", "heading"].includes(parent)
                ? inline.has(type)
                : false;
    if (!permitted) return false;
    if (node.attrs !== undefined && !record(node.attrs)) return false;
    if (
      type === "heading" &&
      (!record(node.attrs) ||
        !Number.isInteger(node.attrs.level) ||
        Number(node.attrs.level) < 1 ||
        Number(node.attrs.level) > 6)
    )
      return false;
    if (
      node.marks !== undefined &&
      (!Array.isArray(node.marks) ||
        !node.marks.every(
          (mark) =>
            record(mark) &&
            typeof mark.type === "string" &&
            marks.has(mark.type) &&
            (mark.attrs === undefined || record(mark.attrs)),
        ))
    )
      return false;
    if (type === "text")
      return (
        typeof node.text === "string" &&
        node.text.length > 0 &&
        node.content === undefined
      );
    if (node.text !== undefined) return false;
    if (type === "hardBreak" || type === "horizontalRule")
      return node.content === undefined;
    if (node.content !== undefined && !Array.isArray(node.content))
      return false;
    const children = Array.isArray(node.content) ? node.content : [];
    if (
      ["bulletList", "orderedList", "blockquote"].includes(type) &&
      !children.length
    )
      return false;
    if (
      type === "listItem" &&
      (!record(children[0]) || children[0].type !== "paragraph")
    )
      return false;
    return children.every((child) => valid(child, type, depth + 1));
  }
  return valid(value, "", 0);
}

export function getPlainTextFromTiptap(content: unknown): string {
  if (!isValidTiptapContent(content)) return "";
  function text(node: JSONContent): string {
    if (node.type === "text") return node.text ?? "";
    if (node.type === "hardBreak") return "\n";
    const value = (node.content ?? []).map(text).join("");
    return [
      "paragraph",
      "heading",
      "codeBlock",
      "listItem",
      "blockquote",
    ].includes(node.type ?? "")
      ? `${value}\n`
      : value;
  }
  return text(content).replace(/\s+/g, " ").trim();
}

export function isSafeRichTextLink(href: string): boolean {
  try {
    const url = new URL(href);
    return ["http:", "https:", "mailto:"].includes(url.protocol);
  } catch {
    return false;
  }
}

// Keep only supported attributes, including a strict link URL allowlist.
export function sanitizeRichText(content: JSONContent): JSONContent {
  const start: unknown = content.attrs?.start;
  return {
    type: content.type,
    ...(content.text !== undefined ? { text: content.text } : {}),
    ...(content.type === "heading"
      ? { attrs: { level: content.attrs?.level } }
      : {}),
    ...(content.type === "orderedList"
      ? {
          attrs: {
            start:
              typeof start === "number" &&
              Number.isSafeInteger(start) &&
              start > 0
                ? start
                : 1,
          },
        }
      : {}),
    ...(content.content
      ? { content: content.content.map(sanitizeRichText) }
      : {}),
    ...(content.marks
      ? {
          marks: content.marks.flatMap((mark) => {
            if (mark.type !== "link") return [{ type: mark.type }];
            const href: unknown = mark.attrs?.href;
            return typeof href === "string" && isSafeRichTextLink(href)
              ? [
                  {
                    type: "link",
                    attrs: {
                      href,
                      target: "_blank",
                      rel: "noopener noreferrer nofollow",
                    },
                  },
                ]
              : [];
          }),
        }
      : {}),
  };
}
