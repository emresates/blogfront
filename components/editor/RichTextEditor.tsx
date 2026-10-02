"use client";

import { useEffect, useId, useState } from "react";
import {
  EditorContent,
  useEditor,
  useEditorState,
  type JSONContent,
} from "@tiptap/react";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code2,
  Undo2,
  Redo2,
  Link2,
  Unlink,
} from "lucide-react";
import { richTextExtensions } from "./extensions";
import {
  emptyRichText,
  isValidTiptapContent,
  isSafeRichTextLink,
  sanitizeRichText,
} from "@/lib/utils/richText";

interface RichTextEditorProps {
  value?: JSONContent;
  onChange: (content: JSONContent) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Düşüncelerini paylaş…",
  disabled = false,
}: RichTextEditorProps) {
  const labelId = useId();
  const [linkOpen, setLinkOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [linkError, setLinkError] = useState("");
  const editor = useEditor({
    extensions: [
      ...richTextExtensions(),
      Placeholder.configure({ placeholder }),
    ],
    content: isValidTiptapContent(value)
      ? sanitizeRichText(value)
      : emptyRichText(),
    immediatelyRender: false,
    editable: !disabled,
    editorProps: {
      attributes: {
        class: "rich-text prose-editor",
        role: "textbox",
        "aria-multiline": "true",
        "aria-labelledby": labelId,
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getJSON()),
  });
  const state = useEditorState({
    editor,
    selector: ({ editor }) =>
      editor
        ? {
            bold: editor.isActive("bold"),
            italic: editor.isActive("italic"),
            underline: editor.isActive("underline"),
            strike: editor.isActive("strike"),
            bulletList: editor.isActive("bulletList"),
            orderedList: editor.isActive("orderedList"),
            blockquote: editor.isActive("blockquote"),
            codeBlock: editor.isActive("codeBlock"),
            link: editor.isActive("link"),
            heading:
              [1, 2, 3].find((level) =>
                editor.isActive("heading", { level }),
              ) ?? 0,
            undo: editor.can().undo(),
            redo: editor.can().redo(),
          }
        : null,
  });
  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [editor, disabled]);
  useEffect(() => {
    if (!editor) return;
    const next = isValidTiptapContent(value)
      ? sanitizeRichText(value)
      : emptyRichText();
    // Do not reset selection/history for the value echoed by onUpdate.
    if (
      JSON.stringify(sanitizeRichText(editor.getJSON())) !==
      JSON.stringify(next)
    )
      editor.commands.setContent(next, { emitUpdate: false });
  }, [editor, value]);
  const tools = [
    {
      label: "Kalın",
      icon: Bold,
      active: state?.bold,
      run: () => editor?.chain().focus().toggleBold().run(),
    },
    {
      label: "İtalik",
      icon: Italic,
      active: state?.italic,
      run: () => editor?.chain().focus().toggleItalic().run(),
    },
    {
      label: "Altı çizili",
      icon: Underline,
      active: state?.underline,
      run: () => editor?.chain().focus().toggleUnderline().run(),
    },
    {
      label: "Üstü çizili",
      icon: Strikethrough,
      active: state?.strike,
      run: () => editor?.chain().focus().toggleStrike().run(),
    },
    {
      label: "Madde işaretli liste",
      icon: List,
      active: state?.bulletList,
      run: () => editor?.chain().focus().toggleBulletList().run(),
    },
    {
      label: "Numaralı liste",
      icon: ListOrdered,
      active: state?.orderedList,
      run: () => editor?.chain().focus().toggleOrderedList().run(),
    },
    {
      label: "Alıntı",
      icon: Quote,
      active: state?.blockquote,
      run: () => editor?.chain().focus().toggleBlockquote().run(),
    },
    {
      label: "Kod bloğu",
      icon: Code2,
      active: state?.codeBlock,
      run: () => editor?.chain().focus().toggleCodeBlock().run(),
    },
  ];
  function applyLink() {
    const href = url.trim();
    if (!isSafeRichTextLink(href)) {
      setLinkError(
        "Geçerli bir https://, http:// veya mailto: bağlantısı gir.",
      );
      return;
    }
    editor?.chain().focus().extendMarkRange("link").setLink({ href }).run();
    setLinkOpen(false);
  }
  return (
    <div className="rich-editor-field">
      <span id={labelId} className="rich-editor-label">
        İçerik
      </span>
      <div className={`rich-editor ${disabled ? "is-disabled" : ""}`}>
        <div
          className="editor-toolbar"
          role="group"
          aria-label="Metin biçimlendirme"
        >
          <select
            aria-label="Paragraf biçimi"
            value={state?.heading ?? 0}
            disabled={disabled || !editor}
            onChange={(e) => {
              const level = Number(e.target.value);
              if (!level) editor?.chain().focus().setParagraph().run();
              else
                editor
                  ?.chain()
                  .focus()
                  .toggleHeading({ level: level as 1 | 2 | 3 })
                  .run();
            }}
          >
            <option value={0}>Paragraf</option>
            <option value={1}>Başlık 1</option>
            <option value={2}>Başlık 2</option>
            <option value={3}>Başlık 3</option>
          </select>
          {tools.map(({ label, icon: Icon, active, run }) => (
            <button
              type="button"
              key={label}
              title={label}
              aria-label={label}
              aria-pressed={!!active}
              disabled={disabled || !editor}
              onClick={run}
            >
              <Icon size={17} />
            </button>
          ))}
          <button
            type="button"
            aria-label="Bağlantı ekle veya düzenle"
            title="Bağlantı"
            aria-pressed={!!state?.link}
            disabled={disabled || !editor}
            onClick={() => {
              setUrl(String(editor?.getAttributes("link").href ?? ""));
              setLinkError("");
              setLinkOpen((v) => !v);
            }}
          >
            <Link2 size={17} />
          </button>
          <button
            type="button"
            aria-label="Bağlantıyı kaldır"
            title="Bağlantıyı kaldır"
            disabled={disabled || !state?.link}
            onClick={() =>
              editor?.chain().focus().extendMarkRange("link").unsetLink().run()
            }
          >
            <Unlink size={17} />
          </button>
          <button
            type="button"
            aria-label="Geri al"
            title="Geri al"
            disabled={disabled || !state?.undo}
            onClick={() => editor?.chain().focus().undo().run()}
          >
            <Undo2 size={17} />
          </button>
          <button
            type="button"
            aria-label="Yinele"
            title="Yinele"
            disabled={disabled || !state?.redo}
            onClick={() => editor?.chain().focus().redo().run()}
          >
            <Redo2 size={17} />
          </button>
        </div>
        {linkOpen && (
          <div className="editor-link-panel">
            <label className="field">
              <span>Bağlantı adresi</span>
              <input
                type="url"
                placeholder="https://…"
                value={url}
                disabled={disabled}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applyLink();
                  }
                  if (e.key === "Escape") {
                    e.preventDefault();
                    setLinkOpen(false);
                    editor?.commands.focus();
                  }
                }}
              />
            </label>
            <div className="actions">
              <button
                type="button"
                className="button compact"
                disabled={disabled}
                onClick={applyLink}
              >
                Uygula
              </button>
              <button
                type="button"
                className="text-link"
                onClick={() => setLinkOpen(false)}
              >
                Vazgeç
              </button>
            </div>
            {linkError && (
              <p role="alert" className="form-error">
                {linkError}
              </p>
            )}
          </div>
        )}
        {!editor && (
          <p className="editor-loading" role="status">
            Editör yükleniyor…
          </p>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
