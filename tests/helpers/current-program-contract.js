import { assembleCurrentProgramFromParts } from '../../scripts/sync-current-program-leaf-index.ts';

export function readCurrentProgramContract() {
  const currentProgram = assembleCurrentProgramFromParts();
  for (const surfaceId of [
    'opl_generic_primitive_consumption',
    'opl_stability_read_model_consumption',
    'privatized_functional_module_audit',
    'visual_pack_compiler_handoff',
    'stage_artifact_kernel_adoption',
    'temporal_stage_run_consumption_policy',
  ]) {
    const canonical = currentProgram.current_state[surfaceId];
    currentProgram.product_release_metadata[surfaceId] = canonical;
    currentProgram.current_state.active_baton.scope[surfaceId] = canonical;
  }
  return currentProgram;
}
