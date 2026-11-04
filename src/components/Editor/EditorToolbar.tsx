'use client';

import React from 'react';
import { type Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Undo2,
  Redo2,
  Zap,
  RotateCcw,
  Code2,
} from 'lucide-react';

interface EditorToolbarProps {
  editor: Editor | null;
  isVirtualized: boolean;
  onToggleVirtualization: () => void;
  onResetDocument?: () => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  editor,
  isVirtualized,
  onToggleVirtualization,
  onResetDocument,
}) => {
  if (!editor) return null;

  const btnClass = (active: boolean) =>
    `p-1.5 rounded-md transition-colors text-xs flex items-center justify-center ${
      active
        ? 'bg-white/10 text-white font-medium'
        : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06]'
    }`;

  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1 px-4 py-2 bg-[#0d0e12]/90 backdrop-blur-md border-b border-white/[0.08] select-none text-xs">
      {/* History */}
      <div className="flex items-center gap-0.5 pr-2 mr-1 border-r border-white/[0.08]">
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] disabled:opacity-25 disabled:hover:bg-transparent"
          title="Undo (⌘Z)"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] disabled:opacity-25 disabled:hover:bg-transparent"
          title="Redo (⌘⇧Z)"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Headings */}
      <div className="flex items-center gap-0.5 pr-2 mr-1 border-r border-white/[0.08]">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={btnClass(editor.isActive('heading', { level: 1 }))}
          title="Heading 1"
        >
          <Heading1 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={btnClass(editor.isActive('heading', { level: 2 }))}
          title="Heading 2"
        >
          <Heading2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={btnClass(editor.isActive('heading', { level: 3 }))}
          title="Heading 3"
        >
          <Heading3 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Inline Formatting */}
      <div className="flex items-center gap-0.5 pr-2 mr-1 border-r border-white/[0.08]">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={btnClass(editor.isActive('bold'))}
          title="Bold (⌘B)"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={btnClass(editor.isActive('italic'))}
          title="Italic (⌘I)"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={btnClass(editor.isActive('strike'))}
          title="Strikethrough"
        >
          <Strikethrough className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={btnClass(editor.isActive('code'))}
          title="Inline Code (⌘E)"
        >
          <Code className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Blocks & Lists */}
      <div className="flex items-center gap-0.5 pr-2 mr-1 border-r border-white/[0.08]">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={btnClass(editor.isActive('bulletList'))}
          title="Bulleted List"
        >
          <List className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={btnClass(editor.isActive('orderedList'))}
          title="Numbered List"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={btnClass(editor.isActive('blockquote'))}
          title="Blockquote"
        >
          <Quote className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={btnClass(editor.isActive('codeBlock'))}
          title="Code Block"
        >
          <Code2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06]"
          title="Horizontal Divider"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Right-aligned utilities */}
      <div className="ml-auto flex items-center gap-1.5">
        {/* DOM Virtualization mode pill */}
        <button
          type="button"
          onClick={onToggleVirtualization}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors border ${
            isVirtualized
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/15'
              : 'bg-zinc-800/40 text-zinc-400 border-white/[0.06] hover:bg-zinc-800'
          }`}
          title="Toggle CSS content-visibility block virtualization for heavy documents"
        >
          <Zap className={`w-3 h-3 ${isVirtualized ? 'text-emerald-400' : 'text-zinc-500'}`} />
          <span>{isVirtualized ? 'DOM Virtualized' : 'Virtualization Off'}</span>
        </button>

        {onResetDocument && (
          <button
            type="button"
            onClick={onResetDocument}
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06]"
            title="Reset to RFC Template"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
