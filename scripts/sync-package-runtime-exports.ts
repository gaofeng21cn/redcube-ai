import path from 'node:path';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
} from 'node:fs';

interface RuntimeExportTarget {
  subpath: string;
  target: string;
}

interface CompiledRuntimeExport {
  directory: string;
  package_name: string;
  exports: RuntimeExportTarget[];
}

interface TypeScriptPackageBuildContract {
  compiled_dist_runtime_exports: CompiledRuntimeExport[];
}

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(path.resolve(file), 'utf-8')) as T;
}

const contract = readJson<TypeScriptPackageBuildContract>(
  'contracts/runtime-program/typescript-package-build-contract.json',
);

const syncedTargets: string[] = [];
const tsBackedTargets: string[] = [];

function isTsBackedCompatibilityShell(sourceText: string, target: string): boolean {
  const sourceStem = target
    .replace(/^\.\//, '')
    .replace(/^dist\//, '')
    .replace(/\.js$/, '');
  return sourceText.trim() === `export * from './${sourceStem}.ts';`;
}

for (const entry of contract.compiled_dist_runtime_exports) {
  for (const exportTarget of entry.exports) {
    if (!exportTarget.target.startsWith('./dist/') || !exportTarget.target.endsWith('.js')) {
      continue;
    }

    const sourceRelative = exportTarget.target
      .replace(/^\.\//, '')
      .replace(/^dist\//, 'src/');
    const sourceRuntime = path.resolve(entry.directory, sourceRelative);
    const sourceTypes = sourceRuntime.replace(/\.js$/, '.ts');
    const distRuntime = path.resolve(entry.directory, exportTarget.target);

    if (!existsSync(sourceTypes)) {
      throw new Error(`${entry.package_name} declares ${exportTarget.target} but has no ${sourceTypes}`);
    }
    if (!existsSync(sourceRuntime)) {
      if (!existsSync(distRuntime)) {
        throw new Error(`${entry.package_name} TypeScript-backed export did not build ${exportTarget.target}`);
      }
      tsBackedTargets.push(path.relative(process.cwd(), distRuntime).split(path.sep).join('/'));
      continue;
    }

    const sourceText = readFileSync(sourceRuntime, 'utf-8');
    if (isTsBackedCompatibilityShell(sourceText, exportTarget.target)) {
      if (!existsSync(distRuntime)) {
        throw new Error(`${entry.package_name} TypeScript-backed export did not build ${exportTarget.target}`);
      }
      tsBackedTargets.push(path.relative(process.cwd(), distRuntime).split(path.sep).join('/'));
      continue;
    }

    mkdirSync(path.dirname(distRuntime), { recursive: true });
    copyFileSync(sourceRuntime, distRuntime);
    syncedTargets.push(path.relative(process.cwd(), distRuntime).split(path.sep).join('/'));
  }
}

console.log(`Synced package runtime exports: ${syncedTargets.length}`);
if (tsBackedTargets.length > 0) {
  console.log(`Preserved TypeScript-built runtime exports: ${tsBackedTargets.length}`);
}
