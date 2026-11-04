'use client';

import React from 'react';
import { CollaborationStats } from '@/hooks/useCollaboration';
import { formatBytes } from '@/lib/utils';
import {
  Activity,
  HardDrive,
  Radio,
  Layers,
  Database,
  Wifi,
  WifiOff,
  X,
  Server,
  Terminal,
} from 'lucide-react';

interface SyncTelemetryInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  stats: CollaborationStats;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  onToggleOffline: () => void;
}

export const SyncTelemetryInspector: React.FC<SyncTelemetryInspectorProps> = ({
  isOpen,
  onClose,
  stats,
  connectionStatus,
  onToggleOffline,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-[#111318] border border-white/[0.08] rounded-xl shadow-2xl p-6 text-zinc-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-white/[0.06] text-zinc-200">
              <Activity className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">
                Sync Engine &amp; CRDT Telemetry
              </h2>
              <p className="text-[11px] text-zinc-400">
                Low-level diagnostics for distributed consistency &amp; presence
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Telemetry Metrics Grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          {/* Latency */}
          <div className="p-3 rounded-lg bg-[#0c0e12] border border-white/[0.06] flex flex-col">
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-indigo-400" />
                RTT Latency
              </span>
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-emerald-400' : 'bg-rose-400'
                }`}
              />
            </div>
            <span className="text-lg font-mono font-semibold text-zinc-100 mt-1">
              {connectionStatus === 'connected' ? `${stats.latencyMs} ms` : 'Disconnected'}
            </span>
            <span className="text-[10px] text-zinc-500 mt-0.5">WebSocket ping round-trip</span>
          </div>

          {/* CRDT Document Size */}
          <div className="p-3 rounded-lg bg-[#0c0e12] border border-white/[0.06] flex flex-col">
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span className="flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-sky-400" />
                CRDT State Size
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">Y.Doc</span>
            </div>
            <span className="text-lg font-mono font-semibold text-zinc-100 mt-1">
              {formatBytes(stats.docByteSize)}
            </span>
            <span className="text-[10px] text-zinc-500 mt-0.5">Compact binary state vector</span>
          </div>

          {/* Reconciled Ops */}
          <div className="p-3 rounded-lg bg-[#0c0e12] border border-white/[0.06] flex flex-col">
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-violet-400" />
                CRDT Operations
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">Lamport</span>
            </div>
            <span className="text-lg font-mono font-semibold text-zinc-100 mt-1">
              {stats.updateCount} ops
            </span>
            <span className="text-[10px] text-zinc-500 mt-0.5">Commutative delta mutations</span>
          </div>

          {/* IndexedDB Persistence */}
          <div className="p-3 rounded-lg bg-[#0c0e12] border border-white/[0.06] flex flex-col">
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                IndexedDB Store
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">Active</span>
            </div>
            <span className="text-sm font-semibold text-zinc-200 mt-1">
              Offline-First Layer
            </span>
            <span className="text-[10px] text-zinc-500 mt-0.5">Synchronous local durability</span>
          </div>
        </div>

        {/* Cluster Architecture Info */}
        <div className="p-3 rounded-lg bg-[#0c0e12] border border-white/[0.06] text-xs space-y-2 mb-4">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <Server className="w-3 h-3 text-zinc-500" />
              Presence Relay
            </span>
            <span className="font-mono text-zinc-300">Redis Pub/Sub (Cluster Bus)</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <Terminal className="w-3 h-3 text-zinc-500" />
              Sync Protocol
            </span>
            <span className="font-mono text-zinc-300">Yjs Binary Protocol v1</span>
          </div>
        </div>

        {/* Offline Simulation Control */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onToggleOffline}
            className={`w-full py-2.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-2 border transition-colors ${
              stats.isSimulatedOffline
                ? 'bg-rose-500/10 text-rose-300 border-rose-500/20 hover:bg-rose-500/20'
                : 'bg-white/[0.05] text-zinc-300 border-white/[0.08] hover:bg-white/[0.08] hover:text-white'
            }`}
          >
            {stats.isSimulatedOffline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>Reconnect WebSocket (Reconcile CRDT Vector)</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span>Simulate Network Disconnection</span>
              </>
            )}
          </button>
          <p className="text-[10px] text-zinc-500 text-center mt-2">
            Disconnection allows testing local IndexedDB mutation queue and automatic CRDT delta reconciliation.
          </p>
        </div>
      </div>
    </div>
  );
};
