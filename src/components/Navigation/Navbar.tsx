'use client';

import React, { useState, useEffect } from 'react';
import * as Y from 'yjs';
import { ActiveUsersBar } from '@/components/Presence/ActiveUsersBar';
import { Collaborator } from '@/hooks/useCollaboration';
import {
  FileText,
  Share2,
  Download,
  Columns,
  Wifi,
  WifiOff,
  FolderPlus,
  Edit3,
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
}) => {
  const [title, setTitle] = useState('SyncPad Document');

  // Synchronize document title via Yjs CRDT Text
  useEffect(() => {
    const ytext = ydoc.getText('document-title');

    const updateTitle = () => {
      const current = ytext.toString();
      if (current) {
        setTitle(current);
      } else {
        ytext.insert(0, 'SyncPad Document');
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
    <header className="sticky top-0 z-30 w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Brand & Synced Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div className="hidden md:flex flex-col">
              <span className="text-sm font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                SyncPad
              </span>
              <span className="text-[10px] text-indigo-400 font-mono -mt-1">CRDT Real-Time</span>
            </div>
          </div>

          <div className="h-5 w-px bg-slate-800 hidden sm:block" />

          {/* Synced Title Input */}
          <div className="relative flex items-center group max-w-[200px] sm:max-w-[280px]">
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="Untitled Document"
              className="w-full bg-transparent text-sm font-semibold text-slate-200 border border-transparent rounded-lg px-2 py-1 hover:border-slate-800 focus:border-indigo-500/50 focus:bg-slate-900/50 focus:outline-none transition-all truncate"
            />
            <Edit3 className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 pointer-events-none" />
          </div>

          {/* Connection Status Pill */}
          <div
            className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
              connectionStatus === 'connected'
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40'
                : connectionStatus === 'connecting'
                ? 'bg-amber-950/40 text-amber-300 border-amber-800/40'
                : 'bg-rose-950/40 text-rose-300 border-rose-800/40'
            }`}
          >
            {connectionStatus === 'connected' ? (
              <>
                <Wifi className="w-3 h-3 text-emerald-400 animate-pulse" />
                <span>Connected</span>
              </>
            ) : connectionStatus === 'connecting' ? (
              <>
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>Syncing...</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-rose-400" />
                <span>Offline (IndexedDB)</span>
              </>
            )}
          </div>
        </div>

        {/* Right: Collaborators & Action Buttons */}
        <div className="flex items-center gap-2.5">
          {/* Active Collaborators Bar */}
          <ActiveUsersBar
            collaborators={collaborators}
            currentUser={currentUser}
            onOpenProfile={onOpenProfile}
          />

          <div className="h-5 w-px bg-slate-800 hidden sm:block" />

          {/* Split-View Simulator Toggle */}
          <button
            type="button"
            onClick={onToggleSplitView}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              isSplitView
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
            }`}
            title="Split screen into two simultaneous collaborative peers"
          >
            <Columns className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {isSplitView ? 'Close Split' : 'Split-View Demo'}
            </span>
          </button>

          {/* Share Button */}
          <button
            type="button"
            onClick={onOpenShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white transition-all"
            title="Share room link"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Share</span>
          </button>

          {/* Export Button */}
          <button
            type="button"
            onClick={onOpenExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white transition-all"
            title="Export Document"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Export</span>
          </button>

          {/* New Document Button */}
          <button
            type="button"
            onClick={onNewDocument}
            className="p-1.5 rounded-xl bg-slate-900 text-slate-400 border border-slate-800 hover:text-white hover:bg-slate-800 transition-colors"
            title="Create New Document Room"
          >
            <FolderPlus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
