import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import {
  buildSourceReadinessSummary,
  type SourceReadinessArtifactPaths,
} from './source-readiness-summary-assembly.js';
import { getTopicPaths } from './workspace.js';
import type { SourceReadinessSummary } from './types.js';

type JsonRecord = Record<string, unknown>;

function safeReadJson(file: string): JsonRecord | null {
  try {
    return JSON.parse(readFileSync(file, 'utf-8'));
  } catch {
    return null;
  }
}

function getSourceReadinessArtifactPaths(workspaceRoot: string, topicId: string): SourceReadinessArtifactPaths {
  const topicPaths = getTopicPaths(workspaceRoot, topicId);
  return {
    sourceAuditFile: path.join(topicPaths.canonicalDir, 'source-audit.json'),
    sourceReadinessPackFile: path.join(topicPaths.canonicalDir, 'source-readiness-pack.json'),
  };
}

export function loadSourceReadinessSummary(workspaceRoot: string, topicId: string): SourceReadinessSummary | null {
  if (!workspaceRoot || !topicId) {
    return null;
  }

  const sourcePaths = getSourceReadinessArtifactPaths(workspaceRoot, topicId);
  const auditExists = existsSync(sourcePaths.sourceAuditFile);
  const readinessExists = existsSync(sourcePaths.sourceReadinessPackFile);

  return buildSourceReadinessSummary({
    sourcePaths,
    auditExists,
    readinessExists,
    sourceAudit: auditExists ? safeReadJson(sourcePaths.sourceAuditFile) : null,
    sourceReadinessPack: readinessExists ? safeReadJson(sourcePaths.sourceReadinessPackFile) : null,
  });
}
