import { NextRequest, NextResponse } from 'next/server';
import { exec, spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

// 5-second maximum execution timeout to prevent runaway infinite loops
const TIMEOUT_MS = 5000;

function runProcess(
  cmd: string,
  args: string[],
  timeoutMs = TIMEOUT_MS
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';
    let isTimedOut = false;

    const child = spawn(cmd, args);

    const timer = setTimeout(() => {
      isTimedOut = true;
      child.kill('SIGKILL');
      resolve({
        stdout,
        stderr: `\n[Execution Timeout] Program was terminated after exceeding ${timeoutMs / 1000}s limit. Check for infinite loops.`,
        exitCode: 124,
      });
    }, timeoutMs);

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      if (!isTimedOut) {
        resolve({
          stdout,
          stderr,
          exitCode: code ?? 0,
        });
      }
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

export async function POST(req: NextRequest) {
  try {
    const { language, code } = await req.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Code content must be a non-empty string' },
        { status: 400 }
      );
    }

    const uniqueId = crypto.randomBytes(8).toString('hex');
    const tempDir = os.tmpdir();

    // 1. HTML / XML — Client & server live preview
    if (language === 'html' || language === 'xml') {
      return NextResponse.json({
        success: true,
        language,
        stdout: 'HTML loaded for interactive preview.',
        stderr: '',
        exitCode: 0,
        isHtmlPreview: true,
        htmlContent: code,
      });
    }

    // 2. Markdown — Live preview & formatted rendering
    if (language === 'markdown') {
      // Basic markdown conversion
      const html = code
        .replace(/^# (.*$)/gim, '<h1 class="text-xl font-bold text-white mb-2">$1</h1>')
        .replace(/^## (.*$)/gim, '<h2 class="text-lg font-semibold text-zinc-200 mt-3 mb-1">$1</h2>')
        .replace(/^### (.*$)/gim, '<h3 class="text-base font-semibold text-zinc-300 mt-2 mb-1">$1</h3>')
        .replace(/^\* (.*$)/gim, '<li class="ml-4 list-disc text-zinc-300">$1</li>')
        .replace(/^- (.*$)/gim, '<li class="ml-4 list-disc text-zinc-300">$1</li>')
        .replace(/\*\*(.*)\*\*/gim, '<strong class="font-bold text-white">$1</strong>')
        .replace(/\*(.*)\*/gim, '<em class="italic text-zinc-400">$1</em>')
        .replace(/`([^`]+)`/gim, '<code class="bg-[#191a21] text-[#50fa7b] px-1 py-0.5 rounded font-mono text-xs">$1</code>')
        .replace(/\n$/gim, '<br />');

      return NextResponse.json({
        success: true,
        language,
        stdout: 'Markdown document rendered successfully.',
        stderr: '',
        exitCode: 0,
        isHtmlPreview: true,
        htmlContent: `<div style="font-family: system-ui, sans-serif; line-height: 1.6; color: #f8f8f2; padding: 12px;">${html}</div>`,
      });
    }

    // 3. JavaScript / Node.js
    if (language === 'javascript' || language === 'node' || language === 'typescript') {
      const filePath = path.join(tempDir, `syncpad_${uniqueId}.js`);
      try {
        await fs.writeFile(filePath, code, 'utf-8');
        const res = await runProcess('node', [filePath]);
        return NextResponse.json({
          success: res.exitCode === 0,
          language: 'javascript',
          stdout: res.stdout,
          stderr: res.stderr,
          exitCode: res.exitCode,
        });
      } finally {
        await fs.unlink(filePath).catch(() => {});
      }
    }

    // 4. Python
    if (language === 'python' || language === 'py') {
      const filePath = path.join(tempDir, `syncpad_${uniqueId}.py`);
      try {
        await fs.writeFile(filePath, code, 'utf-8');
        // Prefer python3, fallback to python
        let res;
        try {
          res = await runProcess('python3', [filePath]);
        } catch {
          res = await runProcess('python', [filePath]);
        }
        return NextResponse.json({
          success: res.exitCode === 0,
          language: 'python',
          stdout: res.stdout,
          stderr: res.stderr,
          exitCode: res.exitCode,
        });
      } finally {
        await fs.unlink(filePath).catch(() => {});
      }
    }

    // 5. C / C++
    if (language === 'cpp' || language === 'c') {
      const sourcePath = path.join(tempDir, `syncpad_${uniqueId}.cpp`);
      const binaryPath = path.join(tempDir, `syncpad_${uniqueId}.bin`);

      try {
        await fs.writeFile(sourcePath, code, 'utf-8');

        // Step 1: Compile with g++ or clang++
        const compilerCmd = 'g++';
        let compileRes;
        try {
          compileRes = await runProcess(compilerCmd, [
            '-O2',
            '-std=c++17',
            sourcePath,
            '-o',
            binaryPath,
          ]);
        } catch {
          compileRes = await runProcess('clang++', [
            '-O2',
            '-std=c++17',
            sourcePath,
            '-o',
            binaryPath,
          ]);
        }

        // If compilation failed
        if (compileRes.exitCode !== 0) {
          return NextResponse.json({
            success: false,
            language: 'cpp',
            stdout: '',
            stderr: `[Compilation Error]\n${compileRes.stderr}`,
            exitCode: compileRes.exitCode,
          });
        }

        // Step 2: Execute compiled binary
        const runRes = await runProcess(binaryPath, []);
        return NextResponse.json({
          success: runRes.exitCode === 0,
          language: 'cpp',
          stdout: runRes.stdout,
          stderr: runRes.stderr,
          exitCode: runRes.exitCode,
        });
      } finally {
        await fs.unlink(sourcePath).catch(() => {});
        await fs.unlink(binaryPath).catch(() => {});
      }
    }

    return NextResponse.json(
      { error: `Unsupported execution runtime: ${language}` },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: `Server execution exception: ${err?.message || 'Internal failure'}`,
      },
      { status: 500 }
    );
  }
}
