'use client';

import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

interface OfflineBannerProps {
  isOffline: boolean;
  onReconnect: () => void;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ isOffline, onReconnect }) => {
  if (!isOffline) return null;

  return (
    <div className="w-full bg-[#181308] border-b border-amber-500/20 px-4 py-2 text-xs">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-amber-300">
          <WifiOff className="w-3.5 h-3.5 shrink-0 text-amber-400" />
          <span>
            <strong className="font-semibold text-amber-200">Disconnected:</strong> Edits are saved locally to IndexedDB and will reconcile conflict-free once reconnected.
          </span>
        </div>

        <button
          type="button"
          onClick={onReconnect}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 border border-amber-500/30 rounded text-xs font-medium transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Reconnect</span>
        </button>
      </div>
    </div>
  );
};
