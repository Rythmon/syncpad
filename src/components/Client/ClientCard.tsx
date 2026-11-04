'use client';

import React from 'react';

interface ClientCardProps {
  username: string;
  color?: string;
  isCurrentUser?: boolean;
  isTyping?: boolean;
}

export const ClientCard: React.FC<ClientCardProps> = ({
  username,
  color = '#4aed88',
  isCurrentUser = false,
  isTyping = false,
}) => {
  const getInitials = (name: string) => {
    return name
      .trim()
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  };

  return (
    <div className="flex flex-col items-center group relative cursor-default select-none">
      {/* Avatar Box (50x50 with 14px rounded corners matching realtime-code-editor) */}
      <div
        className="w-[50px] h-[50px] rounded-[14px] flex items-center justify-center text-white font-bold text-sm shadow-md transition-transform group-hover:scale-105 relative"
        style={{ backgroundColor: color }}
        title={`${username} ${isCurrentUser ? '(You)' : ''}`}
      >
        <span>{getInitials(username)}</span>

        {/* Live indicator / Typing badge */}
        {isTyping ? (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-[#1c1e29] animate-ping" />
        ) : (
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#4aed88] border-2 border-[#1c1e29]" />
        )}
      </div>

      {/* Username label */}
      <span className="mt-2 text-xs font-semibold text-zinc-200 max-w-[80px] truncate text-center">
        {username}
        {isCurrentUser && <span className="text-[10px] text-zinc-500 block -mt-0.5">(You)</span>}
      </span>
    </div>
  );
};
