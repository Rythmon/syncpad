'use client';

import React from 'react';
import { useCollaboration } from '@/hooks/useCollaboration';
import { CollaborativeEditor } from '@/components/Editor/CollaborativeEditor';
import { X, Sparkles, UserCheck } from 'lucide-react';

interface SplitViewSimulatorProps {
  roomId: string;
  onClose: () => void;
}

export const SplitViewSimulator: React.FC<SplitViewSimulatorProps> = ({
  roomId,
  onClose,
}) => {
  // Second collaborator instance on the same document
  const peer = useCollaboration(roomId);

  return (
    <div className="flex flex-col h-full bg-slate-950/80 border-l border-slate-800 p-4 animate-in slide-in-from-right duration-300">
      {/* Peer Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow"
            style={{ backgroundColor: peer.currentUser.color }}
          >
            P2
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-200">
                Peer 2: {peer.currentUser.name}
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-indigo-900/60 text-indigo-300 border border-indigo-700/50">
                Simulated Peer
              </span>
            </div>
            <span className="text-[10px] text-slate-400">
              Live CRDT Replica over WebSocket
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Close Split View"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Peer Tip */}
      <div className="mb-3 px-3 py-2 bg-indigo-950/40 border border-indigo-800/40 rounded-xl text-[11px] text-indigo-200 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
        <span>
          Type below to test simultaneous concurrent edits and watch live cursors synchronize in real time!
        </span>
      </div>

      {/* Peer Collaborative Editor */}
      <div className="flex-1 overflow-y-auto">
        <CollaborativeEditor
          ydoc={peer.ydoc}
          provider={peer.provider}
          currentUser={peer.currentUser}
          isSimulatedOffline={peer.isSimulatedOffline}
          roomId={roomId}
        />
      </div>
    </div>
  );
};
