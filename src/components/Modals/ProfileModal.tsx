'use client';

import React, { useState } from 'react';
import { COLLABORATOR_COLORS } from '@/lib/colors';
import { X, Check, User } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 overflow-hidden">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-md"
            style={{ backgroundColor: color }}
          >
            {name ? name[0].toUpperCase() : 'U'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Collaborator Profile</h2>
            <p className="text-xs text-slate-400">
              Customize how other peers see your live cursor and edits
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Display Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={30}
                required
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="Enter your name"
              />
              <User className="absolute right-3.5 top-3 w-4 h-4 text-slate-500" />
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Cursor & Badge Color
            </label>
            <div className="flex flex-wrap gap-2.5">
              {COLLABORATOR_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${
                    color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-105' : ''
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-400">
            <span className="block text-[11px] font-medium text-slate-500 mb-2">
              Live Cursor Preview:
            </span>
            <div className="relative pl-6 py-2 flex items-center">
              <div
                className="w-0.5 h-6 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span
                className="ml-1 text-[11px] font-semibold text-white px-2 py-0.5 rounded shadow-md"
                style={{ backgroundColor: color }}
              >
                {name || 'Your Name'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
