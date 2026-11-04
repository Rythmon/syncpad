'use client';

import React from 'react';
import * as Y from 'yjs';
import { X, FileDown, FileText, Code2, Database } from 'lucide-react';

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
  };

  const cleanFilename = (ext: string) => {
    const safeTitle = documentTitle.trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'document';
    return `${safeTitle}.${ext}`;
  };

  const handleExportText = () => {
    const fragment = ydoc.getXmlFragment('syncpad-content');
    const text = fragment.toString().replace(/<[^>]+>/g, '\n').replace(/\n\n+/g, '\n\n').trim();
    downloadFile(text || '', cleanFilename('txt'), 'text/plain');
    onClose();
  };

  const handleExportMarkdown = () => {
    const fragment = ydoc.getXmlFragment('syncpad-content');
    // Basic HTML to Markdown conversion
    let md = fragment.toString()
      .replace(/<h1>(.*?)<\/h1>/gi, '# $1\n\n')
      .replace(/<h2>(.*?)<\/h2>/gi, '## $1\n\n')
      .replace(/<h3>(.*?)<\/h3>/gi, '### $1\n\n')
      .replace(/<p><em>(.*?)<\/em><\/p>/gi, '*$1*\n\n')
      .replace(/<p><strong>(.*?)<\/strong><\/p>/gi, '**$1**\n\n')
      .replace(/<p>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<li>(.*?)<\/li>/gi, '- $1\n')
      .replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/gi, '```\n$1\n```\n\n')
      .replace(/<blockquote>(.*?)<\/blockquote>/gi, '> $1\n\n')
      .replace(/<[^>]+>/g, '')
      .replace(/\n\n\n+/g, '\n\n')
      .trim();

    downloadFile(md, cleanFilename('md'), 'text/markdown');
    onClose();
  };

  const handleExportHtml = () => {
    const fragment = ydoc.getXmlFragment('syncpad-content');
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${documentTitle}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 760px; margin: 40px auto; padding: 0 24px; line-height: 1.7; color: #1a1a1a; }
    h1, h2, h3 { color: #111; }
    pre { background: #f4f4f5; padding: 14px; border-radius: 6px; font-size: 13px; }
    code { font-family: monospace; }
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
        version: '1.0.0',
        yjsStateBase64: Buffer.from(docState).toString('base64'),
      },
      null,
      2
    );
    downloadFile(jsonStr, cleanFilename('crdt.json'), 'application/json');
    onClose();
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
            <FileDown className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">Export Document</h2>
            <p className="text-[11px] text-zinc-400">Save local copies in standard formats</p>
          </div>
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={handleExportMarkdown}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-[#0c0d11] border border-white/[0.06] hover:border-white/[0.14] hover:bg-white/[0.02] transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-zinc-400" />
              <div>
                <span className="block text-xs font-medium text-zinc-200">Markdown (.md)</span>
                <span className="block text-[10.5px] text-zinc-500">Formatted for GitHub, Obsidian, and docs</span>
              </div>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">MD</span>
          </button>

          <button
            type="button"
            onClick={handleExportHtml}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-[#0c0d11] border border-white/[0.06] hover:border-white/[0.14] hover:bg-white/[0.02] transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <Code2 className="w-4 h-4 text-zinc-400" />
              <div>
                <span className="block text-xs font-medium text-zinc-200">HTML Document (.html)</span>
                <span className="block text-[10.5px] text-zinc-500">Clean standalone web page with styles</span>
              </div>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">HTML</span>
          </button>

          <button
            type="button"
            onClick={handleExportText}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-[#0c0d11] border border-white/[0.06] hover:border-white/[0.14] hover:bg-white/[0.02] transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-zinc-400" />
              <div>
                <span className="block text-xs font-medium text-zinc-200">Plain Text (.txt)</span>
                <span className="block text-[10.5px] text-zinc-500">Stripped unformatted text output</span>
              </div>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">TXT</span>
          </button>

          <button
            type="button"
            onClick={handleExportJson}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-[#0c0d11] border border-white/[0.06] hover:border-white/[0.14] hover:bg-white/[0.02] transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <Database className="w-4 h-4 text-zinc-400" />
              <div>
                <span className="block text-xs font-medium text-zinc-200">CRDT Snapshot (.json)</span>
                <span className="block text-[10.5px] text-zinc-500">Binary Yjs state vector for rehydration</span>
              </div>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">CRDT</span>
          </button>
        </div>
      </div>
    </div>
  );
};
