// @ts-nocheck
import path from 'node:path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

import {
  buildGovernanceSurfaceContract,
  hydrateDeliverableContract,
} from '@redcube/overlay-core';
import {
  getDefaultOverlayRegistry,
  rebuildTopicPublicationProjection,
} from '@redcube/runtime';
import {
  buildSourcePackFanoutArtifact,
  ensureWorkspaceGitBoundary,
  getDeliverablePaths,
  getSourceArtifactPaths,
  getTopicPaths,
} from '@redcube/runtime-protocol';

function buildTopicRecord({ topicId, title, overlay }) {
  return {
    topic_id: String(topicId || '').trim(),
    title: String(title || '').trim(),
    overlay: String(overlay || '').trim(),
    status: 'draft',
  };
}

const overlayRegistry = getDefaultOverlayRegistry();

const WORKSPACE_AGENTS_TEMPLATE = `# RedCube AI 交付工作区约束

## 适用范围

本文件适用于当前 RedCube AI 交付工作区及其所有子目录。

## 默认入口

- 当前工作区的视觉交付任务必须从 RedCube AI / RCA product-entry direct handler target 开始：\`redcube product invoke\`；overview/status/session shell 由 OPL generated caller 提供。
- PPT deck 默认路线是 \`storyline -> detailed_outline -> slide_blueprint -> visual_direction -> author_image_pages -> visual_director_review -> screenshot_review -> export_pptx\`。
- Image-first 是默认视觉实现路线；HTML/native routes 只能在 manifest/status/session surface 明确显示可选且 operator 显式选择时使用。
- \`style_reference_dir\` 通过 \`delivery_request.style_reference_dir\` 输入，provider diagnostics 的 blocked_reason 以 product-entry surface 为准。

## 防偏航规则

- 修改或生成交付物前，先读取 OPL generated 的 RedCube manifest/status/session refs 或 direct RCA handler 返回的 authority refs。
- 长 PPT 或多资料任务必须保留同一 \`entry_session_id\`、\`topic_id\`、\`deliverable_id\`，通过 OPL generated session surface 恢复，不重新开 prompt-only 任务。
- 截图质控或 visual director review 未通过时，从明确 stage rerun 或 repair_image_pages 回修；不要跳过 review gate 直接交付。
- 除非用户明确要求探索替代技术路线，否则不要绕开 RCA product-entry/runtime。

## 听众与表达

- 面向非 AI 专家时，优先讲临床价值、流程、边界和可审阅性，避免暴露不必要的底层技术细节。
- 视觉质量以 director-first、recipe_id、peak page、anti-template 为准，避免通用卡片栅格和模板化排版。
`;

function ensureWorkspaceAgentsFile({ workspaceRoot }) {
  const agentsFile = path.join(workspaceRoot, 'AGENTS.md');
  if (existsSync(agentsFile)) {
    return null;
  }
  mkdirSync(workspaceRoot, { recursive: true });
  writeFileSync(agentsFile, WORKSPACE_AGENTS_TEMPLATE, 'utf-8');
  return agentsFile;
}


function readJsonIfExists(file) {
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, 'utf-8'));
}

function upsertConsumerFamily(fanout, deliverable) {
  const families = Array.isArray(fanout.consumer_families)
    ? fanout.consumer_families
    : [];
  const familyId = String(deliverable.overlay || '').trim();
  const family = families.find((item) => item?.family_id === familyId);
  const deliverableEntry = {
    deliverable_id: String(deliverable.deliverable_id || '').trim(),
    profile_id: String(deliverable.profile_id || '').trim(),
    title: String(deliverable.title || '').trim(),
    goal: String(deliverable.goal || '').trim(),
  };

  if (family) {
    const deliverables = Array.isArray(family.deliverables) ? family.deliverables : [];
    if (!deliverables.some((item) => item?.deliverable_id === deliverableEntry.deliverable_id)) {
      family.deliverables = [...deliverables, deliverableEntry];
    }
    return families;
  }

  return [
    ...families,
    {
      family_id: familyId,
      deliverables: [deliverableEntry],
    },
  ];
}

function updateSourcePackFanout({ workspaceRoot, topicId, deliverable }) {
  const sourcePaths = getSourceArtifactPaths(workspaceRoot, topicId);
  const sourceIndex = readJsonIfExists(sourcePaths.sourceIndexFile);
  const extractedMaterials = readJsonIfExists(sourcePaths.extractedMaterialsFile);
  const sourceAudit = readJsonIfExists(sourcePaths.sourceAuditFile);
  const sourceBrief = readJsonIfExists(sourcePaths.sourceBriefFile);
  const sourceReadinessPack = readJsonIfExists(sourcePaths.sourceReadinessPackFile);
  if (!sourceIndex || !extractedMaterials || !sourceAudit || !sourceBrief || !sourceReadinessPack) {
    return null;
  }

  const previousFanout = readJsonIfExists(sourcePaths.sourcePackFanoutFile) || {};
  const consumerFamilies = upsertConsumerFamily(previousFanout, deliverable);
  const nextFanout = buildSourcePackFanoutArtifact({
    workspaceRoot,
    topicId,
    sourceIndex,
    extractedMaterials,
    sourceAudit,
    sourceBrief,
    sourceReadinessPack,
    consumerFamilies,
  });
  writeFileSync(sourcePaths.sourcePackFanoutFile, JSON.stringify(nextFanout, null, 2), 'utf-8');
  return sourcePaths.sourcePackFanoutFile;
}

export async function createDeliverable({
  workspaceRoot,
  overlay,
  profileId,
  topicId,
  deliverableId,
  title,
  goal,
  constraints = [],
}) {
  ensureWorkspaceGitBoundary({ workspaceRoot });
  const workspaceAgentsFile = ensureWorkspaceAgentsFile({ workspaceRoot });
  const overlayDefinition = overlayRegistry.getOverlay(overlay);
  if (typeof overlayDefinition.buildDeliverableRecord !== 'function') {
    throw new Error(`Overlay ${overlay} cannot create deliverables`);
  }
  if (typeof overlayDefinition.buildSurfaceBundle !== 'function') {
    throw new Error(`Overlay ${overlay} cannot hydrate deliverable surfaces`);
  }

  const topicPaths = getTopicPaths(workspaceRoot, topicId);
  const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);

  mkdirSync(topicPaths.topicDir, { recursive: true });
  if (!existsSync(topicPaths.topicFile)) {
    writeFileSync(
      topicPaths.topicFile,
      JSON.stringify(buildTopicRecord({ topicId, title, overlay }), null, 2),
      'utf-8',
    );
  }

  const hydratedContract = hydrateDeliverableContract(overlayRegistry, {
    overlay,
    profileId,
    topicId,
    deliverableId,
    title,
    goal,
    constraints,
  });
  const governanceSurface = buildGovernanceSurfaceContract(hydratedContract);
  const deliverable = overlayDefinition.buildDeliverableRecord({
    topicId,
    deliverableId,
    title,
    profileId,
    goal,
    hydratedContract,
  });
  mkdirSync(deliverablePaths.deliverableDir, { recursive: true });
  writeFileSync(
    deliverablePaths.deliverableFile,
    JSON.stringify(deliverable, null, 2),
    'utf-8',
  );

  const surfaceFiles = [];
  for (const artifact of overlayDefinition.buildSurfaceBundle({ contract: hydratedContract })) {
    const targetFile = path.join(deliverablePaths.deliverableDir, artifact.relativePath);
    mkdirSync(path.dirname(targetFile), { recursive: true });
    writeFileSync(targetFile, JSON.stringify(artifact.content, null, 2), 'utf-8');
    surfaceFiles.push(targetFile);
  }

  const sourcePackFanoutFile = updateSourcePackFanout({
    workspaceRoot,
    topicId,
    deliverable,
  });

  rebuildTopicPublicationProjection({ workspaceRoot, topicId });

  return {
    ok: true,
    surface_kind: 'deliverable_create',
    recommended_action: 'audit_deliverable',
    summary: {
      overlay: deliverable.overlay,
      deliverable_id: deliverable.deliverable_id,
      surface_file_count: surfaceFiles.length,
    },
    deliverableFile: deliverablePaths.deliverableFile,
    deliverable,
    surfaceFiles,
    sourcePackFanoutFile,
    workspaceAgentsFile,
    hydratedContract,
    governance_surface: governanceSurface,
  };
}
