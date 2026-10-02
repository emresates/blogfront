import { test } from "node:test";
import assert from "node:assert/strict";
import { getSchema } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import {
  emptyRichText,
  getPlainTextFromTiptap,
  isValidTiptapContent,
  sanitizeRichText,
  isSafeRichTextLink,
} from "../lib/utils/richText.ts";
const paragraph = (...content) => ({ type: "paragraph", content });
const text = (value) => ({ type: "text", text: value });
const doc = (...content) => ({ type: "doc", content });
test("preview joins inline formatting without inserting spaces inside words, separates blocks", () => {
  const value = doc(
    { type: "heading", attrs: { level: 2 }, content: [text("Başlık")] },
    paragraph(
      text("Mer"),
      { ...text("haba"), marks: [{ type: "bold" }] },
      text(" dünya"),
    ),
    {
      type: "bulletList",
      content: [{ type: "listItem", content: [paragraph(text("Bir madde"))] }],
    },
  );
  assert.equal(getPlainTextFromTiptap(value), "Başlık Merhaba dünya Bir madde");
  assert.equal(isValidTiptapContent(value), true);
});
test("empty and malformed content never becomes a nonempty preview", () => {
  for (const value of [
    null,
    undefined,
    {},
    "legacy text",
    { type: "doc", content: "invalid" },
    doc({ type: "paragraph", content: [{ type: "text", text: 42 }] }),
    doc({ type: "heading", attrs: { level: 99 } }),
    doc({ type: "evil" }),
    doc({ type: "listItem", content: [] }),
  ]) {
    assert.equal(isValidTiptapContent(value), false);
    assert.equal(getPlainTextFromTiptap(value), "");
  }
  assert.equal(getPlainTextFromTiptap(emptyRichText()), "");
  assert.equal(getPlainTextFromTiptap(doc(paragraph(text(" \n\t ")))), "");
  const cyclic = doc();
  cyclic.content.push(cyclic);
  assert.equal(isValidTiptapContent(cyclic), false);
});
test("unsafe links and arbitrary HTML attributes are removed before rendering", () => {
  const value = doc(
    paragraph({
      ...text("<script>alert(1)</script>"),
      marks: [
        {
          type: "link",
          attrs: { href: "javascript:alert(1)", onclick: "bad" },
        },
      ],
    }),
  );
  const result = sanitizeRichText(value);
  assert.deepEqual(result.content[0].content[0].marks, []);
  assert.equal(result.content[0].content[0].text, "<script>alert(1)</script>");
  for (const url of [
    "javascript:alert(1)",
    "data:text/html,x",
    "//evil.test",
    "not a URL",
  ])
    assert.equal(isSafeRichTextLink(url), false);
  assert.equal(isSafeRichTextLink("https://example.com"), true);
});
test("supported rich content round trips through the actual StarterKit JSON schema", () => {
  const value = doc(
    { type: "heading", attrs: { level: 3 }, content: [text("Başlık")] },
    paragraph({
      ...text("Bağlantı"),
      marks: [
        { type: "link", attrs: { href: "https://example.com" } },
        { type: "underline" },
      ],
    }),
    {
      type: "orderedList",
      attrs: { start: 2 },
      content: [{ type: "listItem", content: [paragraph(text("İkinci"))] }],
    },
    { type: "blockquote", content: [paragraph(text("Alıntı"))] },
    { type: "codeBlock", content: [text("const x = 1;")] },
  );
  const schema = getSchema([StarterKit]);
  const node = schema.nodeFromJSON(sanitizeRichText(value));
  node.check();
  const result = node.toJSON();
  assert.equal(isValidTiptapContent(result), true);
  assert.equal(
    getPlainTextFromTiptap(result),
    "Başlık Bağlantı İkinci Alıntı const x = 1;",
  );
  assert.equal(
    result.content[1].content[0].marks.some((m) => m.type === "underline"),
    true,
  );
});
