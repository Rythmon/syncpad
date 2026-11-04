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
import { CheckCircle2, Clock } from 'lucide-react';

interface CollaborativeEditorProps {
  ydoc: Y.Doc;
  provider: WebsocketProvider | null;
  currentUser: { name: string; color: string };
  isSimulatedOffline: boolean;
  roomId: string;
}

const DEFAULT_RFC_CONTENT = `
<h1>RFC 042: Distributed CRDT Synchronization &amp; Offline Persistence Architecture</h1>
<p><em>Author: Distributed Systems Core Team · Target Release: v2.4 · Status: Production-Ready</em></p>

<h2>1. Overview &amp; Design Goals</h2>
<p>SyncPad implements a decentralized collaborative document model designed for high-concurrency editing. Rather than routing all keystrokes through an operational transform (OT) authority requiring distributed mutex locks, replica convergence is guaranteed mathematically via <strong>Yjs Conflict-Free Replicated Data Types (CRDTs)</strong>.</p>

<h2>2. Real-Time Concurrency Model</h2>
<p>Replicas operate on commutative state vectors. When multiple engineers write to the same character block simultaneously, conflicts are resolved deterministically using unique client identifiers and logical Lamport clocks without human intervention or lost edits.</p>
<ul>
  <li><strong>Commutative Merges:</strong> Operation ordering is mathematically independent of arrival sequence.</li>
  <li><strong>State Vector Delta Exchange:</strong> Handshakes compute binary diffs, transmitting only unobserved transactions.</li>
  <li><strong>Independent Undo Stacks:</strong> Local undo and redo actions operate strictly on the author's operations.</li>
</ul>

<h2>3. Cross-Pod Presence via Redis Pub/Sub</h2>
<p>Live cursor telemetry, character selections, and user awareness states are multiplexed over Redis channels to maintain sub-15ms latency across geographically distributed WebSocket gateway clusters.</p>

<pre><code>// Two-phase state vector reconciliation
const localVector = Y.encodeStateVector(doc);
const remoteDelta = Y.encodeStateAsUpdate(remoteDoc, localVector);
Y.applyUpdate(doc, remoteDelta, 'network-handshake');</code></pre>

<h2>4. Offline-First Durability &amp; Background Sync</h2>
<p>All transactions are written synchronously to client-side <code>IndexedDB</code> persistence layers prior to socket transmission. If network drops occur, authors continue editing seamlessly in disconnected mode; all local mutations replay and reconcile upon reconnection.</p>

<h2>5. Client-Side Rendering Optimization</h2>
<p>Large documents leverage modern CSS <code>content-visibility: auto</code> containment boundaries to virtualize off-screen DOM blocks, keeping input latency under 16ms even during intensive multi-peer concurrent typing bursts.</p>
`;

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
          // History must be disabled when using Yjs collaboration to prevent conflicting local undo queues
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
          placeholder: 'Start writing or press "/" for commands...',
          emptyEditorClass: 'is-editor-empty',
        }),
        CharacterCount.configure({
          limit: undefined,
        }),
      ],
      editorProps: {
        attributes: {
          class:
            'prose prose-invert max-w-none focus:outline-none min-h-[580px] px-6 sm:px-12 py-8 text-zinc-200',
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
          }, 1000);
        }
      },
    },
    [ydoc, provider, currentUser.name, currentUser.color]
  );

  // Initialize seed content if document is brand new and completely empty
  useEffect(() => {
    if (!editor) return;

    const timer = setTimeout(() => {
      if (editor.isEmpty) {
        editor.commands.setContent(DEFAULT_RFC_CONTENT);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [editor]);

  const handleResetDocument = () => {
    if (editor) {
      editor.commands.setContent(DEFAULT_RFC_CONTENT);
    }
  };

  const wordCount = editor?.storage.characterCount.words() ?? 0;
  const characterCount = editor?.storage.characterCount.characters() ?? 0;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="flex flex-col bg-[#101217] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden transition-all">
      {/* Editor Formatting Toolbar */}
      <EditorToolbar
        editor={editor}
        isVirtualized={isVirtualized}
        onToggleVirtualization={() => setIsVirtualized((prev) => !prev)}
        onResetDocument={handleResetDocument}
      />

      {/* Editor Content Canvas */}
      <div
        className={`relative transition-all min-h-[600px] bg-[#0c0d11]/60 ${
          isVirtualized ? 'virtualized-block-content' : ''
        }`}
      >
        <EditorContent editor={editor} />
      </div>

      {/* Understated Status Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-2.5 bg-[#0e1014] border-t border-white/[0.06] text-xs text-zinc-400 select-none">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-zinc-300">{wordCount}</span>
            <span>words</span>
          </div>
          <span className="text-zinc-600">·</span>
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-zinc-300">{characterCount}</span>
            <span>characters</span>
          </div>
          <span className="text-zinc-600 hidden sm:inline">·</span>
          <div className="hidden sm:flex items-center gap-1.5 text-zinc-400">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            <span>{readingTimeMinutes} min read</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Saved to IndexedDB</span>
          </div>
          <span className="text-zinc-600">·</span>
          <span className="font-mono text-[11px] text-zinc-400">
            {roomId}
          </span>
        </div>
      </div>
    </div>
  );
};
