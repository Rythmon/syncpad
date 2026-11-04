'use client';

import React, { useState } from 'react';
import { COLLABORATOR_PALETTE } from '@/lib/colors';
import { X, Check } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { name: string; color: string };
  onSave: (name: string, color: string) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSave,
}) => {
  const [name, setName] = useState(currentUser.name);
  const [color, setColor] = useState(currentUser.color);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim(), color);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-[#111318] border border-white/[0.08] rounded-xl shadow-2xl p-6 text-zinc-100 overflow-hidden">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow"
            style={{ backgroundColor: color }}
          >
            {name ? name[0].toUpperCase() : 'U'}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">Collaborator Identity</h2>
            <p className="text-[11px] text-zinc-400">
              Customize how your cursor and selection tags appear to peers
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Name input */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-300 mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={32}
              required
              className="w-full px-3 py-2 bg-[#0c0d11] border border-white/[0.08] rounded-md text-xs text-zinc-100 focus:outline-none focus:border-white/20 transition-colors"
              placeholder="e.g. Elena Rostova"
            />
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-300 mb-2">
              Cursor Color
            </label>
            <div className="flex flex-wrap gap-2">
              {COLLABORATOR_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${
                    color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#111318]' : ''
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="w-3 h-3 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Live Preview */}
          <div className="p-3 rounded-lg bg-[#0c0d11] border border-white/[0.06] text-zinc-400">
            <span className="block text-[10px] text-zinc-500 mb-2 font-mono uppercase tracking-wider">
              Render Preview
            </span>
            <div className="relative pl-4 py-1 flex items-center">
              <div
                className="w-0.5 h-5 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span
                className="ml-1 text-[10.5px] font-medium text-white px-1.5 py-0.5 rounded shadow"
                style={{ backgroundColor: color }}
              >
                {name || 'Your Name'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-md text-xs text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-md text-xs font-medium bg-white text-zinc-950 hover:bg-zinc-200 transition-colors shadow-sm"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
