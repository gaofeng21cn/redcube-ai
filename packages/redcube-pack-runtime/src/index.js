import packageJson from '../package.json' with { type: 'json' };

function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

export function resolveRenderCompilerModule(contract) {
  const packId = safeText(contract?.prompt_pack?.pack_id);
  if (!packId) {
    throw new Error('render pack pack_id 未配置');
  }
  const spec = (packageJson.redcube?.defaultPackCompilerModules || []).find((item) => item.packId === packId);
  if (!spec) {
    throw new Error(`render pack registry 未配置: ${packId}`);
  }
  return {
    pack_id: packId,
    module_name: safeText(spec.module),
    export_name: safeText(spec.exportName),
  };
}

export async function loadRenderPackCompiler(contract) {
  const moduleRef = resolveRenderCompilerModule(contract);
  let loaded;
  try {
    loaded = await import(moduleRef.module_name);
  } catch {
    throw new Error(`Missing render pack compiler package: ${moduleRef.module_name}`);
  }
  const compileRenderSlides = loaded?.[moduleRef.export_name];
  if (typeof compileRenderSlides !== 'function') {
    throw new Error(`Render pack compiler export missing: ${moduleRef.module_name}#${moduleRef.export_name}`);
  }
  return {
    ...moduleRef,
    compileRenderSlides,
  };
}
