"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

interface EscritoEditorProps {
  content: string;
  onChange: (html: string) => void;
  editable?: boolean;
}

export default function EscritoEditor({
  content,
  onChange,
  editable = true,
}: EscritoEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[420px] px-4 py-3 focus:outline-none",
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  if (!editor) {
    return (
      <div className="border border-border rounded-lg min-h-[420px] bg-card animate-pulse" />
    );
  }

  return (
    <div className="border border-border rounded-lg bg-white overflow-hidden">
      {editable && (
        <div className="flex flex-wrap gap-1 p-2 border-b border-border bg-background">
          <ToolbarButton
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
            label="N"
            title="Negrita"
            className="font-bold"
          />
          <ToolbarButton
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            label="I"
            title="Cursiva"
            className="italic"
          />
          <ToolbarButton
            active={editor.isActive("heading", { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            label="H2"
            title="Titulo"
          />
          <ToolbarButton
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            label="Lista"
            title="Lista"
          />
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarButton({
  active,
  onClick,
  label,
  title,
  className = "",
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  title: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`px-2 py-1 text-xs rounded border ${
        active
          ? "bg-primary text-white border-primary"
          : "bg-card border-border text-muted hover:border-primary/40"
      } ${className}`}
    >
      {label}
    </button>
  );
}
