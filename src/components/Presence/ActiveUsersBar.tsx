'use client';

import React from 'react';
import { Collaborator } from '@/hooks/useCollaboration';

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

  const typingPeers = collaborators.filter((c) => c.isTyping);

  return (
    <div className="flex items-center gap-2">
      {/* Subtle typing indicator */}
      {typingPeers.length > 0 && (
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] text-[11px] text-zinc-300">
          <span className="flex gap-0.5 items-center">
            <span className="w-1 h-1 rounded-full bg-indigo-400 animate-bounce" />
            <span className="w-1 h-1 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.15s]" />
            <span className="w-1 h-1 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.3s]" />
          </span>
          <span className="font-medium">
            {typingPeers.length === 1
              ? `${typingPeers[0].name.split(' ')[0]} is typing...`
              : `${typingPeers.length} people are typing...`}
          </span>
        </div>
      )}

      {/* Avatar Stack */}
      <div className="flex items-center -space-x-1.5 overflow-hidden py-1">
        {/* Local user avatar */}
        <button
          type="button"
          onClick={onOpenProfile}
          className="relative inline-flex items-center justify-center w-7 h-7 rounded-full ring-2 ring-[#090a0d] shadow transition-transform hover:scale-105 hover:z-20 focus:outline-none cursor-pointer"
          style={{ backgroundColor: currentUser.color }}
          title={`You (${currentUser.name}) · Click to edit profile`}
        >
          <span className="text-[10px] font-semibold text-white leading-none">
            {getInitials(currentUser.name)}
          </span>
          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full ring-1 ring-[#090a0d]" />
        </button>

        {/* Remote Collaborators */}
        {collaborators.map((peer) => (
          <div
            key={peer.clientId}
            className="relative inline-flex items-center justify-center w-7 h-7 rounded-full ring-2 ring-[#090a0d] shadow transition-transform hover:scale-105 hover:z-20 cursor-default"
            style={{ backgroundColor: peer.color }}
            title={`${peer.name} ${peer.isTyping ? '(typing)' : '(viewing)'}`}
          >
            <span className="text-[10px] font-semibold text-white leading-none">
              {getInitials(peer.name)}
            </span>
            {peer.isTyping && (
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-amber-400 rounded-full ring-1 ring-[#090a0d]" />
            )}
          </div>
        ))}
      </div>

      {/* Total collaborators count */}
      {collaborators.length > 0 && (
        <span className="text-[11px] font-medium text-zinc-400 px-1.5 py-0.5 rounded bg-white/[0.05]">
          +{collaborators.length}
        </span>
      )}
    </div>
  );
};
