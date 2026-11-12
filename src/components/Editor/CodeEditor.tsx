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

export const LANGUAGE_STARTERS: Record<string, string> = {
  javascript: `// JavaScript (Node.js runtime)
function solve() {
  console.log("=== SyncPad JavaScript Engine ===");
  const numbers = [12, 45, 68, 23, 91, 34];
  const max = Math.max(...numbers);
  const sum = numbers.reduce((a, b) => a + b, 0);
  
  console.log("Input numbers:", numbers);
  console.log("Max value:", max);
  console.log("Sum:", sum);
  console.log("Average:", (sum / numbers.length).toFixed(2));
}

solve();
`,
  python: `# Python 3 runtime
import sys

def sieve_primes(limit):
    is_prime = [True] * (limit + 1)
    is_prime[0] = is_prime[1] = False
    for i in range(2, int(limit**0.5) + 1):
        if is_prime[i]:
            for j in range(i*i, limit + 1, i):
                is_prime[j] = False
    return [i for i, prime in enumerate(is_prime) if prime]

print(f"=== SyncPad Python Runtime (Python {sys.version.split()[0]}) ===")
primes = sieve_primes(50)
print(f"Prime numbers up to 50: {primes}")
print(f"Total count: {len(primes)}")
`,
  cpp: `// C++17 Runtime
#include <iostream>
#include <vector>
#include <algorithm>
#include <numeric>

int main() {
    std::cout << "=== SyncPad C++17 Runtime ===" << std::endl;
    std::vector<int> data = {7, 2, 9, 1, 5, 4, 8};
    
    std::cout << "Original: ";
    for (int n : data) std::cout << n << " ";
    std::cout << std::endl;

    std::sort(data.begin(), data.end());
    std::cout << "Sorted:   ";
    for (int n : data) std::cout << n << " ";
    std::cout << std::endl;

    int total = std::accumulate(data.begin(), data.end(), 0);
    std::cout << "Sum:      " << total << std::endl;
    return 0;
}
`,
  html: `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      background: #1e1e2e;
      color: #cdd6f4;
      font-family: -apple-system, system-ui, sans-serif;
      padding: 30px;
      margin: 0;
    }
    .card {
      background: #313244;
      border: 1px solid #45475a;
      border-radius: 12px;
      padding: 24px;
      max-width: 480px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.3);
    }
    h2 { color: #a6e3a1; margin-top: 0; }
    p { color: #bac2de; line-height: 1.5; }
    button {
      background: #a6e3a1;
      color: #11111b;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: bold;
      cursor: pointer;
    }
    button:hover { background: #94e2d5; }
  </style>
</head>
<body>
  <div class="card">
    <h2>Interactive HTML Preview</h2>
    <p>This markup is rendered live in a sandboxed iframe inside SyncPad.</p>
    <button onclick="alert('Hello from SyncPad Live HTML!')">Click Me</button>
  </div>
</body>
</html>
`,
  markdown: `# SyncPad Collaborative Documentation

Welcome to **SyncPad** — real-time collaborative code and markdown editor.

## Features
- **Conflict-Free Convergence:** Powered by Yjs CRDTs over WebSockets
- **Multi-Language Runtimes:**
  1. *JavaScript (Node.js)*
  2. *Python 3*
  3. *C++17*
  4. *Live HTML / XML*
  5. *Markdown Preview*

\`\`\`javascript
const sync = "Yjs CRDT";
console.log(\`Engine: \${sync}\`);
\`\`\`

> Click **Run** in the toolbar to see this document rendered live!
`,
};

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
      const starter = LANGUAGE_STARTERS[language] || LANGUAGE_STARTERS.javascript;

      // Seed starter template only if the room is brand new (empty after sync)
      const seedIfEmpty = () => {
        if (ytext.length === 0) {
          ytext.insert(0, starter);
        }
      };

      if (!provider || provider.synced) {
        // Already synced (or no provider) — seed immediately
        seedIfEmpty();
      } else {
        // Wait for the first sync event before deciding to seed
        const onSync = (isSynced: boolean) => {
          if (isSynced) seedIfEmpty();
          provider.off('sync', onSync);
        };
        provider.on('sync', onSync);
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
