'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

interface CodeEditorProps {
  ydoc: Y.Doc;
  provider: WebsocketProvider | null;
  roomId: string;
  language: string;
  fontSize: number;
  onCodeChange?: (code: string) => void;
}

const DEFAULT_CODE = `// SyncPad — Real-Time Collaborative Code Editor
// Powered by Yjs CRDTs, WebSockets, Redis Pub/Sub, and IndexedDB

function calculateReplicasConvergence(nodes) {
  console.log("Reconciling state vectors across cluster...");
  const timestamp = Date.now();
  
  return nodes.map((node) => {
    return {
      nodeId: node.id,
      stateVectorClock: node.clock + 1,
      commutative: true,
      convergedAt: timestamp,
    };
  });
}

// Active multi-peer cluster simulation
const clusterNodes = [
  { id: "worker-us-east-1", clock: 42 },
  { id: "worker-eu-central-1", clock: 88 },
  { id: "worker-ap-south-1", clock: 19 }
];

const result = calculateReplicasConvergence(clusterNodes);
console.log("Convergence status:", JSON.stringify(result, null, 2));
`;

export const CodeEditor: React.FC<CodeEditorProps> = ({
  ydoc,
  provider,
  roomId,
  language,
  fontSize,
  onCodeChange,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorInstanceRef = useRef<any>(null);
  const bindingRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    async function initCodeMirror() {
      if (!textareaRef.current) return;

      // Dynamically load CodeMirror 5 modules in browser
      const CodeMirror = (await import('codemirror')).default;
      await import('codemirror/mode/javascript/javascript');
      await import('codemirror/mode/python/python');
      await import('codemirror/mode/clike/clike');
      await import('codemirror/mode/htmlmixed/htmlmixed');
      await import('codemirror/mode/markdown/markdown');
      await import('codemirror/addon/edit/closebrackets');
      await import('codemirror/addon/edit/closetag');
      const { CodemirrorBinding } = await import('y-codemirror');

      if (isCancelled || !textareaRef.current) return;

      // Clean up previous instance if any
      if (editorInstanceRef.current) {
        editorInstanceRef.current.toTextArea();
        editorInstanceRef.current = null;
      }

      const cmMode =
        language === 'python'
          ? 'python'
          : language === 'cpp'
          ? 'text/x-c++src'
          : language === 'html'
          ? 'htmlmixed'
          : language === 'markdown'
          ? 'markdown'
          : { name: 'javascript', json: true };

      const cm = CodeMirror.fromTextArea(textareaRef.current, {
        mode: cmMode,
        theme: 'dracula',
        lineNumbers: true,
        autoCloseBrackets: true,
        autoCloseTags: true,
        tabSize: 2,
        indentWithTabs: false,
        lineWrapping: false,
      } as any);

      editorInstanceRef.current = cm;

      // Connect Yjs CRDT Text binding
      const ytext = ydoc.getText('codemirror');
      if (ytext.length === 0) {
        ytext.insert(0, DEFAULT_CODE);
      }

      // Bind CodeMirror with Yjs and Awareness (Remote Cursors)
      const awareness = provider ? provider.awareness : null;
      const binding = new CodemirrorBinding(ytext, cm, awareness);
      bindingRef.current = binding;

      cm.on('change', () => {
        if (onCodeChange) {
          onCodeChange(cm.getValue());
        }
      });

      setIsReady(true);
    }

    initCodeMirror();

    return () => {
      isCancelled = true;
      if (bindingRef.current) {
        try {
          bindingRef.current.destroy();
        } catch {}
        bindingRef.current = null;
      }
      if (editorInstanceRef.current) {
        try {
          editorInstanceRef.current.toTextArea();
        } catch {}
        editorInstanceRef.current = null;
      }
    };
  }, [ydoc, provider, roomId]);

  // Update language mode dynamically
  useEffect(() => {
    if (!editorInstanceRef.current) return;
    const cmMode =
      language === 'python'
        ? 'python'
        : language === 'cpp'
        ? 'text/x-c++src'
        : language === 'html'
        ? 'htmlmixed'
        : language === 'markdown'
        ? 'markdown'
        : { name: 'javascript', json: true };

    editorInstanceRef.current.setOption('mode', cmMode);
  }, [language]);

  // Update font size dynamically
  useEffect(() => {
    if (!editorInstanceRef.current) return;
    const wrapper = editorInstanceRef.current.getWrapperElement();
    if (wrapper) {
      wrapper.style.fontSize = `${fontSize}px`;
      editorInstanceRef.current.refresh();
    }
  }, [fontSize, isReady]);

  return (
    <div className="relative w-full h-full flex-1 flex flex-col overflow-hidden bg-[#282a36]">
      <textarea ref={textareaRef} id="realtimeEditor" style={{ display: 'none' }} />
    </div>
  );
};
