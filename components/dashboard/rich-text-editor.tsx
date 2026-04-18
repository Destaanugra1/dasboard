"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { Bold, Italic, Underline as UnderlineIcon, Strikethrough, Heading2, List, ListOrdered, Link as LinkIcon, RemoveFormatting } from "lucide-react";
import { useEffect } from "react";

export function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-accentBlue underline cursor-pointer",
        },
      }),
    ],
    immediatelyRender: false,
    content: value,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none min-h-[120px] max-h-[300px] overflow-y-auto w-full px-3 py-2 text-sm text-textPrimary leading-relaxed " +
          "[&_p]:mb-1.5 [&_p]:mt-0 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-2 [&_h2]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1 " +
          "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1 [&_strong]:font-bold [&_em]:italic",
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  // Sync external changes (like resetting form)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="flex flex-col rounded-xl border border-white/10 bg-white/5 overflow-hidden focus-within:border-white/30 transition-colors">
      <div className="flex flex-wrap items-center gap-1 border-b border-white/10 bg-white/5 px-2 py-1.5">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`rounded p-1.5 text-muted hover:bg-white/10 hover:text-textPrimary transition-colors ${
            editor.isActive("heading", { level: 2 }) ? "bg-white/10 text-white" : ""
          }`}
          title="Heading 2"
        >
          <Heading2 size={16} />
        </button>

        <div className="h-4 w-px bg-white/10 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`rounded p-1.5 text-muted hover:bg-white/10 hover:text-textPrimary transition-colors ${
            editor.isActive("bold") ? "bg-white/10 text-white" : ""
          }`}
          title="Bold"
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`rounded p-1.5 text-muted hover:bg-white/10 hover:text-textPrimary transition-colors ${
            editor.isActive("italic") ? "bg-white/10 text-white" : ""
          }`}
          title="Italic"
        >
          <Italic size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`rounded p-1.5 text-muted hover:bg-white/10 hover:text-textPrimary transition-colors ${
            editor.isActive("underline") ? "bg-white/10 text-white" : ""
          }`}
          title="Underline"
        >
          <UnderlineIcon size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`rounded p-1.5 text-muted hover:bg-white/10 hover:text-textPrimary transition-colors ${
            editor.isActive("strike") ? "bg-white/10 text-white" : ""
          }`}
          title="Strikethrough"
        >
          <Strikethrough size={16} />
        </button>

        <div className="h-4 w-px bg-white/10 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`rounded p-1.5 text-muted hover:bg-white/10 hover:text-textPrimary transition-colors ${
            editor.isActive("bulletList") ? "bg-white/10 text-white" : ""
          }`}
          title="Bullet List"
        >
          <List size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`rounded p-1.5 text-muted hover:bg-white/10 hover:text-textPrimary transition-colors ${
            editor.isActive("orderedList") ? "bg-white/10 text-white" : ""
          }`}
          title="Ordered List"
        >
          <ListOrdered size={16} />
        </button>

        <div className="h-4 w-px bg-white/10 mx-1" />

        <button
          type="button"
          onClick={() => {
            const url = window.prompt("URL:");
            if (url) {
              editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
            }
          }}
          className={`rounded p-1.5 text-muted hover:bg-white/10 hover:text-textPrimary transition-colors ${
            editor.isActive("link") ? "bg-white/10 text-white" : ""
          }`}
          title="Link"
        >
          <LinkIcon size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().unsetAllMarks().run()}
          className="rounded p-1.5 text-muted hover:bg-white/10 hover:text-textPrimary transition-colors"
          title="Clear Formatting"
        >
          <RemoveFormatting size={16} />
        </button>
      </div>
      
      {/* Resizer container using resize-y */}
      <div className="relative resize-y overflow-auto min-h-[120px] max-h-[500px] flex flex-col">
        <EditorContent editor={editor} className="flex-1 h-full w-full" />
      </div>
    </div>
  );
}
