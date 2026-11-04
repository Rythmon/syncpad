'use client';

import React from 'react';

export const EditorSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#090a0d] text-zinc-100">
      {/* Navbar Skeleton */}
      <div className="w-full bg-[#090a0d] border-b border-white/[0.07] px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-zinc-800 animate-pulse" />
            <div className="h-4 w-48 bg-zinc-800/80 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-7 w-16 bg-zinc-800/60 rounded-md animate-pulse" />
            <div className="h-7 w-7 rounded-full bg-zinc-800/60 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Editor Content Skeleton */}
      <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-[#101217] border border-white/[0.08] rounded-xl shadow-xl overflow-hidden p-8 sm:p-12 space-y-6">
          <div className="h-8 w-3/4 bg-zinc-800/70 rounded-md animate-pulse" />
          <div className="space-y-3 pt-4">
            <div className="h-4 w-full bg-zinc-800/40 rounded animate-pulse" />
            <div className="h-4 w-5/6 bg-zinc-800/40 rounded animate-pulse" />
            <div className="h-4 w-2/3 bg-zinc-800/40 rounded animate-pulse" />
          </div>
          <div className="h-5 w-1/3 bg-zinc-800/60 rounded-md animate-pulse pt-4" />
          <div className="space-y-2">
            <div className="h-4 w-full bg-zinc-800/30 rounded animate-pulse" />
            <div className="h-4 w-4/5 bg-zinc-800/30 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
};
