import path from 'node:path';
import { AI_FIRST_EDITING_CONTRACT } from '../native-ppt-authoring-policies.js';
import { nativePptSampleLayoutProfile } from '../native-ppt-sample-authoring.js';

type JsonRecord = Record<string, any>;
type NativePptRoute = 'author_pptx_native' | 'repair_pptx_native';

interface NativeArtifactPathRequest {
  deliverablePaths: JsonRecord;
  deliverableId: string;
  route: NativePptRoute;
}

interface NativePptArtifactInputDeps {
  ensureDir(dir: string): string;
}

export function createNativePptArtifactInputParts({ ensureDir }: NativePptArtifactInputDeps) {
  function nativeArtifactPaths({ deliverablePaths, deliverableId, route }: NativeArtifactPathRequest) {
    const nativeDir = ensureDir(path.join(deliverablePaths.artifactsDir, 'native_ppt'));
    const reportDir = ensureDir(path.join(deliverablePaths.reportsDir, 'native_ppt'));
    const basename = `${deliverableId}-${route}`;
    return {
      inputFile: path.join(nativeDir, `${basename}-input.json`),
      pptxFile: path.join(nativeDir, `${basename}.pptx`),
      pdfFile: path.join(nativeDir, `${basename}.pdf`),
      editableShapePlanFile: path.join(nativeDir, `${basename}-editable-shape-plan.json`),
      shapeManifestFile: path.join(nativeDir, `${basename}-shape-manifest.json`),
      repairLogFile: path.join(nativeDir, `${basename}-repair-log.json`),
      planValidationFile: path.join(nativeDir, `${basename}-plan-validation-input.json`),
      executorAttemptDiagnosticFile: path.join(nativeDir, `${basename}-executor-attempt-diagnostic.json`),
      previewDir: ensureDir(path.join(reportDir, `${basename}-screenshots`)),
    };
  }

  function buildNativeInputPayload({
    route,
    unitRepairScope,
    contract,
    blueprintArtifact,
    visualArtifact,
    editableShapePlan,
    editableShapePlanFile,
    repairFeedback,
  }: {
    route: NativePptRoute;
    unitRepairScope: JsonRecord;
    contract: JsonRecord;
    blueprintArtifact: JsonRecord | null;
    visualArtifact: JsonRecord | null;
    editableShapePlan: JsonRecord;
    editableShapePlanFile: string;
    repairFeedback: JsonRecord[];
  }): JsonRecord {
    return {
      route,
      ai_first_editing_contract: AI_FIRST_EDITING_CONTRACT,
      unit_repair_scope: unitRepairScope,
      native_ppt_sample_layout_profile: nativePptSampleLayoutProfile(contract),
      contract: {
        overlay: contract.overlay,
        profile_id: contract.profile_id,
        title: contract.title,
        goal: contract.goal,
      },
      blueprint: blueprintArtifact?.slide_blueprint || {},
      visual_direction: visualArtifact?.visual_direction || {},
      editable_shape_plan: editableShapePlan,
      editable_shape_plan_file: editableShapePlanFile,
      repair_feedback: repairFeedback,
    };
  }

  return {
    buildNativeInputPayload,
    nativeArtifactPaths,
  };
}
