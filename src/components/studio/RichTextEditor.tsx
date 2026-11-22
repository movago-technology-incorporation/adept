"use client";

import { useState, type ReactNode } from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extension-placeholder";
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  Link2,
  Link2Off,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
} from "lucide-react";
import { cx } from "@/components/ui/kit";

/** WYSIWYG editor (Tiptap). Emits HTML; the server sanitizes it before sending. */
export function RichTextEditor({
  initialHtml = "",
  onChange,
  placeholder = "Write your message…",
}: {
  initialHtml?: string;
  onChange: (html: string, isEmpty: boolean) => void;
  placeholder?: string;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: initialHtml,
    editorProps: {
      attributes: {
        class:
          "rte min-h-[260px] max-h-[48vh] overflow-y-auto px-5 py-4 text-[15px] leading-relaxed text-ink outline-none",
        "aria-label": "Message",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML(), editor.isEmpty),
  });

  return (
    <div className="overflow-hidden rounded-2xl bg-sand focus-within:bg-gold-soft/30">
      {editor ? <Toolbar editor={editor} /> : <div className="h-12 bg-sand-2/60" />}
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [url, setUrl] = useState("");
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      strike: e.isActive("strike"),
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      link: e.isActive("link"),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });
  const run = (fn: (c: ReturnType<Editor["chain"]>) => ReturnType<Editor["chain"]>) => fn(editor.chain().focus()).run();

  function applyLink() {
    const href = url.trim();
    if (!href) run((c) => c.extendMarkRange("link").unsetLink());
    else run((c) => c.extendMarkRange("link").setLink({ href: /^(https?:|mailto:|tel:)/i.test(href) ? href : `https://${href}` }));
    setLinkOpen(false);
    setUrl("");
  }

  return (
    <div className="bg-sand-2/60">
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5" role="toolbar" aria-label="Formatting">
        <Tool label="Bold (⌘B)" active={s.bold} onClick={() => run((c) => c.toggleBold())}>
          <Bold className="h-4 w-4" />
        </Tool>
        <Tool label="Italic (⌘I)" active={s.italic} onClick={() => run((c) => c.toggleItalic())}>
          <Italic className="h-4 w-4" />
        </Tool>
        <Tool label="Underline (⌘U)" active={s.underline} onClick={() => run((c) => c.toggleUnderline())}>
          <Underline className="h-4 w-4" />
        </Tool>
        <Tool label="Strikethrough" active={s.strike} onClick={() => run((c) => c.toggleStrike())}>
          <Strikethrough className="h-4 w-4" />
        </Tool>
        <Sep />
        <Tool label="Heading" active={s.h2} onClick={() => run((c) => c.toggleHeading({ level: 2 }))}>
          <Heading2 className="h-4 w-4" />
        </Tool>
        <Tool label="Subheading" active={s.h3} onClick={() => run((c) => c.toggleHeading({ level: 3 }))}>
          <Heading3 className="h-4 w-4" />
        </Tool>
        <Sep />
        <Tool label="Bulleted list" active={s.bullet} onClick={() => run((c) => c.toggleBulletList())}>
          <List className="h-4 w-4" />
        </Tool>
        <Tool label="Numbered list" active={s.ordered} onClick={() => run((c) => c.toggleOrderedList())}>
          <ListOrdered className="h-4 w-4" />
        </Tool>
        <Tool label="Quote" active={s.quote} onClick={() => run((c) => c.toggleBlockquote())}>
          <Quote className="h-4 w-4" />
        </Tool>
        <Tool label="Divider" onClick={() => run((c) => c.setHorizontalRule())}>
          <Minus className="h-4 w-4" />
        </Tool>
        <Sep />
        <Tool
          label={s.link ? "Edit link" : "Add link"}
          active={s.link || linkOpen}
          onClick={() => {
            setUrl(editor.getAttributes("link").href ?? "");
            setLinkOpen((v) => !v);
          }}
        >
          <Link2 className="h-4 w-4" />
        </Tool>
        {s.link ? (
          <Tool label="Remove link" onClick={() => run((c) => c.extendMarkRange("link").unsetLink())}>
            <Link2Off className="h-4 w-4" />
          </Tool>
        ) : null}
        <span className="ml-auto flex gap-0.5">
          <Tool label="Undo (⌘Z)" disabled={!s.canUndo} onClick={() => run((c) => c.undo())}>
            <Undo2 className="h-4 w-4" />
          </Tool>
          <Tool label="Redo (⇧⌘Z)" disabled={!s.canRedo} onClick={() => run((c) => c.redo())}>
            <Redo2 className="h-4 w-4" />
          </Tool>
        </span>
      </div>
      {linkOpen ? (
        <div className="flex gap-2 px-3 pb-2.5">
          <input
            autoFocus
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyLink();
              } else if (e.key === "Escape") setLinkOpen(false);
            }}
            placeholder="https://example.com — leave empty to remove"
            className="h-9 flex-1 rounded-full bg-white px-4 text-sm text-navy outline-none"
            aria-label="Link URL"
          />
          <button type="button" onClick={applyLink} className="h-9 rounded-full bg-navy px-4 text-sm text-white hover:bg-navy-3">
            Apply
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Tool({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cx(
        "grid h-8 w-8 place-items-center rounded-lg transition-colors disabled:opacity-30",
        active ? "bg-navy text-white" : "text-navy/75 hover:bg-white hover:text-navy",
      )}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <span className="mx-1 h-5 w-px bg-navy/10" aria-hidden />;
}
