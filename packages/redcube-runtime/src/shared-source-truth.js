import { existsSync, readFileSync } from 'node:fs';

import { getSourceArtifactPaths } from '@redcube/runtime-protocol';

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

export function loadSharedSourceTruth(workspaceRoot, topicId) {
  const paths = getSourceArtifactPaths(workspaceRoot, topicId);
  if (!existsSync(paths.sourceIndexFile)
    || !existsSync(paths.extractedMaterialsFile)
    || !existsSync(paths.sourceAuditFile)
    || !existsSync(paths.sourceBriefFile)
    || !existsSync(paths.sourceReadinessPackFile)) {
    return null;
  }

  return {
    refs: {
      source_index: paths.sourceIndexFile,
      extracted_materials: paths.extractedMaterialsFile,
      source_audit: paths.sourceAuditFile,
      source_brief: paths.sourceBriefFile,
      source_readiness_pack: paths.sourceReadinessPackFile,
      ...(existsSync(paths.sourceAugmentationRequestFile) ? {
        source_augmentation_request: paths.sourceAugmentationRequestFile,
      } : {}),
      ...(existsSync(paths.sourceAugmentationReportFile) ? {
        source_augmentation_report: paths.sourceAugmentationReportFile,
      } : {}),
    },
    source_index: readJson(paths.sourceIndexFile),
    extracted_materials: readJson(paths.extractedMaterialsFile),
    source_audit: readJson(paths.sourceAuditFile),
    source_brief: readJson(paths.sourceBriefFile),
    source_readiness_pack: readJson(paths.sourceReadinessPackFile),
    ...(existsSync(paths.sourceAugmentationRequestFile) ? {
      source_augmentation_request: readJson(paths.sourceAugmentationRequestFile),
    } : {}),
    ...(existsSync(paths.sourceAugmentationReportFile) ? {
      source_augmentation_report: readJson(paths.sourceAugmentationReportFile),
    } : {}),
  };
}
