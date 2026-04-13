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

test('P16 slice 2: legacy pack-runtime compiler registry service boundary is removed', () => {
  assert.equal(existsSync(path.resolve('packages/redcube-pack-runtime')), false);
  const rootTsconfig = JSON.parse(readFileSync(path.resolve('tsconfig.json'), 'utf-8'));
  assert.equal(
    rootTsconfig.references.some((entry) => entry.path === './packages/redcube-pack-runtime'),
    false,
  );
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

test('P20.B: runtime-family-registry exposes a TypeScript service entrypoint and typed registry contracts', () => {
  assert.equal(existsSync(path.resolve('packages/redcube-runtime-family-registry/src/index.ts')), true);
  assert.equal(existsSync(path.resolve('packages/redcube-runtime-family-registry/src/types.ts')), true);
  assert.equal(existsSync(path.resolve('packages/redcube-runtime-family-registry/tsconfig.json')), true);

  const pkg = JSON.parse(readFileSync(path.resolve('packages/redcube-runtime-family-registry/package.json'), 'utf-8'));
  const rootTsconfig = JSON.parse(readFileSync(path.resolve('tsconfig.json'), 'utf-8'));
  const packageTsconfig = JSON.parse(readFileSync(path.resolve('packages/redcube-runtime-family-registry/tsconfig.json'), 'utf-8'));
  const entry = readFileSync(path.resolve('packages/redcube-runtime-family-registry/src/index.ts'), 'utf-8');
  const types = readFileSync(path.resolve('packages/redcube-runtime-family-registry/src/types.ts'), 'utf-8');

  assert.equal(pkg.types, './src/index.ts');
  assert.equal(packageTsconfig.extends, '../../tsconfig.base.json');
  assert.equal(
    rootTsconfig.references.some((entrypoint) => entrypoint.path === './packages/redcube-runtime-family-registry'),
    true,
  );

  assert.match(entry, /listDefaultRuntimeFamilyModules/);
  assert.match(entry, /getDefaultRuntimeFamilyCatalog/);
  assert.match(entry, /resolveRuntimeFamilyModule/);
  assert.match(entry, /loadRuntimeFamilyRunner/);

  assert.match(types, /interface RuntimeFamilyModuleSpec/);
  assert.match(types, /interface RuntimeFamilyCatalogSurface/);
  assert.match(types, /interface LoadedRuntimeFamilyRunner/);
});

test('P22.A: hermes-agent-client exposes a TypeScript service entrypoint and typed upstream probe contracts', () => {
  assert.equal(existsSync(path.resolve('packages/redcube-hermes-agent-client/src/index.ts')), true);
  assert.equal(existsSync(path.resolve('packages/redcube-hermes-agent-client/src/index.js')), true);
  assert.equal(existsSync(path.resolve('packages/redcube-hermes-agent-client/tsconfig.json')), true);

  const pkg = JSON.parse(readFileSync(path.resolve('packages/redcube-hermes-agent-client/package.json'), 'utf-8'));
  const entry = readFileSync(path.resolve('packages/redcube-hermes-agent-client/src/index.ts'), 'utf-8');
  const types = readFileSync(path.resolve('packages/redcube-hermes-agent-client/src/index.ts'), 'utf-8');

  assert.equal(pkg.types, './src/index.ts');
  assert.match(entry, /readHermesAgentUpstreamConfig/);
  assert.match(entry, /probeHermesAgentUpstream/);
  assert.match(entry, /generateStructuredArtifactViaUpstreamHermes/);
  assert.match(types, /interface HermesAgentUpstreamConfig/);
  assert.match(types, /interface HermesAgentProbeResult/);
  assert.match(types, /interface StructuredArtifactGenerationResult/);
});
