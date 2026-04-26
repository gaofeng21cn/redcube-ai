// @ts-nocheck
import { spawnSync } from 'node:child_process';

import { AUDIT_FILE, buildCloseoutAudit, writeAuditFile } from './typescript-closeout-audit-lib.ts';

const COMMANDS = {
  typecheck: ['rtk', ['npm', 'run', 'typecheck']],
  full_test_suite: ['rtk', ['npm', 'test', '--', '--test-reporter=dot']],
  diagnostics: ['npx', ['tsc', '--noEmit', '--pretty', 'false', '--project', 'tsconfig.json']],
};

function runCommand(command, args) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    encoding: 'utf-8',
  });

  return {
    command: [command, ...args].join(' '),
    status: result.status === 0 ? 'pass' : 'fail',
    exit_code: result.status ?? 1,
  };
}

const qualityGates = {
  typecheck: runCommand(COMMANDS.typecheck[0], COMMANDS.typecheck[1]),
  full_test_suite: runCommand(COMMANDS.full_test_suite[0], COMMANDS.full_test_suite[1]),
  diagnostics: runCommand(COMMANDS.diagnostics[0], COMMANDS.diagnostics[1]),
};

const audit = buildCloseoutAudit({ qualityGates });
writeAuditFile(audit);

if (!audit.criteria.closeout_ready) {
  console.error(`TypeScript closeout audit failed. See ${AUDIT_FILE}`);
  process.exit(1);
}

console.log(`TypeScript closeout audit passed. Wrote ${AUDIT_FILE}`);
