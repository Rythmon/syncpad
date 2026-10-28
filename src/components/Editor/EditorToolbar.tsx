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
  Cpu,
  Eraser,
} from 'lucide-react';

interface EditorToolbarProps {
  editor: Editor | null;
  isVirtualized: boolean;
  onToggleVirtualization: () => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  editor,
  isVirtualized,
  onToggleVirtualization,
}) => {
  if (!editor) return null;

  const btnClass = (active: boolean) =>
    `p-2 rounded-lg transition-all text-sm font-medium flex items-center justify-center ${
      active
        ? 'bg-indigo-600/30 text-indigo-400 border border-indigo-500/40 shadow-sm'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
    }`;

  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1.5 p-2 px-3 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 rounded-t-xl select-none">
      {/* History */}
      <div className="flex items-center gap-1 pr-2 border-r border-slate-800">
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 disabled:opacity-30 disabled:hover:bg-transparent"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 disabled:opacity-30 disabled:hover:bg-transparent"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>
      </div>

      {/* Headings */}
      <div className="flex items-center gap-1 pr-2 border-r border-slate-800">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={btnClass(editor.isActive('heading', { level: 1 }))}
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={btnClass(editor.isActive('heading', { level: 2 }))}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={btnClass(editor.isActive('heading', { level: 3 }))}
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </button>
      </div>

      {/* Formatting */}
      <div className="flex items-center gap-1 pr-2 border-r border-slate-800">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={btnClass(editor.isActive('bold'))}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={btnClass(editor.isActive('italic'))}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={btnClass(editor.isActive('strike'))}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={btnClass(editor.isActive('code'))}
          title="Inline Code"
        >
          <Code className="w-4 h-4" />
        </button>
      </div>

      {/* Lists & Quotes */}
      <div className="flex items-center gap-1 pr-2 border-r border-slate-800">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={btnClass(editor.isActive('bulletList'))}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={btnClass(editor.isActive('orderedList'))}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={btnClass(editor.isActive('blockquote'))}
          title="Blockquote"
        >
          <Quote className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          title="Divider"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      {/* Virtualization & Performance Feature */}
      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleVirtualization}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
            isVirtualized
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              : 'bg-slate-800/50 text-slate-400 border-slate-700/50 hover:bg-slate-800'
          }`}
          title="Toggle text block virtualization to eliminate offscreen DOM recalculations during concurrent typing"
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>{isVirtualized ? 'Virtualization: ON' : 'Virtualization: OFF'}</span>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          title="Clear Formatting"
        >
          <Eraser className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
