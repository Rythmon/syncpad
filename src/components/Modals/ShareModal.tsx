'use client';

import React, { useState } from 'react';
import { X, Copy, Check, Share2, ExternalLink } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, roomId }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const getShareUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/doc/${roomId}`;
    }
    return `/doc/${roomId}`;
  };

  const handleCopy = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(getShareUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenNewTab = () => {
    window.open(getShareUrl(), '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-[#111318] border border-white/[0.08] rounded-xl shadow-2xl p-6 text-zinc-100">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-5">
          <div className="p-1.5 rounded-md bg-white/[0.06] text-zinc-300">
            <Share2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">Invite &amp; Collaborate</h2>
            <p className="text-[11px] text-zinc-400">Share room link to collaborate concurrently</p>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-medium text-zinc-300 mb-1.5">
              Room Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={getShareUrl()}
                className="w-full px-3 py-2 bg-[#0c0d11] border border-white/[0.08] rounded-md text-xs font-mono text-zinc-300 select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-2 bg-white text-zinc-950 hover:bg-zinc-200 font-medium rounded-md text-xs transition-colors shrink-0 shadow-sm"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#0c0d11] border border-white/[0.06] text-zinc-400 space-y-2">
            <span className="block text-[11px] font-medium text-zinc-300">
              Multi-Client Testing Tip
            </span>
            <p className="text-[11px] leading-relaxed text-zinc-400">
              Paste this URL into another tab or incognito window to experience concurrent real-time cursor tracking and CRDT edits across independent replicas.
            </p>
            <button
              type="button"
              onClick={handleOpenNewTab}
              className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium pt-0.5"
            >
              <span>Open in New Window</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
