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
  const runtimeEntry = readFileSync(path.resolve('packages/redcube-runtime-family-registry/src/index.js'), 'utf-8');
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
  assert.match(entry, /buildCatalogEntry/);
  assert.doesNotMatch(entry, /from '\.\/index\.js'/);
  assert.equal(runtimeEntry.trim(), "export * from './index.ts';");

  assert.match(types, /interface RuntimeFamilyModuleSpec/);
  assert.match(types, /interface RuntimeFamilyCatalogSurface/);
  assert.match(types, /interface LoadedRuntimeFamilyRunner/);
});

test('P22.A: codex-cli-client exposes a TypeScript service entrypoint and typed local-exec contracts', () => {
  assert.equal(existsSync(path.resolve('packages/redcube-codex-cli-client/src/index.ts')), true);
  assert.equal(existsSync(path.resolve('packages/redcube-codex-cli-client/src/index.js')), true);
  assert.equal(existsSync(path.resolve('packages/redcube-codex-cli-client/tsconfig.json')), true);

  const pkg = JSON.parse(readFileSync(path.resolve('packages/redcube-codex-cli-client/package.json'), 'utf-8'));
  const entry = readFileSync(path.resolve('packages/redcube-codex-cli-client/src/index.ts'), 'utf-8');
  const types = readFileSync(path.resolve('packages/redcube-codex-cli-client/src/index.ts'), 'utf-8');

  assert.equal(pkg.types, './src/index.ts');
  assert.match(entry, /readCodexCliContract/);
  assert.match(entry, /probeCodexCli/);
  assert.match(entry, /generateStructuredArtifactViaCodexCli/);
  assert.match(types, /interface CodexCliContract/);
  assert.match(types, /interface CodexCliProbeResult/);
  assert.match(types, /interface StructuredArtifactGenerationResult/);
});

test('P23.A: utility packages expose TypeScript service entrypoints without changing runtime JS exports', () => {
  const packages = [
    {
      directory: 'packages/redcube-config',
      publicEntrypoints: [
        'src/index.ts',
        'src/private-profile.ts',
        'src/xiaohongshu-author-profile.ts',
      ],
      expectedTypes: [
        /interface RedcubeRuntimeConfig/,
        /interface RedcubeWorkspaceAuthorProfile/,
      ],
    },
    {
      directory: 'packages/redcube-tools',
      publicEntrypoints: ['src/index.ts'],
      expectedTypes: [
        /interface RedcubeProjectBundle/,
        /interface RedcubeGeneratedTasks/,
      ],
    },
    {
      directory: 'packages/redcube-llm',
      publicEntrypoints: ['src/index.ts'],
      expectedTypes: [
        /interface RedcubeNoteDraftRequest/,
        /interface RedcubeStorylineRequest/,
      ],
    },
  ];
  const rootTsconfig = JSON.parse(readFileSync(path.resolve('tsconfig.json'), 'utf-8'));

  for (const pkgSpec of packages) {
    const pkg = JSON.parse(readFileSync(path.resolve(pkgSpec.directory, 'package.json'), 'utf-8'));
    const packageTsconfig = JSON.parse(readFileSync(path.resolve(pkgSpec.directory, 'tsconfig.json'), 'utf-8'));
    const types = readFileSync(path.resolve(pkgSpec.directory, 'src/types.ts'), 'utf-8');

    assert.equal(pkg.types, './src/index.ts', pkgSpec.directory);
    assert.equal(packageTsconfig.extends, '../../tsconfig.base.json', pkgSpec.directory);
    assert.equal(
      rootTsconfig.references.some((entrypoint) => entrypoint.path === `./${pkgSpec.directory}`),
      true,
      pkgSpec.directory,
    );

    for (const entrypoint of pkgSpec.publicEntrypoints) {
      assert.equal(existsSync(path.resolve(pkgSpec.directory, entrypoint)), true, entrypoint);
    }
    for (const expectedType of pkgSpec.expectedTypes) {
      assert.match(types, expectedType, pkgSpec.directory);
    }
  }

  const redcubeConfigPkg = JSON.parse(readFileSync(path.resolve('packages/redcube-config/package.json'), 'utf-8'));
  assert.equal(redcubeConfigPkg.exports['.'].default, './src/index.js');
  assert.equal(redcubeConfigPkg.exports['./private-profile'].default, './src/private-profile.js');
  assert.equal(redcubeConfigPkg.exports['./xiaohongshu-author-profile'].default, './src/xiaohongshu-author-profile.js');
  assert.equal(redcubeConfigPkg.exports['./xiaohongshu-author-profile'].types, './src/xiaohongshu-author-profile.ts');
});
