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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-[#282a36] border border-[#343746] rounded-xl shadow-2xl p-6 text-white overflow-hidden">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-5 border-b border-[#343746] pb-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow"
            style={{ backgroundColor: color }}
          >
            {name ? name[0].toUpperCase() : 'U'}
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Collaborator Identity</h2>
            <p className="text-[11px] text-zinc-400">
              Customize how your cursor, selection, and avatar appear to others
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Name input */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-300 mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={32}
              required
              className="w-full px-3 py-2 bg-[#1c1e29] border border-[#343746] rounded-md text-sm text-white focus:outline-none focus:border-[#4aed88] transition-colors"
              placeholder="e.g. Alex"
              autoFocus
            />
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-300 mb-2">
              Cursor Color
            </label>
            <div className="flex flex-wrap gap-2">
              {COLLABORATOR_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${
                    color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#282a36]' : ''
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="w-3 h-3 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#343746]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded text-xs text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded text-xs font-bold bg-[#4aed88] text-[#111827] hover:bg-[#3ec470] transition-colors shadow"
            >
              Save Identity
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
