'use client';

import React from 'react';
import * as Y from 'yjs';
import { useCollaboration } from '@/hooks/useCollaboration';
import { CollaborativeEditor } from '@/components/Editor/CollaborativeEditor';
import { X } from 'lucide-react';

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
    <div className="flex flex-col h-full bg-[#0d0f14] border-l border-white/[0.08] p-4 animate-in slide-in-from-right duration-200">
      {/* Peer Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow"
            style={{ backgroundColor: peer.currentUser.color }}
          >
            {peer.currentUser.name
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-200">
                {peer.currentUser.name}
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-white/[0.06] text-zinc-400 font-mono">
                Concurrent Peer
              </span>
            </div>
            <span className="text-[10px] text-zinc-500">
              Active WebSocket CRDT replica session
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
            title="Close Split View"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Peer Collaborative Canvas */}
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
