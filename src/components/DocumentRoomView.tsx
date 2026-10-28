'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCollaboration } from '@/hooks/useCollaboration';
import { Navbar } from '@/components/Navigation/Navbar';
import { CollaborativeEditor } from '@/components/Editor/CollaborativeEditor';
import { OfflineBanner } from '@/components/Offline/OfflineBanner';
import { LivePresenceHUD } from '@/components/Presence/LivePresenceHUD';
import { SplitViewSimulator } from '@/components/Simulation/SplitViewSimulator';
import { ProfileModal } from '@/components/Modals/ProfileModal';
import { ExportModal } from '@/components/Modals/ExportModal';
import { ShareModal } from '@/components/Modals/ShareModal';

interface DocumentRoomViewProps {
  roomId: string;
}

export const DocumentRoomView: React.FC<DocumentRoomViewProps> = ({ roomId }) => {
  const router = useRouter();
  const [isSplitView, setIsSplitView] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

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
    const randomId = `doc-${Math.random().toString(36).substring(2, 8)}`;
    router.push(`/doc/${randomId}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19] text-slate-100">
      {/* Top Navigation */}
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
      />

      {/* Offline Alert Banner */}
      <OfflineBanner
        isOffline={connectionStatus === 'disconnected' || isSimulatedOffline}
        onReconnect={toggleOfflineSimulation}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isSplitView ? (
          /* Side-by-Side Multi-Peer Simulation Grid */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-140px)]">
            <div className="flex flex-col h-full overflow-y-auto pr-1">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: currentUser.color }}
                  />
                  Peer 1: {currentUser.name} (You)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Primary Node</span>
              </div>
              <CollaborativeEditor
                ydoc={ydoc}
                provider={provider}
                currentUser={currentUser}
                isSimulatedOffline={isSimulatedOffline}
                roomId={roomId}
              />
            </div>

            <div className="h-full overflow-hidden rounded-2xl border border-slate-800 shadow-2xl">
              <SplitViewSimulator
                roomId={roomId}
                onClose={() => setIsSplitView(false)}
              />
            </div>
          </div>
        ) : (
          /* Single Editor Layout */
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

      {/* Floating CRDT Diagnostics HUD */}
      <LivePresenceHUD
        stats={stats}
        connectionStatus={connectionStatus}
        onToggleOffline={toggleOfflineSimulation}
      />

      {/* Modals */}
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
        documentTitle={ydoc.getText('document-title').toString() || 'SyncPad Document'}
      />

      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        roomId={roomId}
      />
    </div>
  );
};
