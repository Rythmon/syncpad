'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import { Sparkles, ArrowRight } from 'lucide-react';

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
    // Generate UUID or clean alphanumeric room id
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
        background: '#333',
        color: '#fff',
      },
    });
  };

  const handleJoin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!roomId.trim() || !username.trim()) {
      toast.error('ROOM ID & username is required', {
        style: {
          background: '#333',
          color: '#fff',
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
      <div className="w-full max-w-[420px] bg-[#282a36] border border-white/[0.08] p-7 rounded-xl shadow-2xl flex flex-col">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 mb-6">
          <img
            src="/code-sync.png"
            alt="SyncPad Logo"
            className="h-14 w-auto object-contain"
          />
        </div>

        <h4 className="text-sm font-semibold text-zinc-200 mb-4">
          Paste invitation ROOM ID
        </h4>

        {/* Input Form */}
        <form onSubmit={handleJoin} className="flex flex-col gap-3.5">
          <input
            type="text"
            className="w-full px-3.5 py-2.5 rounded bg-[#eeeeee] text-[#111827] font-semibold text-sm outline-none placeholder:text-zinc-500 focus:ring-2 focus:ring-[#4aed88] transition-all"
            placeholder="ROOM ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />

          <input
            type="text"
            className="w-full px-3.5 py-2.5 rounded bg-[#eeeeee] text-[#111827] font-semibold text-sm outline-none placeholder:text-zinc-500 focus:ring-2 focus:ring-[#4aed88] transition-all"
            placeholder="USERNAME"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <div className="flex justify-end mt-1">
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#4aed88] hover:bg-[#2b824c] text-[#111827] font-bold text-sm rounded transition-colors flex items-center gap-1.5 shadow"
            >
              <span>Join</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Create New Room Link */}
          <div className="mt-3 text-center text-xs text-zinc-400">
            <span>If you don&apos;t have an invite then create &nbsp;</span>
            <button
              type="button"
              onClick={createNewRoom}
              className="text-[#4aed88] hover:text-[#368654] font-semibold underline underline-offset-2 transition-colors cursor-pointer"
            >
              new room
            </button>
          </div>
        </form>
      </div>

      {/* Footer */}
      <footer className="mt-12 text-xs text-zinc-400 flex items-center gap-1.5">
        <span>Built with 💛 by</span>
        <span className="text-[#4aed88] font-semibold">SyncPad Distributed Team</span>
        <span>·</span>
        <span className="text-zinc-500">Yjs CRDTs &amp; Redis Pub/Sub</span>
      </footer>
    </div>
  );
};
