import { closeSync, openSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import type { SpawnSyncOptions } from 'node:child_process';
import process from 'node:process';
import type { VerifyStep } from './test-registry.ts';

import {
  buildVerifyLanePlan,
  listVerifyLanes,
  normalizeVerifyLane,
} from './test-registry.ts';

type PrivatePlatformReadbackStep = Extract<VerifyStep, { kind: 'private-platform-readback' }>;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function run(command: string, args: readonly string[] = [], options: SpawnSyncOptions = {}): void {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
    ...options,
  });
  if (result.error) throw result.error;
  if ((result.status ?? 1) !== 0) {
    process.exit(result.status ?? 1);
  }
}

function npmRun(script: string, args: readonly string[] = [], options: SpawnSyncOptions = {}): void {
  run('npm', ['run', '--silent', script, ...args], options);
}

function runBuildToLog(logFile: string): void {
  const stdoutFd = openSync(logFile, 'w');
  try {
    npmRun('build', [], {
      stdio: ['ignore', stdoutFd, 'inherit'],
    });
  } finally {
    closeSync(stdoutFd);
  }
}

async function runPrivatePlatformReadback({ output }: PrivatePlatformReadbackStep): Promise<void> {
  runBuildToLog('/tmp/redcube-ai-private-platform-readback-build.log');

  const { buildPrivatePlatformSourceGuardReadback } = await import('./check-private-platform-retirement.ts');
  const payload = `${JSON.stringify(buildPrivatePlatformSourceGuardReadback(), null, 2)}\n`;
  if (output === 'stdout') {
    process.stdout.write(payload);
    return;
  }

  writeFileSync(output, payload);
}

function runLineBudget(strict: boolean): void {
  npmRun(strict ? 'line-budget:strict' : 'line-budget');
}

function runStructure(strict: boolean): void {
  if (strict) {
    run('scripts/run-structural-quality-gate.sh', ['--strict'], {
      env: {
        ...process.env,
        OPL_LINE_BUDGET_STRICT: '1',
      },
    });
    return;
  }
  run('scripts/run-structural-quality-gate.sh');
}

async function runStep(step: VerifyStep, forwardedArgs: readonly string[]): Promise<void> {
  if (step.kind === 'build') {
    npmRun('build');
    return;
  }
  if (step.kind === 'typecheck') {
    npmRun('typecheck');
    return;
  }
  if (step.kind === 'test-group') {
    run(process.execPath, [
      '--experimental-strip-types',
      'scripts/run-test-group.ts',
      step.group,
      ...forwardedArgs,
    ]);
    return;
  }
  if (step.kind === 'private-platform-readback') {
    if (forwardedArgs.length > 0) {
      throw new Error('private-platform readback does not accept forwarded node test arguments');
    }
    await runPrivatePlatformReadback(step);
    return;
  }
  if (step.kind === 'line-budget') {
    runLineBudget(step.strict);
    return;
  }
  if (step.kind === 'structure') {
    runStructure(step.strict);
    return;
  }
  const unsupportedStep: never = step;
  throw new Error(`Unsupported verification step: ${JSON.stringify(unsupportedStep)}`);
}

function printUsage(): void {
  process.stderr.write(`Usage: node --experimental-strip-types scripts/verify-lane.ts <${listVerifyLanes().join('|')}> [node --test args]\n`);
}

const [rawLane = 'smoke', ...rawArgs] = process.argv.slice(2);
const verifyWrapper = rawArgs.includes('--verify-wrapper');
const forwardedArgs = rawArgs.filter((arg) => arg !== '--verify-wrapper');
const lane = normalizeVerifyLane(rawLane);

try {
  if (verifyWrapper) {
    runLineBudget(lane === 'line-budget-strict' || lane === 'structure-strict');
    run('scripts/repo-hygiene.sh', ['--fix']);
    run('scripts/repo-hygiene.sh');
    if (lane === 'line-budget' || lane === 'line-budget-strict') {
      process.exit(0);
    }
  }

  const plan = buildVerifyLanePlan(lane);
  for (const step of plan.steps) {
    await runStep(step, forwardedArgs);
  }
} catch (error) {
  process.stderr.write(`${errorMessage(error)}\n`);
  printUsage();
  process.exit(1);
}
