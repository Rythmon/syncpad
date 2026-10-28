'use client';

import React from 'react';
import { FileText } from 'lucide-react';

export const EditorSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19] text-slate-100">
      {/* Navbar Skeleton */}
      <div className="w-full bg-slate-950/80 border-b border-slate-800/80 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/30 flex items-center justify-center animate-pulse">
              <FileText className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="h-5 w-32 bg-slate-800 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-20 bg-slate-800 rounded-xl animate-pulse" />
            <div className="h-8 w-8 rounded-full bg-slate-800 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Editor Content Skeleton */}
      <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl shadow-xl overflow-hidden p-8 space-y-6">
          <div className="h-9 w-2/3 bg-slate-800/70 rounded-lg animate-pulse" />
          <div className="space-y-3 pt-4">
            <div className="h-4 w-full bg-slate-800/50 rounded animate-pulse" />
            <div className="h-4 w-5/6 bg-slate-800/50 rounded animate-pulse" />
            <div className="h-4 w-4/6 bg-slate-800/50 rounded animate-pulse" />
          </div>
          <div className="h-6 w-1/3 bg-slate-800/60 rounded-lg animate-pulse pt-2" />
          <div className="space-y-2">
            <div className="h-4 w-full bg-slate-800/40 rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-slate-800/40 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
};
