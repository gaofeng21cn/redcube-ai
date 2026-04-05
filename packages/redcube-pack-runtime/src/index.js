import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(MODULE_DIR, '../../..');

function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

export function resolveRenderCompilerModule(contract, fallbackRelativePath) {
  const root = safeText(contract?.prompt_pack?.root);
  const configured = safeText(contract?.prompt_pack?.render_contract?.compiler_module);
  const relative = configured || fallbackRelativePath;
  if (!relative) {
    throw new Error('render pack compiler_module 未配置');
  }
  const repoRelative = relative.includes('/') ? relative : path.posix.join(root, relative);
  const absolute = path.join(REPO_ROOT, repoRelative);
  if (!existsSync(absolute)) {
    throw new Error(`Missing render pack compiler: ${repoRelative}`);
  }
  return {
    relative_path: repoRelative,
    absolute_path: absolute,
  };
}

export async function loadRenderPackCompiler(contract, fallbackRelativePath) {
  const moduleRef = resolveRenderCompilerModule(contract, fallbackRelativePath);
  const loaded = await import(pathToFileURL(moduleRef.absolute_path).href);
  if (typeof loaded.compileRenderSlides !== 'function') {
    throw new Error(`Render pack compiler must export compileRenderSlides: ${moduleRef.relative_path}`);
  }
  return {
    ...moduleRef,
    compileRenderSlides: loaded.compileRenderSlides,
  };
}
