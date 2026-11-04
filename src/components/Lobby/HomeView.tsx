'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import { ArrowRight } from 'lucide-react';

export const HomeView: React.FC = () => {
  const router = useRouter();
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('syncpad_username') || '';
    }
    return '';
  });

  const generateRoomId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `room-${Math.random().toString(36).substring(2, 9)}-${Date.now().toString(36)}`;
  };

  const createNewRoom = (e: React.MouseEvent) => {
    e.preventDefault();
    const id = generateRoomId();
    setRoomId(id);
    toast.success('Created a new room ID', {
      style: {
        background: '#282a36',
        color: '#50fa7b',
      },
    });
  };

  const handleJoin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!roomId.trim() || !username.trim()) {
      toast.error('ROOM ID & username is required', {
        style: {
          background: '#282a36',
          color: '#ff5555',
        },
      });
      return;
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('syncpad_username', username.trim());
    }

    // Navigate to editor room
    router.push(`/editor/${encodeURIComponent(roomId.trim())}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#1c1e29] text-white px-4 selection:bg-[#4aed88]/30 selection:text-[#4aed88]">
      <Toaster position="top-right" />

      {/* Center Card Wrapper */}
      <div className="w-full max-w-[400px] bg-[#282a36] border border-[#343746] p-6 rounded-lg shadow-xl flex flex-col">
        {/* Flat Minimalist Brand Header */}
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-[#343746]">
          <div className="w-9 h-9 rounded-md bg-[#4aed88] flex items-center justify-center text-[#111827] font-bold text-sm shrink-0">
            SP
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-white flex items-center gap-0.5 leading-tight">
              <span>Sync</span>
              <span className="text-[#4aed88]">Pad</span>
            </h1>
            <span className="text-xs text-zinc-400">
              Real-Time Collaborative Code Editor
            </span>
          </div>
        </div>

        <h4 className="text-xs font-semibold text-zinc-300 mb-3 uppercase tracking-wider">
          Paste invitation ROOM ID
        </h4>

        {/* Input Form */}
        <form onSubmit={handleJoin} className="flex flex-col gap-3">
          <input
            type="text"
            className="w-full px-3 py-2 rounded bg-[#eeeeee] text-[#111827] font-semibold text-sm outline-none placeholder:text-zinc-500 focus:ring-2 focus:ring-[#4aed88] transition-all"
            placeholder="ROOM ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />

          <input
            type="text"
            className="w-full px-3 py-2 rounded bg-[#eeeeee] text-[#111827] font-semibold text-sm outline-none placeholder:text-zinc-500 focus:ring-2 focus:ring-[#4aed88] transition-all"
            placeholder="USERNAME"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <div className="flex justify-end mt-1">
            <button
              type="submit"
              className="px-5 py-2 bg-[#4aed88] hover:bg-[#3ec470] text-[#111827] font-bold text-xs rounded transition-colors flex items-center gap-1.5"
            >
              <span>Join</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Create New Room Link */}
          <div className="mt-2 text-center text-xs text-zinc-400">
            <span>If you don&apos;t have an invite then create &nbsp;</span>
            <button
              type="button"
              onClick={createNewRoom}
              className="text-[#4aed88] hover:text-[#3ec470] font-semibold underline underline-offset-2 transition-colors cursor-pointer"
            >
              new room
            </button>
          </div>
        </form>
      </div>

      {/* Flat Clean Footer */}
      <footer className="mt-10 text-xs text-zinc-500 flex items-center gap-1.5">
        <span>Built with</span>
        <span className="text-[#4aed88] font-semibold">SyncPad</span>
        <span>·</span>
        <span>Yjs CRDTs &amp; Redis Pub/Sub</span>
      </footer>
    </div>
  );
};
