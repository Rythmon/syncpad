'use client';

import React, { useState } from 'react';
import { CollaborationStats } from '@/hooks/useCollaboration';
import { formatBytes } from '@/lib/utils';
import {
  Activity,
  HardDrive,
  Radio,
  Layers,
  ChevronDown,
  ChevronUp,
  Database,
  Wifi,
  WifiOff,
} from 'lucide-react';

interface LivePresenceHUDProps {
  stats: CollaborationStats;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  onToggleOffline: () => void;
}

export const LivePresenceHUD: React.FC<LivePresenceHUDProps> = ({
  stats,
  connectionStatus,
  onToggleOffline,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const getLatencyColor = (ms: number) => {
    if (ms <= 25) return 'text-emerald-400';
    if (ms <= 60) return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col bg-slate-900/90 border border-slate-800 rounded-xl shadow-2xl backdrop-blur-md max-w-sm w-80 text-xs transition-all overflow-hidden">
      {/* Header / Toggle */}
      <div
        className="flex items-center justify-between px-3.5 py-2.5 bg-slate-800/60 border-b border-slate-700/50 cursor-pointer select-none hover:bg-slate-800/80 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2 font-semibold text-slate-200">
          <Activity className="w-4 h-4 text-indigo-400" />
          <span>Real-Time CRDT Diagnostics</span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected'
                ? 'bg-emerald-400 animate-pulse'
                : connectionStatus === 'connecting'
                ? 'bg-amber-400 animate-ping'
                : 'bg-rose-400'
            }`}
          />
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </div>

      {/* Expanded Metrics Panel */}
      {isExpanded && (
        <div className="p-3.5 space-y-3">
          {/* Grid Stats */}
          <div className="grid grid-cols-2 gap-2">
            {/* WebSocket Latency */}
            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium flex items-center gap-1">
                <Radio className="w-3 h-3 text-indigo-400" />
                RTT Ping
              </span>
              <span className={`text-base font-bold font-mono mt-0.5 ${getLatencyColor(stats.latencyMs)}`}>
                {connectionStatus === 'connected' ? `${stats.latencyMs} ms` : 'Disconnected'}
              </span>
            </div>

            {/* Document Size */}
            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium flex items-center gap-1">
                <HardDrive className="w-3 h-3 text-cyan-400" />
                Doc CRDT
              </span>
              <span className="text-base font-bold font-mono text-cyan-300 mt-0.5">
                {formatBytes(stats.docByteSize)}
              </span>
            </div>

            {/* CRDT Vector Ops */}
            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium flex items-center gap-1">
                <Layers className="w-3 h-3 text-violet-400" />
                Vector Updates
              </span>
              <span className="text-base font-bold font-mono text-violet-300 mt-0.5">
                {stats.updateCount} ops
              </span>
            </div>

            {/* IndexedDB Status */}
            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium flex items-center gap-1">
                <Database className="w-3 h-3 text-emerald-400" />
                IndexedDB
              </span>
              <span className="text-xs font-semibold text-emerald-300 mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Persistent
              </span>
            </div>
          </div>

          {/* Redis PubSub Status */}
          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[11px] flex items-center justify-between">
            <span className="text-slate-400">Presence Layer:</span>
            <span className="font-mono text-indigo-300 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Redis Pub/Sub Layer
            </span>
          </div>

          {/* Offline Simulation Button */}
          <button
            type="button"
            onClick={onToggleOffline}
            className={`w-full py-2 px-3 rounded-lg font-medium text-xs flex items-center justify-center gap-2 border transition-all ${
              stats.isSimulatedOffline
                ? 'bg-rose-950/60 text-rose-300 border-rose-800/60 hover:bg-rose-900/60'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750 hover:text-white'
            }`}
          >
            {stats.isSimulatedOffline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>Reconnect WebSocket (Sync CRDT)</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span>Simulate Offline Network Drop</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
