'use client';

import React from 'react';
import { WifiOff, ShieldCheck, RefreshCw } from 'lucide-react';

interface OfflineBannerProps {
  isOffline: boolean;
  onReconnect: () => void;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ isOffline, onReconnect }) => {
  if (!isOffline) return null;

  return (
    <div className="w-full bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border-b border-amber-500/30 px-4 py-2.5 shadow-lg backdrop-blur-md animate-in slide-in-from-top-2 duration-300">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-amber-200">
          <div className="p-1 rounded bg-amber-500/20 text-amber-400">
            <WifiOff className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-amber-300 mr-1.5">Offline-First Mode Active:</span>
            <span>
              Network is disconnected. All your edits are saved locally to{' '}
              <strong className="text-white font-medium">IndexedDB</strong> and will merge
              conflict-free via Yjs CRDT upon reconnection.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-800/40">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>IndexedDB Synced</span>
          </div>
          <button
            type="button"
            onClick={onReconnect}
            className="flex items-center gap-1.5 px-3 py-1 bg-amber-500 text-slate-950 font-semibold rounded-lg hover:bg-amber-400 transition-colors shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reconnect</span>
          </button>
        </div>
      </div>
    </div>
  );
};
