import path from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';

import { buildMockCodexLastMessage } from './mock-codex-cli.js';

function parseArgs(argv) {
  const args = new Map();
  for (let index = 2; index < argv.length; index += 1) {
    const current = argv[index];
    if (current.startsWith('--')) {
      args.set(current, argv[index + 1]);
      index += 1;
    }
  }
  return {
    lastMessageFile: String(args.get('--output-last-message') || '').trim(),
  };
}

function readStdin() {
  return new Promise((resolve, reject) => {
    let text = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      text += chunk;
    });
    process.stdin.on('end', () => resolve(text));
    process.stdin.on('error', reject);
  });
}

async function main(argv = process.argv) {
  const { lastMessageFile } = parseArgs(argv);
  if (!lastMessageFile) {
    throw new Error('--output-last-message 不能为空');
  }

  const stdin = await readStdin();
  const prompt = stdin.trim() ? stdin : String(argv.at(-1) || '');
  const output = buildMockCodexLastMessage(prompt);
  mkdirSync(path.dirname(lastMessageFile), { recursive: true });
  writeFileSync(lastMessageFile, output, 'utf-8');

  process.stdout.write(JSON.stringify({
    event: 'run.started',
    run_id: `mock_${process.pid}`,
  }) + '\n');
  process.stdout.write(JSON.stringify({
    event: 'run.completed',
    run_id: `mock_${process.pid}`,
    usage: {
      input_tokens: 0,
      output_tokens: 0,
      total_tokens: 0,
    },
  }) + '\n');
}

main(process.argv).catch((error) => {
  process.stdout.write(JSON.stringify({
    event: 'run.failed',
    run_id: `mock_${process.pid}`,
    error: error instanceof Error ? error.message : String(error),
  }) + '\n');
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
