'use client';

import React from 'react';
import * as Y from 'yjs';
import confetti from 'canvas-confetti';
import { X, FileDown, FileText, Code2, CheckCircle2 } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  ydoc: Y.Doc;
  documentTitle: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  ydoc,
  documentTitle,
}) => {
  if (!isOpen) return null;

  const downloadFile = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Fire celebratory confetti!
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#6366f1', '#06b6d4', '#10b981', '#f59e0b'],
    });
  };

  const cleanFilename = (ext: string) => {
    const safeTitle = documentTitle.trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'syncpad-doc';
    return `${safeTitle}.${ext}`;
  };

  const handleExportText = () => {
    // Extract plain text from Yjs fragment
    const fragment = ydoc.getXmlFragment('syncpad-content');
    const text = fragment.toString().replace(/<[^>]+>/g, '\n').replace(/\n\n+/g, '\n\n').trim();
    downloadFile(text || 'Empty document', cleanFilename('txt'), 'text/plain');
    onClose();
  };

  const handleExportHtml = () => {
    const fragment = ydoc.getXmlFragment('syncpad-content');
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${documentTitle}</title>
  <style>
    body { font-family: -apple-system, system-ui, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; }
    h1, h2, h3 { color: #1e293b; }
    pre { background: #f1f5f9; padding: 16px; border-radius: 8px; }
  </style>
</head>
<body>
  ${fragment.toString()}
</body>
</html>`;
    downloadFile(htmlContent, cleanFilename('html'), 'text/html');
    onClose();
  };

  const handleExportJson = () => {
    const docState = Y.encodeStateAsUpdate(ydoc);
    const jsonStr = JSON.stringify(
      {
        title: documentTitle,
        exportedAt: new Date().toISOString(),
        yjsStateBase64: Buffer.from(docState).toString('base64'),
      },
      null,
      2
    );
    downloadFile(jsonStr, cleanFilename('json'), 'application/json');
    onClose();
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
            <FileDown className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Export Document</h2>
            <p className="text-xs text-slate-400">Download your collaborative document in various formats</p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleExportHtml}
            className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/40 transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <Code2 className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
              <div>
                <span className="block text-sm font-semibold text-slate-200">HTML Document (.html)</span>
                <span className="block text-xs text-slate-400">Standalone styled web page</span>
              </div>
            </div>
            <FileDown className="w-4 h-4 text-slate-500 group-hover:text-indigo-400" />
          </button>

          <button
            type="button"
            onClick={handleExportText}
            className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/40 transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
              <div>
                <span className="block text-sm font-semibold text-slate-200">Plain Text (.txt)</span>
                <span className="block text-xs text-slate-400">Clean extracted readable content</span>
              </div>
            </div>
            <FileDown className="w-4 h-4 text-slate-500 group-hover:text-cyan-400" />
          </button>

          <button
            type="button"
            onClick={handleExportJson}
            className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/40 transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <div>
                <span className="block text-sm font-semibold text-slate-200">CRDT Snapshot (.json)</span>
                <span className="block text-xs text-slate-400">Complete binary state vector payload</span>
              </div>
            </div>
            <FileDown className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" />
          </button>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-800/80 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
