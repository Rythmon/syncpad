'use client';

import React, { useState } from 'react';
import { X, Copy, Check, Share2, ExternalLink, Users } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Invite Collaborators</h2>
            <p className="text-xs text-slate-400">Share this room link to edit together in real time</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Room Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={getShareUrl()}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-300 select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all whitespace-nowrap"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-2 font-medium text-slate-300">
              <Users className="w-4 h-4 text-indigo-400" />
              <span>Quick Multi-Peer Testing:</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Open the copied link in an Incognito window or another browser tab to simulate concurrent multi-user editing with live cursors!
            </p>
            <button
              type="button"
              onClick={handleOpenNewTab}
              className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium pt-1"
            >
              <span>Open in New Tab Now</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-800/80 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
