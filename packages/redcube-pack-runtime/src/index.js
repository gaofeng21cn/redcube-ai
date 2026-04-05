function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

export function resolveRenderCompilerModule(contract) {
  const moduleName = safeText(contract?.prompt_pack?.render_contract?.compiler_module);
  const exportName = safeText(contract?.prompt_pack?.render_contract?.compiler_export);
  if (!moduleName) {
    throw new Error('render pack compiler_module 未配置');
  }
  if (!exportName) {
    throw new Error('render pack compiler_export 未配置');
  }
  return {
    module_name: moduleName,
    export_name: exportName,
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
