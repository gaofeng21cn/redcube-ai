import path from 'node:path';
import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

function normalizeDefaultPath(input) {
  const value = String(input || '').trim();
  if (!value) return '';

  const resolved = path.resolve(value);
  if (existsSync(resolved)) return resolved;

  const parentDir = path.dirname(resolved);
  return existsSync(parentDir) ? parentDir : '';
}

function buildChooseFolderScript(prompt) {
  const safePrompt = JSON.stringify(String(prompt || '选择工作区目录'));
  return [
    'on run argv',
    `set promptText to ${safePrompt}`,
    'if (count of argv) > 0 and item 1 of argv is not "" then',
    'set chosenFolder to choose folder with prompt promptText default location (POSIX file (item 1 of argv))',
    'else',
    'set chosenFolder to choose folder with prompt promptText',
    'end if',
    'return POSIX path of chosenFolder',
    'end run',
  ];
}

function isCanceled(error) {
  const message = [
    error?.message,
    error?.stderr,
    error?.stdout,
  ].filter(Boolean).join('\n');
  return message.includes('(-128)') || message.includes('User canceled');
}

export async function selectDirectory(options = {}) {
  const prompt = String(options.prompt || '选择工作区目录');
  const defaultPath = normalizeDefaultPath(options.defaultPath || '');
  const platform = options.platform || process.platform;
  const runExecFile = options.execFileAsync || execFileAsync;

  if (platform !== 'darwin') {
    return {
      ok: false,
      canceled: false,
      path: '',
      defaultPath,
      error: '当前目录选择器仅支持 macOS Finder。',
    };
  }

  const args = [];
  for (const line of buildChooseFolderScript(prompt)) {
    args.push('-e', line);
  }
  if (defaultPath) {
    args.push(defaultPath);
  }

  try {
    const { stdout } = await runExecFile('osascript', args);
    return {
      ok: true,
      canceled: false,
      path: String(stdout || '').trim(),
      defaultPath,
    };
  } catch (error) {
    if (isCanceled(error)) {
      return {
        ok: true,
        canceled: true,
        path: '',
        defaultPath,
      };
    }

    return {
      ok: false,
      canceled: false,
      path: '',
      defaultPath,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
