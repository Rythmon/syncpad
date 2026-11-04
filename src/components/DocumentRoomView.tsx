'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCollaboration } from '@/hooks/useCollaboration';
import { Navbar } from '@/components/Navigation/Navbar';
import { CollaborativeEditor } from '@/components/Editor/CollaborativeEditor';
import { OfflineBanner } from '@/components/Offline/OfflineBanner';
import { SyncTelemetryInspector } from '@/components/Presence/LivePresenceHUD';
import { SplitViewSimulator } from '@/components/Simulation/SplitViewSimulator';
import { ProfileModal } from '@/components/Modals/ProfileModal';
import { ExportModal } from '@/components/Modals/ExportModal';
import { ShareModal } from '@/components/Modals/ShareModal';
import { EditorSkeleton } from '@/components/Editor/EditorSkeleton';
import { Activity } from 'lucide-react';

interface DocumentRoomViewProps {
  roomId: string;
}

export const DocumentRoomView: React.FC<DocumentRoomViewProps> = ({ roomId }) => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isSplitView, setIsSplitView] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    ydoc,
    provider,
    connectionStatus,
    isSimulatedOffline,
    toggleOfflineSimulation,
    collaborators,
    currentUser,
    updateProfile,
    stats,
  } = useCollaboration(roomId);

  const handleNewDocument = () => {
    const randomId = `rfc-${Math.random().toString(36).substring(2, 7)}`;
    router.push(`/doc/${randomId}`);
  };

  if (!mounted) {
    return <EditorSkeleton />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#090a0d] text-zinc-100">
      {/* Top Minimalist Navigation */}
      <Navbar
        roomId={roomId}
        ydoc={ydoc}
        connectionStatus={connectionStatus}
        collaborators={collaborators}
        currentUser={currentUser}
        isSplitView={isSplitView}
        onToggleSplitView={() => setIsSplitView((prev) => !prev)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenShare={() => setIsShareOpen(true)}
        onNewDocument={handleNewDocument}
        onOpenInspector={() => setIsInspectorOpen(true)}
      />

      {/* Offline Alert Banner */}
      <OfflineBanner
        isOffline={connectionStatus === 'disconnected' || isSimulatedOffline}
        onReconnect={toggleOfflineSimulation}
      />

      {/* Main Workspace Canvas */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isSplitView ? (
          /* Multi-Peer Concurrent Playground Grid */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-140px)]">
            <div className="flex flex-col h-full overflow-y-auto pr-1">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: currentUser.color }}
                  />
                  <span className="text-xs font-semibold text-zinc-200">
                    Primary Editor · {currentUser.name} (You)
                  </span>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">Local Node</span>
              </div>
              <CollaborativeEditor
                ydoc={ydoc}
                provider={provider}
                currentUser={currentUser}
                isSimulatedOffline={isSimulatedOffline}
                roomId={roomId}
              />
            </div>

            <div className="h-full overflow-hidden rounded-xl border border-white/[0.08] shadow-2xl">
              <SplitViewSimulator
                roomId={roomId}
                onClose={() => setIsSplitView(false)}
              />
            </div>
          </div>
        ) : (
          /* Single Document View (Readable Measure) */
          <div className="max-w-4xl mx-auto">
            <CollaborativeEditor
              ydoc={ydoc}
              provider={provider}
              currentUser={currentUser}
              isSimulatedOffline={isSimulatedOffline}
              roomId={roomId}
            />
          </div>
        )}
      </main>

      {/* Quiet Non-Intrusive Bottom Status Chip */}
      <div className="fixed bottom-4 right-4 z-30">
        <button
          type="button"
          onClick={() => setIsInspectorOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#111318]/90 hover:bg-[#161920] border border-white/[0.08] text-xs text-zinc-400 hover:text-zinc-200 shadow-lg backdrop-blur-md transition-colors"
          title="Open Real-Time CRDT Telemetry & Inspector"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              connectionStatus === 'connected'
                ? 'bg-emerald-400'
                : connectionStatus === 'connecting'
                ? 'bg-amber-400 animate-pulse'
                : 'bg-rose-400'
            }`}
          />
          <span className="font-mono text-[11px]">
            {connectionStatus === 'connected' ? `${stats.latencyMs}ms` : 'Offline'}
          </span>
          <span className="text-zinc-600">·</span>
          <span className="font-mono text-[11px]">{stats.updateCount} ops</span>
          <span className="text-zinc-600 hidden sm:inline">·</span>
          <span className="hidden sm:flex items-center gap-1 text-[11px] text-zinc-400">
            <Activity className="w-3 h-3 text-indigo-400" />
            <span>Inspector</span>
          </span>
        </button>
      </div>

      {/* Modals & Telemetry Drawer */}
      <SyncTelemetryInspector
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        stats={stats}
        connectionStatus={connectionStatus}
        onToggleOffline={toggleOfflineSimulation}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentUser={currentUser}
        onSave={updateProfile}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        ydoc={ydoc}
        documentTitle={ydoc.getText('document-title').toString() || 'RFC 042: Distributed CRDT Synchronization'}
      />

      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        roomId={roomId}
      />
    </div>
  );
};
