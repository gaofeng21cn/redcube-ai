import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { getSourceArtifactPaths } from '@redcube/runtime-protocol';

type JsonRecord = Record<string, unknown>;

function safeText(value: unknown, fallback = ''): string {
  const text = String(value || '').trim();
  return text || fallback;
}

function safeArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function readJson(file: string): JsonRecord {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

function readJsonIfExists(file: string): JsonRecord | null {
  if (!existsSync(file)) {
    return null;
  }
  return readJson(file);
}

export function loadSharedSourceTruth(workspaceRoot: string, topicId: string): JsonRecord | null {
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
      ...(existsSync(paths.sourcePackManifestFile) ? {
        source_pack_manifest: paths.sourcePackManifestFile,
      } : {}),
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
    ...(existsSync(paths.sourcePackManifestFile) ? {
      source_pack_manifest: readJson(paths.sourcePackManifestFile),
    } : {}),
    ...(existsSync(paths.sourceAugmentationRequestFile) ? {
      source_augmentation_request: readJson(paths.sourceAugmentationRequestFile),
    } : {}),
    ...(existsSync(paths.sourceAugmentationReportFile) ? {
      source_augmentation_report: readJson(paths.sourceAugmentationReportFile),
    } : {}),
  };
}

function isOperatorContextMaterial(material: unknown): boolean {
  const item = material as JsonRecord | null;
  const kind = safeText(item?.kind);
  return safeText(item?.source_role) === 'operator_context'
    || kind === 'brief'
    || kind === 'keywords';
}

function routeStageDefinitions(contract: JsonRecord): JsonRecord[] {
  return [
    ...safeArray((contract.stage_sequence as JsonRecord | undefined)?.stages),
    ...safeArray((contract.stage_sequence as JsonRecord | undefined)?.alternate_stages),
  ] as JsonRecord[];
}

function stageArtifactPath(contract: JsonRecord, deliverablePaths: JsonRecord, stageId: string): string {
  const stage = routeStageDefinitions(contract)
    .find((item) => safeText(item.stage_id) === safeText(stageId));
  return path.join(
    safeText(deliverablePaths.artifactsDir),
    safeText(stage?.output_artifact, `${stageId}.json`),
  );
}

function sourceMaterialsFullText(contract: JsonRecord): JsonRecord[] {
  const sourceTruth = contract.shared_source_truth as JsonRecord | null;
  const extractedMaterials = sourceTruth?.extracted_materials as JsonRecord | undefined;
  return safeArray(extractedMaterials?.materials)
    .filter((material) => !isOperatorContextMaterial(material))
    .map((material, index) => {
      const item = material as JsonRecord;
      return {
        material_ref: safeText(item.material_id) || `material_${index + 1}`,
        source_ref: safeText(item.source_id),
        title: safeText(item.title) || safeText(item.relative_path),
        relative_path: safeText(item.relative_path),
        content_text: safeText(item.content_text || item.excerpt),
      };
    })
    .filter((material) => material.content_text);
}

function extractApprovedSlidePlanFromMaterials(materials: JsonRecord[]): JsonRecord | null {
  const corpus = materials
    .map((material) => safeText(material.content_text || material.excerpt))
    .filter(Boolean)
    .join('\n\n');
  if (!corpus) return null;
  const matches = [...corpus.matchAll(/^##\s+Slide\s+(\d+)\s*[：:.-]?\s*(.*)$/gim)];
  const bySlideNo = new Map<number, JsonRecord>();
  for (const match of matches) {
    const slideNo = Number(match[1]);
    if (!Number.isFinite(slideNo) || slideNo <= 0 || bySlideNo.has(slideNo)) continue;
    bySlideNo.set(slideNo, {
      slide_no: slideNo,
      title: safeText(match[2]),
    });
  }
  if (bySlideNo.size === 0) {
    const groups: JsonRecord[][] = [];
    let current: JsonRecord[] = [];
    const flush = () => {
      if (current.length > 0) {
        groups.push(current);
        current = [];
      }
    };
    for (const line of corpus.split(/\r?\n/)) {
      const match = line.match(/^\s*(\d{1,3})[.、)、)]\s*(\S[\s\S]*)$/);
      const slideNo = match ? Number(match[1]) : Number.NaN;
      const rawTitle = match ? safeText(match[2]) : '';
      const slideLike = /页|封面|结束|总览|目录|论文|研究|结果|边界|问题|模型|评分|队列|方法|证据|slide|PPT|汇报|总结|引言|结论|临床|终点/i.test(rawTitle);
      if (!Number.isFinite(slideNo) || slideNo <= 0 || !slideLike) {
        flush();
        continue;
      }
      const previous = current[current.length - 1];
      if (current.length === 0 || slideNo === Number(previous.slide_no) + 1) {
        current.push({
          slide_no: slideNo,
          title: rawTitle.replace(new RegExp(`^第\\s*${slideNo}\\s*页\\s*[：:.-]?\\s*`), '').trim() || rawTitle,
        });
      } else {
        flush();
        current.push({ slide_no: slideNo, title: rawTitle });
      }
    }
    flush();
    const numberedSlides = groups
      .filter((group) => group.length >= 6 && (Number(group[0]?.slide_no) === 1 || group.length >= 10))
      .sort((a, b) => b.length - a.length)[0] || [];
    for (const slide of numberedSlides) {
      const slideNo = Number(slide.slide_no);
      if (!bySlideNo.has(slideNo)) bySlideNo.set(slideNo, slide);
    }
  }
  if (bySlideNo.size === 0) return null;
  const slides = [...bySlideNo.values()].sort((a, b) => Number(a.slide_no) - Number(b.slide_no));
  return { total_slides: slides.length, slides };
}

function manuscriptEvidenceTableForAudit(contract: JsonRecord, deliverablePaths: JsonRecord): unknown[] {
  const storyline = readJsonIfExists(stageArtifactPath(contract, deliverablePaths, 'storyline'));
  const storylineBody = storyline?.storyline as JsonRecord | undefined;
  return safeArray(storylineBody?.manuscript_evidence_table);
}

export function sourceAuthoringInputRefs(contract: JsonRecord): string[] {
  const refs = (contract.shared_source_truth as JsonRecord | undefined)?.refs as JsonRecord | undefined;
  return [
    refs?.source_index,
    refs?.extracted_materials,
    refs?.source_audit,
    refs?.source_brief,
    refs?.source_readiness_pack,
    refs?.source_pack_manifest,
  ].map((item) => safeText(item)).filter(Boolean);
}

export function buildSourceAuthoringContext({
  contract,
  deliverablePaths,
}: {
  contract: JsonRecord;
  deliverablePaths: JsonRecord;
}): JsonRecord | null {
  const sharedSourceTruth = contract.shared_source_truth as JsonRecord | null;
  if (!sharedSourceTruth) return null;
  const materials = sourceMaterialsFullText(contract);
  const sourceBrief = sharedSourceTruth.source_brief as JsonRecord | undefined;
  const sourceAudit = sharedSourceTruth.source_audit as JsonRecord | undefined;
  return {
    contract_id: 'managed_ppt_ai_first_source_authoring_context_v1',
    source_input: 'source_materials_full_text',
    policy: 'Managed product-entry stages must preserve full shared source truth for route authoring; excerpts and first-line snippets are audit-only and cannot replace AI stage context.',
    source_truth: {
      input_mode: safeText(sourceBrief?.input_mode),
      confidence: safeText(sourceBrief?.confidence),
      source_audit_status: safeText(sourceAudit?.status),
      material_count: materials.length,
      material_refs: materials.map((material) => safeText(material.material_ref)),
      source_refs: materials.map((material) => safeText(material.source_ref)).filter(Boolean),
      content_bytes: materials.reduce((sum, material) => sum + Buffer.byteLength(safeText(material.content_text), 'utf-8'), 0),
    },
    source_materials_full_text: materials,
    approved_slide_plan: extractApprovedSlidePlanFromMaterials(materials),
    manuscript_evidence_table: manuscriptEvidenceTableForAudit(contract, deliverablePaths),
  };
}
