'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { EditorToolbar } from './EditorToolbar';

interface CollaborativeEditorProps {
  ydoc: Y.Doc;
  provider: WebsocketProvider | null;
  currentUser: { name: string; color: string };
  isSimulatedOffline: boolean;
  roomId: string;
}

export const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({
  ydoc,
  provider,
  currentUser,
  isSimulatedOffline,
  roomId,
}) => {
  const [isVirtualized, setIsVirtualized] = useState(true);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          // History must be false when using Yjs collaboration to prevent conflict
          history: false,
        }),
        Collaboration.configure({
          document: ydoc,
          field: 'syncpad-content',
        }),
        ...(provider
          ? [
              CollaborationCursor.configure({
                provider: provider,
                user: {
                  name: currentUser.name,
                  color: currentUser.color,
                },
              }),
            ]
          : []),
        Placeholder.configure({
          placeholder: 'Write your thoughts, notes, or collaborate live in real time...',
          emptyEditorClass: 'is-editor-empty',
        }),
        CharacterCount.configure({
          limit: undefined,
        }),
      ],
      editorProps: {
        attributes: {
          class:
            'prose prose-invert max-w-none focus:outline-none min-h-[500px] px-8 py-6 text-slate-100',
        },
      },
      onUpdate: () => {
        // Broadcast typing indicator via awareness
        if (provider) {
          provider.awareness.setLocalStateField('user', {
            name: currentUser.name,
            color: currentUser.color,
            isTyping: true,
          });

          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          typingTimeoutRef.current = setTimeout(() => {
            provider.awareness.setLocalStateField('user', {
              name: currentUser.name,
              color: currentUser.color,
              isTyping: false,
            });
          }, 1200);
        }
      },
    },
    [ydoc, provider, currentUser.name, currentUser.color]
  );

  // Initialize seed content if document is brand new and completely empty
  useEffect(() => {
    if (!editor) return;

    // Wait slightly to verify if remote sync populated the document
    const timer = setTimeout(() => {
      if (editor.isEmpty) {
        editor.commands.setContent(`
          <h1>SyncPad — Real-Time Collaborative Editor</h1>
          <p>Welcome to <strong>SyncPad</strong>! A distributed, conflict-free collaborative editor engineered for high-concurrency multi-user editing with <strong>Yjs (CRDTs)</strong>, <strong>WebSockets</strong>, and <strong>Redis Pub/Sub</strong>.</p>
          
          <h2>⚡ Architecture Highlights</h2>
          <ul>
            <li><strong>CRDT Engine (Yjs):</strong> Mathematical conflict-free replicated data types ensuring all client replicas converge consistently without centralized document locking.</li>
            <li><strong>Low-Latency Presence:</strong> Live cursor positions, text selection ranges, and real-time typing badges broadcasted via Redis Pub/Sub channels.</li>
            <li><strong>Offline-First Durability:</strong> Automatic client-side persistence via <code>IndexedDB</code> and Service Workers. Toggle offline mode anytime to test disconnected editing!</li>
            <li><strong>Block Virtualization:</strong> DOM text blocks are dynamically virtualized using <code>content-visibility: auto</code>, cutting unnecessary offscreen re-renders during intense typing bursts.</li>
          </ul>

          <h2>🧪 Interactive Experimentation</h2>
          <blockquote>
            Click <strong>"Split-View Demo"</strong> in the top navigation bar to open a second concurrent peer on this same screen, or share the room URL across tabs/browsers to see real-time cursor tracking in action!
          </blockquote>

          <hr />
          <p>Start typing here to test live collaboration...</p>
        `);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [editor]);

  const wordCount = editor?.storage.characterCount.words() ?? 0;
  const characterCount = editor?.storage.characterCount.characters() ?? 0;

  return (
    <div className="flex flex-col bg-slate-900/60 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-sm overflow-hidden">
      {/* Editor Formatting Toolbar */}
      <EditorToolbar
        editor={editor}
        isVirtualized={isVirtualized}
        onToggleVirtualization={() => setIsVirtualized((prev) => !prev)}
      />

      {/* Editor Content Area with Virtualization Class */}
      <div
        className={`relative transition-all min-h-[550px] bg-slate-950/40 ${
          isVirtualized ? 'virtualized-block-content' : ''
        }`}
      >
        <EditorContent editor={editor} />
      </div>

      {/* Editor Status Footer */}
      <div className="flex items-center justify-between px-6 py-2.5 bg-slate-900/80 border-t border-slate-800/80 text-xs text-slate-400 select-none">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-slate-300">{wordCount}</span> words
          </div>
          <div className="w-1 h-1 rounded-full bg-slate-700" />
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-slate-300">{characterCount}</span> characters
          </div>
          <div className="w-1 h-1 rounded-full bg-slate-700" />
          <div className="flex items-center gap-1.5 text-indigo-400">
            <span>Room:</span>
            <span className="font-mono bg-indigo-950/50 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-800/40">
              {roomId}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isVirtualized && (
            <span className="text-[11px] px-2 py-0.5 bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 rounded-full font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              DOM Virtualization Enabled
            </span>
          )}
          <span className="text-slate-500">Auto-saved to IndexedDB</span>
        </div>
      </div>
    </div>
  );
};
