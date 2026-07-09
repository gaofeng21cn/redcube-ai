// @ts-nocheck
import { closeSync, openSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import process from 'node:process';

import {
  buildVerifyLanePlan,
  listVerifyLanes,
  normalizeVerifyLane,
} from './test-registry.ts';

function run(command, args = [], options = {}) {
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

function npmRun(script, args = [], options = {}) {
  run('npm', ['run', '--silent', script, ...args], options);
}

function runBuildToLog(logFile) {
  const stdoutFd = openSync(logFile, 'w');
  try {
    npmRun('build', [], {
      stdio: ['ignore', stdoutFd, 'inherit'],
    });
  } finally {
    closeSync(stdoutFd);
  }
}

async function runPrivatePlatformReadback({ scope, output }) {
  const logFile = scope === 'default-caller-tail'
    ? '/tmp/redcube-ai-default-caller-tail-readback-build.log'
    : '/tmp/redcube-ai-private-platform-readback-build.log';
  runBuildToLog(logFile);

  const { buildPrivatePlatformSourceGuardReadback } = await import('./check-private-platform-retirement.ts');
  const payload = `${JSON.stringify(buildPrivatePlatformSourceGuardReadback(scope), null, 2)}\n`;
  if (output === 'stdout') {
    process.stdout.write(payload);
    return;
  }

  writeFileSync(output, payload);
}

function runLineBudget(strict) {
  npmRun(strict ? 'line-budget:strict' : 'line-budget');
}

function runStructure(strict) {
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

async function runStep(step, forwardedArgs) {
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
      throw new Error(`${step.scope} readback does not accept forwarded node test arguments`);
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
  throw new Error(`Unsupported verification step: ${JSON.stringify(step)}`);
}

function printUsage() {
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
  process.stderr.write(`${error.message}\n`);
  printUsage();
  process.exit(1);
}
