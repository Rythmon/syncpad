'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import { useCollaboration } from '@/hooks/useCollaboration';
import { ClientCard } from '@/components/Client/ClientCard';
import { CodeEditor } from '@/components/Editor/CodeEditor';
import { SyncTelemetryInspector } from '@/components/Presence/LivePresenceHUD';
import { OfflineBanner } from '@/components/Offline/OfflineBanner';
import {
  Copy,
  Share2,
  LogOut,
  Play,
  Columns2,
  Activity,
  Terminal,
  Code2,
  Settings,
  ChevronDown,
  X,
} from 'lucide-react';

interface EditorPageProps {
  roomId: string;
}

export const EditorPage: React.FC<EditorPageProps> = ({ roomId }) => {
  const router = useRouter();
  const [language, setLanguage] = useState('javascript');
  const [fontSize, setFontSize] = useState(16);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isSplitView, setIsSplitView] = useState(false);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const currentCodeRef = useRef('');

  const {
    ydoc,
    provider,
    connectionStatus,
    isSimulatedOffline,
    toggleOfflineSimulation,
    collaborators,
    currentUser,
    stats,
  } = useCollaboration(roomId);

  // Track joins/leaves for toast notifications matching realtime-code-editor
  const previousPeersRef = useRef<string[]>([]);

  useEffect(() => {
    const currentPeerNames = collaborators.map((c) => c.name);
    const prev = previousPeersRef.current;

    // Detect new joins
    currentPeerNames.forEach((name) => {
      if (!prev.includes(name)) {
        toast.success(`${name} joined the room.`, {
          style: { background: '#282a36', color: '#50fa7b' },
          icon: '👋',
        });
      }
    });

    // Detect leaves
    prev.forEach((name) => {
      if (!currentPeerNames.includes(name)) {
        toast(`${name} left the room.`, {
          style: { background: '#282a36', color: '#ff5555' },
        });
      }
    });

    previousPeersRef.current = currentPeerNames;
  }, [collaborators]);

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success('Room ID has been copied to your clipboard', {
        style: { background: '#282a36', color: '#50fa7b' },
      });
    } catch (err) {
      toast.error('Could not copy the Room ID', {
        style: { background: '#282a36', color: '#ff5555' },
      });
    }
  };

  const copyShareLink = async () => {
    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      toast.success('Invite link copied to clipboard!', {
        style: { background: '#282a36', color: '#50fa7b' },
      });
    } catch (err) {
      toast.error('Could not copy link');
    }
  };

  const leaveRoom = () => {
    router.push('/');
  };

  // Safe client-side JavaScript code runner
  const handleRunCode = () => {
    setIsConsoleOpen(true);
    setConsoleOutput(['Executing code sandbox...']);

    try {
      const ytext = ydoc.getText('codemirror');
      const code = ytext.toString() || currentCodeRef.current;

      const logs: string[] = [];
      const customConsole = {
        log: (...args: any[]) => {
          logs.push(
            args
              .map((a) =>
                typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)
              )
              .join(' ')
          );
        },
        error: (...args: any[]) => {
          logs.push('[Error] ' + args.join(' '));
        },
        warn: (...args: any[]) => {
          logs.push('[Warn] ' + args.join(' '));
        },
      };

      // Execute code with custom console capture
      const runFn = new Function('console', code);
      runFn(customConsole);

      if (logs.length === 0) {
        logs.push('Program completed with exit code 0 (No stdout output).');
      }
      setConsoleOutput(logs);
    } catch (err: any) {
      setConsoleOutput([`Runtime Error: ${err.message}`]);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#1c1e29] text-white">
      <Toaster position="top-right" />

      {/* LEFT SIDEBAR (aside) matching realtime-code-editor-main */}
      <aside className="w-[240px] bg-[#1c1e29] border-r border-[#2b2d3c] flex flex-col justify-between p-4 z-20 shrink-0">
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Flat Brand Logo & Name */}
          <div
            className="border-b border-[#343746] pb-3 mb-4 flex items-center gap-2.5 cursor-pointer select-none group"
            onClick={() => router.push('/')}
            title="SyncPad — Back to Lobby"
          >
            <div className="w-8 h-8 rounded-md bg-[#4aed88] flex items-center justify-center text-[#111827] font-bold text-xs shrink-0">
              SP
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white leading-tight">
                Sync<span className="text-[#4aed88]">Pad</span>
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">Code Editor</span>
            </div>
          </div>

          {/* Connected Peers Header */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Connected
            </h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#282a36] text-[#4aed88]">
              {collaborators.length + 1} online
            </span>
          </div>

          {/* Connected Clients Grid */}
          <div className="flex-1 overflow-y-auto pr-1 flex flex-wrap gap-4 items-start content-start">
            {/* Current user */}
            <ClientCard
              username={currentUser.name}
              color={currentUser.color}
              isCurrentUser={true}
            />

            {/* Remote peers */}
            {collaborators.map((peer) => (
              <ClientCard
                key={peer.clientId}
                username={peer.name}
                color={peer.color}
                isTyping={peer.isTyping}
              />
            ))}
          </div>
        </div>

        {/* Sidebar Bottom Action Buttons matching realtime-code-editor-main */}
        <div className="flex flex-col gap-2 pt-4 border-t border-[#343746]">
          <button
            type="button"
            onClick={copyRoomId}
            className="w-full py-2.5 px-3 bg-[#eeeeee] hover:bg-white text-[#111827] font-bold text-xs rounded transition-colors flex items-center justify-center gap-1.5 shadow"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy ROOM ID</span>
          </button>

          <button
            type="button"
            onClick={copyShareLink}
            className="w-full py-2 px-3 bg-[#282a36] hover:bg-[#343746] text-zinc-200 font-semibold text-xs rounded transition-colors flex items-center justify-center gap-1.5 border border-white/[0.08]"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Link</span>
          </button>

          <button
            type="button"
            onClick={leaveRoom}
            className="w-full py-2.5 px-3 bg-[#4aed88] hover:bg-[#2b824c] text-[#111827] font-bold text-xs rounded transition-colors flex items-center justify-center gap-1.5 shadow"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Leave</span>
          </button>
        </div>
      </aside>

      {/* MAIN EDITOR WORKSPACE */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#282a36]">
        {/* Offline Banner */}
        <OfflineBanner
          isOffline={connectionStatus === 'disconnected' || isSimulatedOffline}
          onReconnect={toggleOfflineSimulation}
        />

        {/* Top Control Bar */}
        <header className="h-12 bg-[#191a21] border-b border-[#343746] px-4 flex items-center justify-between gap-3 shrink-0 text-xs select-none">
          {/* Left: Language & Font Selectors */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <Code2 className="w-4 h-4 text-[#4aed88]" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-[#282a36] border border-[#44475a] text-zinc-200 px-2.5 py-1 rounded text-xs outline-none focus:border-[#4aed88] transition-colors cursor-pointer"
              >
                <option value="javascript">JavaScript / Node.js</option>
                <option value="python">Python</option>
                <option value="cpp">C / C++</option>
                <option value="html">HTML / XML</option>
                <option value="markdown">Markdown</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-zinc-400">
              <span className="text-[11px]">Size:</span>
              <select
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="bg-[#282a36] border border-[#44475a] text-zinc-200 px-2 py-1 rounded text-xs outline-none focus:border-[#4aed88] transition-colors cursor-pointer"
              >
                <option value={14}>14px</option>
                <option value={16}>16px</option>
                <option value={18}>18px</option>
                <option value={20}>20px</option>
              </select>
            </div>
          </div>

          {/* Right: Actions (Run, Dual View, Telemetry) */}
          <div className="flex items-center gap-2">
            {/* Run Code */}
            <button
              type="button"
              onClick={handleRunCode}
              className="flex items-center gap-1.5 px-3 py-1 bg-[#4aed88] hover:bg-[#2b824c] text-[#111827] font-bold rounded text-xs transition-colors shadow"
              title="Run JavaScript code in safe sandbox"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run</span>
            </button>

            {/* Dual View Toggle */}
            <button
              type="button"
              onClick={() => setIsSplitView((prev) => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-semibold transition-colors ${
                isSplitView
                  ? 'bg-white/10 text-white border-white/20'
                  : 'bg-[#282a36] text-zinc-300 border-[#44475a] hover:bg-[#343746]'
              }`}
              title="Split screen into two concurrent collaborative editors"
            >
              <Columns2 className="w-3.5 h-3.5" />
              <span>{isSplitView ? 'Close Split' : 'Dual View'}</span>
            </button>

            {/* Sync Telemetry Inspector */}
            <button
              type="button"
              onClick={() => setIsInspectorOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#282a36] hover:bg-[#343746] text-zinc-300 border border-[#44475a] text-xs font-medium transition-colors"
              title="Inspect real-time CRDT vector clocks and Redis pub/sub"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected'
                    ? 'bg-[#4aed88]'
                    : connectionStatus === 'connecting'
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-rose-400'
                }`}
              />
              <span className="hidden sm:inline">Telemetry</span>
            </button>
          </div>
        </header>

        {/* Editor Body */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Main Collaborative CodeMirror Editor */}
          <div className="flex-1 h-full flex flex-col overflow-hidden">
            <CodeEditor
              ydoc={ydoc}
              provider={provider}
              roomId={roomId}
              language={language}
              fontSize={fontSize}
              onCodeChange={(code) => {
                currentCodeRef.current = code;
              }}
            />
          </div>

          {/* Dual View (Second Simulated Peer Editor) */}
          {isSplitView && (
            <div className="w-1/2 h-full border-l-2 border-[#44475a] flex flex-col bg-[#282a36]">
              <div className="bg-[#191a21] px-3 py-1.5 border-b border-[#343746] flex items-center justify-between text-xs text-zinc-300 font-semibold">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  Concurrent Peer 2 (Elena Rostova)
                </span>
                <button
                  type="button"
                  onClick={() => setIsSplitView(false)}
                  className="p-1 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex-1 h-full overflow-hidden">
                <CodeEditor
                  ydoc={ydoc}
                  provider={provider}
                  roomId={roomId}
                  language={language}
                  fontSize={fontSize}
                />
              </div>
            </div>
          )}
        </div>

        {/* Console Execution Output Drawer */}
        {isConsoleOpen && (
          <div className="h-44 bg-[#191a21] border-t border-[#343746] flex flex-col shrink-0 z-10 text-xs">
            <div className="flex items-center justify-between px-3 py-1.5 bg-[#21222c] border-b border-[#343746] text-zinc-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-[#4aed88]" />
                <span>Console Output</span>
              </span>
              <button
                type="button"
                onClick={() => setIsConsoleOpen(false)}
                className="p-1 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 font-mono text-[12px] text-zinc-300 space-y-1">
              {consoleOutput.map((out, idx) => (
                <pre key={idx} className="whitespace-pre-wrap font-mono">
                  {out}
                </pre>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sync Engine Telemetry Inspector */}
      <SyncTelemetryInspector
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        stats={stats}
        connectionStatus={connectionStatus}
        onToggleOffline={toggleOfflineSimulation}
      />
    </div>
  );
};
