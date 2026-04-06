import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

test('P16 slice 1: runtime exposes a TypeScript service entrypoint and typed boundary exports', () => {
  assert.equal(existsSync(path.resolve('packages/redcube-runtime/src/index.ts')), true);
  assert.equal(existsSync(path.resolve('packages/redcube-runtime/src/types.ts')), true);

  const pkg = JSON.parse(readFileSync(path.resolve('packages/redcube-runtime/package.json'), 'utf-8'));
  const entry = readFileSync(path.resolve('packages/redcube-runtime/src/index.ts'), 'utf-8');
  const types = readFileSync(path.resolve('packages/redcube-runtime/src/types.ts'), 'utf-8');

  assert.equal(pkg.types, './src/index.ts');
  assert.match(entry, /runDeliverableRoute/);
  assert.match(entry, /resolveExecutorAdapter/);
  assert.match(entry, /P19_CREATIVE_OWNERSHIP_PROGRAM_CLOSEOUT/);
  assert.match(entry, /P19_REVIEW_OVERLAY_CONTRACT/);
  assert.match(entry, /startRun/);
  assert.match(types, /interface RuntimeRunRecord/);
  assert.match(types, /interface RuntimeRunRouteResponse/);
  assert.match(types, /interface RuntimeCreativeOwnershipProgramCloseout/);
});

test('P16 slice 2: pack-runtime exposes a TypeScript service entrypoint and typed registry contracts', () => {
  assert.equal(existsSync(path.resolve('packages/redcube-pack-runtime/src/index.ts')), true);
  assert.equal(existsSync(path.resolve('packages/redcube-pack-runtime/src/types.ts')), true);

  const pkg = JSON.parse(readFileSync(path.resolve('packages/redcube-pack-runtime/package.json'), 'utf-8'));
  const entry = readFileSync(path.resolve('packages/redcube-pack-runtime/src/index.ts'), 'utf-8');
  const types = readFileSync(path.resolve('packages/redcube-pack-runtime/src/types.ts'), 'utf-8');

  assert.equal(pkg.types, './src/index.ts');
  assert.match(entry, /resolveRenderCompilerModule/);
  assert.match(entry, /loadRenderPackCompiler/);
  assert.match(types, /interface PackCompilerRegistryEntry/);
  assert.match(types, /interface ResolvedRenderCompilerModule/);
});

test('P16 slice 3: CLI exposes a TypeScript service entrypoint and typed command contracts', () => {
  assert.equal(existsSync(path.resolve('apps/redcube-cli/src/index.ts')), true);
  assert.equal(existsSync(path.resolve('apps/redcube-cli/src/types.ts')), true);

  const pkg = JSON.parse(readFileSync(path.resolve('apps/redcube-cli/package.json'), 'utf-8'));
  const entry = readFileSync(path.resolve('apps/redcube-cli/src/index.ts'), 'utf-8');
  const types = readFileSync(path.resolve('apps/redcube-cli/src/types.ts'), 'utf-8');

  assert.equal(pkg.types, './src/index.ts');
  assert.match(entry, /runCli/);
  assert.match(entry, /buildHelp/);
  assert.match(types, /interface CliOptions/);
  assert.match(types, /interface CliRunResult/);
});

test('P16 slice 4: MCP exposes a TypeScript service entrypoint and typed tool gateway contracts', () => {
  assert.equal(existsSync(path.resolve('apps/redcube-mcp/src/index.ts')), true);
  assert.equal(existsSync(path.resolve('apps/redcube-mcp/src/types.ts')), true);

  const pkg = JSON.parse(readFileSync(path.resolve('apps/redcube-mcp/package.json'), 'utf-8'));
  const entry = readFileSync(path.resolve('apps/redcube-mcp/src/index.ts'), 'utf-8');
  const types = readFileSync(path.resolve('apps/redcube-mcp/src/types.ts'), 'utf-8');

  assert.equal(pkg.types, './src/index.ts');
  assert.match(entry, /callGatewayTool/);
  assert.match(entry, /createMcpServer/);
  assert.match(types, /interface GatewayToolDefinition/);
  assert.match(types, /interface GatewayActionMap/);
});
