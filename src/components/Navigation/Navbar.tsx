'use client';

import React, { useState, useEffect } from 'react';
import * as Y from 'yjs';
import { ActiveUsersBar } from '@/components/Presence/ActiveUsersBar';
import { Collaborator } from '@/hooks/useCollaboration';
import {
  Share2,
  Download,
  Columns2,
  Plus,
  Activity,
} from 'lucide-react';

interface NavbarProps {
  roomId: string;
  ydoc: Y.Doc;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  collaborators: Collaborator[];
  currentUser: { name: string; color: string };
  isSplitView: boolean;
  onToggleSplitView: () => void;
  onOpenProfile: () => void;
  onOpenExport: () => void;
  onOpenShare: () => void;
  onNewDocument: () => void;
  onOpenInspector: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  roomId,
  ydoc,
  connectionStatus,
  collaborators,
  currentUser,
  isSplitView,
  onToggleSplitView,
  onOpenProfile,
  onOpenExport,
  onOpenShare,
  onNewDocument,
  onOpenInspector,
}) => {
  const [title, setTitle] = useState('RFC 042: Distributed CRDT Synchronization');

  // Synchronize document title via Yjs CRDT Text
  useEffect(() => {
    const ytext = ydoc.getText('document-title');

    const updateTitle = () => {
      const current = ytext.toString();
      if (current) {
        setTitle(current);
      } else {
        ytext.insert(0, 'RFC 042: Distributed CRDT Synchronization');
      }
    };

    updateTitle();
    ytext.observe(updateTitle);

    return () => {
      ytext.unobserve(updateTitle);
    };
  }, [ydoc]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    const ytext = ydoc.getText('document-title');
    ydoc.transact(() => {
      ytext.delete(0, ytext.length);
      ytext.insert(0, newTitle);
    });
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-[#090a0d]/90 backdrop-blur-md border-b border-white/[0.07] px-4 py-2.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Minimalist Brand & Document Title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            {/* Geometric Minimal Monogram */}
            <div className="w-6 h-6 rounded bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-xs font-bold shadow-sm">
              S
            </div>
            <span className="text-xs font-semibold text-zinc-100 tracking-tight hidden sm:inline">
              SyncPad
            </span>
          </div>

          <span className="text-zinc-600 hidden sm:inline">/</span>

          {/* Editable Document Title */}
          <div className="min-w-0 max-w-[180px] sm:max-w-[320px] md:max-w-[420px]">
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="Untitled Document"
              className="w-full bg-transparent text-xs sm:text-sm font-medium text-zinc-200 hover:text-white px-1.5 py-0.5 rounded border border-transparent hover:border-white/[0.08] focus:border-white/[0.16] focus:bg-white/[0.03] focus:outline-none transition-colors truncate"
            />
          </div>

          {/* Connection Status Button (Opens Inspector) */}
          <button
            type="button"
            onClick={onOpenInspector}
            className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] transition-colors"
            title="Click to view real-time sync telemetry and inspector"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                connectionStatus === 'connected'
                  ? 'bg-emerald-400'
                  : connectionStatus === 'connecting'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-rose-400'
              }`}
            />
            <span>
              {connectionStatus === 'connected'
                ? 'Synced'
                : connectionStatus === 'connecting'
                ? 'Syncing...'
                : 'Offline'}
            </span>
          </button>
        </div>

        {/* Right: Presence Avatars & Document Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Active Collaborators Bar */}
          <ActiveUsersBar
            collaborators={collaborators}
            currentUser={currentUser}
            onOpenProfile={onOpenProfile}
          />

          <div className="h-4 w-px bg-white/[0.08] mx-1" />

          {/* Collaborator View (Split View) */}
          <button
            type="button"
            onClick={onToggleSplitView}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors border ${
              isSplitView
                ? 'bg-white/10 text-white border-white/20'
                : 'text-zinc-300 border-white/[0.08] hover:bg-white/[0.06] hover:text-white'
            }`}
            title="Toggle side-by-side simulated peer editor"
          >
            <Columns2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {isSplitView ? 'Close Split' : 'Dual View'}
            </span>
          </button>

          {/* Telemetry Inspector Button */}
          <button
            type="button"
            onClick={onOpenInspector}
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08] transition-colors"
            title="Open Sync Telemetry Inspector"
          >
            <Activity className="w-4 h-4" />
          </button>

          {/* Share Button */}
          <button
            type="button"
            onClick={onOpenShare}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-zinc-300 border border-white/[0.08] hover:bg-white/[0.06] hover:text-white transition-colors"
            title="Share Document"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Share</span>
          </button>

          {/* Export Button */}
          <button
            type="button"
            onClick={onOpenExport}
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08] transition-colors"
            title="Export Document"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* New Document Button */}
          <button
            type="button"
            onClick={onNewDocument}
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08] transition-colors"
            title="Create New Document"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
