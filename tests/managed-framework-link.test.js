import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const repoRoot = path.resolve(import.meta.dirname, '..');

function snapshotTree(root) {
  return fs.globSync('**/*', { cwd: root, withFileTypes: true })
    .map((entry) => {
      const relativePath = `${entry.parentPath.slice(root.length + 1)}/${entry.name}`;
      return entry.isDirectory()
        ? `d:${relativePath}`
        : `f:${relativePath}:${fs.readFileSync(path.join(entry.parentPath, entry.name)).toString('base64')}`;
    })
    .sort();
}

test('repo command wrapper runs only after the OPL-managed framework link check passes', () => {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'rca-framework-link-'));
  const agentRoot = path.join(fixtureRoot, 'agent');
  const evidenceRoot = path.join(fixtureRoot, 'evidence');
  const wrapperPath = path.join(agentRoot, 'scripts', 'run-with-repo-temp-env.sh');
  const fakeOplPath = path.join(evidenceRoot, 'opl');
  const argsPath = path.join(evidenceRoot, 'args.txt');
  const commandMarkerPath = path.join(evidenceRoot, 'command-ran.txt');

  try {
    fs.mkdirSync(path.dirname(wrapperPath), { recursive: true });
    fs.mkdirSync(evidenceRoot, { recursive: true });
    fs.copyFileSync(path.join(repoRoot, 'scripts', 'run-with-repo-temp-env.sh'), wrapperPath);
    fs.chmodSync(wrapperPath, 0o755);
    fs.writeFileSync(path.join(agentRoot, 'package.json'), '{"private":true}\n');
    fs.writeFileSync(fakeOplPath, [
      '#!/usr/bin/env bash',
      'printf "%s\\n" "$@" > "$OPL_TEST_ARGS_PATH"',
      'printf \'{"error":"framework_link_missing","details":{"repair_command":"opl packages link-framework --agent-root <repo> --json"}}\\n\'',
      'exit 42',
      '',
    ].join('\n'));
    fs.chmodSync(fakeOplPath, 0o755);
    const before = snapshotTree(agentRoot);

    const result = spawnSync(wrapperPath, [
      'node',
      '-e',
      `require('node:fs').writeFileSync(${JSON.stringify(commandMarkerPath)}, 'ran')`,
    ], {
      cwd: agentRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        OPL_BIN: fakeOplPath,
        OPL_TEST_ARGS_PATH: argsPath,
        OPL_REPO_TEMP_ROOT: path.join(fixtureRoot, 'repo-temp'),
      },
    });

    assert.equal(result.status, 42, result.stdout + result.stderr);
    assert.match(result.stdout + result.stderr, /framework_link_missing/);
    assert.equal(fs.existsSync(commandMarkerPath), false);
    assert.deepEqual(snapshotTree(agentRoot), before);
    assert.deepEqual(fs.readFileSync(argsPath, 'utf8').trim().split('\n'), [
      'packages',
      'link-framework',
      '--agent-root',
      fs.realpathSync(agentRoot),
      '--check',
      '--json',
    ]);

    fs.writeFileSync(fakeOplPath, '#!/usr/bin/env bash\nexit 0\n');
    const linkedResult = spawnSync(wrapperPath, [
      'node',
      '-e',
      `require('node:fs').writeFileSync(${JSON.stringify(commandMarkerPath)}, 'ran')`,
    ], {
      cwd: agentRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        OPL_BIN: fakeOplPath,
        OPL_TEST_ARGS_PATH: argsPath,
        OPL_REPO_TEMP_ROOT: path.join(fixtureRoot, 'repo-temp'),
      },
    });
    assert.equal(linkedResult.status, 0, linkedResult.stdout + linkedResult.stderr);
    assert.equal(fs.readFileSync(commandMarkerPath, 'utf8'), 'ran');
  } finally {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  }
});

test('OPL-managed framework link resolves canonical imports without an RCA Temporal lock', async () => {
  const frameworkLink = path.join(repoRoot, 'node_modules', 'opl-framework');
  assert.equal(fs.lstatSync(frameworkLink).isSymbolicLink(), true);
  const lockPackages = JSON.parse(
    fs.readFileSync(path.join(repoRoot, 'package-lock.json'), 'utf8'),
  ).packages ?? {};
  assert.equal(
    Object.keys(lockPackages).some((entry) => entry.startsWith('node_modules/@temporalio/')),
    false,
  );

  const { STANDARD_AGENT_PACK_ABI } = await import('opl-framework/standard-agent-pack-abi');
  assert.equal(STANDARD_AGENT_PACK_ABI.owner, 'one-person-lab');
  assert.equal(STANDARD_AGENT_PACK_ABI.version, 'standard-agent-pack-abi.v1');
});
