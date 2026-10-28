'use client';

import React from 'react';
import { Collaborator } from '@/hooks/useCollaboration';
import { User, Users, Sparkles } from 'lucide-react';

interface ActiveUsersBarProps {
  collaborators: Collaborator[];
  currentUser: { name: string; color: string };
  onOpenProfile: () => void;
}

export const ActiveUsersBar: React.FC<ActiveUsersBarProps> = ({
  collaborators,
  currentUser,
  onOpenProfile,
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const typingCount = collaborators.filter((c) => c.isTyping).length;

  return (
    <div className="flex items-center gap-2">
      {/* Typing indicator toast */}
      {typingCount > 0 && (
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-950/70 border border-indigo-800/60 text-xs text-indigo-300 animate-pulse">
          <Sparkles className="w-3 h-3 text-indigo-400" />
          <span>
            {typingCount === 1
              ? `${collaborators.find((c) => c.isTyping)?.name} is typing...`
              : `${typingCount} peers are typing...`}
          </span>
        </div>
      )}

      {/* Collaborator Avatars */}
      <div className="flex items-center -space-x-2 overflow-hidden py-1">
        {/* Current user avatar */}
        <button
          type="button"
          onClick={onOpenProfile}
          className="relative inline-flex items-center justify-center w-8 h-8 rounded-full border-2 border-slate-900 shadow-md transition-transform hover:scale-110 hover:z-20 focus:outline-none"
          style={{ backgroundColor: currentUser.color }}
          title={`You (${currentUser.name}) - Click to customize`}
        >
          <span className="text-[11px] font-bold text-white leading-none">
            {getInitials(currentUser.name)}
          </span>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-900" />
        </button>

        {/* Remote Collaborators */}
        {collaborators.map((peer) => (
          <div
            key={peer.clientId}
            className="relative inline-flex items-center justify-center w-8 h-8 rounded-full border-2 border-slate-900 shadow-md transition-transform hover:scale-110 hover:z-20 cursor-default"
            style={{ backgroundColor: peer.color }}
            title={`${peer.name} ${peer.isTyping ? '(Typing...)' : '(Active)'}`}
          >
            <span className="text-[11px] font-bold text-white leading-none">
              {getInitials(peer.name)}
            </span>
            {peer.isTyping ? (
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-slate-900 animate-ping" />
            ) : (
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-indigo-400 rounded-full border-2 border-slate-900" />
            )}
          </div>
        ))}
      </div>

      {/* Total Count Badge */}
      <div
        className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs font-medium text-slate-300"
        title={`${collaborators.length + 1} collaborators currently connected`}
      >
        <Users className="w-3.5 h-3.5 text-slate-400" />
        <span>{collaborators.length + 1}</span>
      </div>
    </div>
  );
};
