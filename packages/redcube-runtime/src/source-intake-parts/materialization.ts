// @ts-nocheck
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  readFileSync,
} from 'node:fs';
import { materializeDomainSources } from 'opl-framework/domain-source-runtime';

import { enrichSourceFingerprint, sourceReuseKey } from './fingerprint-reuse.js';
import { safeText } from '../runtime-utils.js';
import {
  sourceIntakeMaterialInboxDir,
} from './workspace-setup.js';

function detectSourceKind(file) {
  const ext = path.extname(file).toLowerCase();
  if (ext === '.md' || ext === '.markdown') return 'markdown';
  if (ext === '.txt') return 'text';
  if (ext === '.pdf') return 'pdf';
  return 'unsupported';
}

function isOperatorContextSource(source) {
  const kind = safeText(source?.kind);
  return safeText(source?.source_role) === 'operator_context'
    || kind === 'brief'
    || kind === 'keywords';
}

export function isConsumableSource(source) {
  return !isOperatorContextSource(source);
}

function copySourceIntoTopic(sourceFile, topicPaths, index, sourceLabel = 'source') {
  const absolute = path.resolve(sourceFile);
  if (!existsSync(absolute)) {
    throw new Error(`source file 不存在: ${sourceFile}`);
  }
  if (absolute.startsWith(path.resolve(topicPaths.inputsDir))) {
    return {
      absolute_path: absolute,
      relative_path: path.relative(topicPaths.topicDir, absolute),
    };
  }

  const materialized = materializeDomainSources({
    material_root: sourceIntakeMaterialInboxDir(topicPaths),
    sources: [{ kind: 'file', source_path: absolute, role: sourceLabel }],
  }).entries[0];
  return {
    absolute_path: materialized.path,
    relative_path: path.relative(topicPaths.topicDir, materialized.path),
  };
}

function createBriefSources({ brief, keywords, title }) {
  const sources = [];
  if (safeText(brief)) {
    sources.push({
      source_id: 'SRC-BRIEF',
      kind: 'brief',
      source_role: 'operator_context',
      relative_path: null,
      absolute_path: null,
      title,
      brief_text: safeText(brief),
      status: 'ready',
    });
  }
  if (keywords.length > 0) {
    sources.push({
      source_id: 'SRC-KEYWORDS',
      kind: 'keywords',
      source_role: 'operator_context',
      relative_path: null,
      absolute_path: null,
      keywords,
      status: 'ready',
    });
  }
  return sources;
}

export function buildIntakeSources({
  brief,
  keywords,
  title,
  sourceFiles,
  operatorFiles,
  topicPaths,
}) {
  const copiedFileSources = sourceFiles.map((file, index) => {
    const copied = copySourceIntoTopic(file, topicPaths, index, 'content');
    return {
      source_id: `SRC-FILE-${index + 1}`,
      kind: detectSourceKind(copied.absolute_path),
      source_role: 'content_source',
      ...copied,
      status: 'queued',
    };
  });
  const copiedOperatorSources = operatorFiles.map((file, index) => {
    const copied = copySourceIntoTopic(file, topicPaths, index, 'operator');
    return {
      source_id: `SRC-OP-${index + 1}`,
      kind: detectSourceKind(copied.absolute_path),
      source_role: 'operator_context',
      ...copied,
      status: 'queued',
    };
  });
  return [
    ...createBriefSources({ brief, keywords, title }),
    ...copiedFileSources,
    ...copiedOperatorSources,
  ].map((source) => enrichSourceFingerprint(source));
}

function extractPdfSource(source) {
  const mineruToken = safeText(process.env.MINERU_TOKEN);
  const extractorCmd = safeText(process.env.MINERU_EXTRACTOR_CMD);

  if (!mineruToken) {
    return {
      status: 'blocked',
      blocking_reason: 'mineru_token_missing_for_pdf_extraction',
    };
  }
  if (!extractorCmd) {
    return {
      status: 'blocked',
      blocking_reason: 'mineru_extractor_unconfigured',
    };
  }

  const result = spawnSync(extractorCmd, [source.absolute_path], {
    encoding: 'utf-8',
    maxBuffer: 16 * 1024 * 1024,
  });
  const text = safeText(result.stdout);
  if (result.status !== 0 || !text) {
    return {
      status: 'blocked',
      blocking_reason: safeText(result.stderr) || 'mineru_pdf_extraction_failed',
    };
  }

  return {
    status: 'ready',
    content_text: text,
  };
}

function extractSourceContent(source) {
  if (source.kind === 'brief') {
    return {
      status: 'ready',
      content_text: source.brief_text,
    };
  }
  if (source.kind === 'keywords') {
    return {
      status: 'ready',
      content_text: source.keywords.join(' / '),
    };
  }
  if (source.kind === 'markdown' || source.kind === 'text') {
    return {
      status: 'ready',
      content_text: readFileSync(source.absolute_path, 'utf-8'),
    };
  }
  if (source.kind === 'pdf') {
    return extractPdfSource(source);
  }
  return {
    status: 'blocked',
    blocking_reason: `unsupported_source_kind:${source.kind}`,
  };
}

export function extractSourcesWithReuse({ intakeSources, priorSourcesByHash, priorMaterialsByHash }) {
  return intakeSources.map((source) => {
    const priorSource = priorSourcesByHash.get(sourceReuseKey(source));
    const priorMaterial = priorMaterialsByHash.get(sourceReuseKey(source));
    if (priorSource?.extraction?.status === 'ready' && priorMaterial) {
      return {
        ...source,
        status: 'ready',
        blocking_reason: '',
        content_text: priorMaterial.content_text || '',
        reused: true,
        reused_material: priorMaterial,
        previous_source_id: safeText(priorSource.source_id),
      };
    }
    const extraction = extractSourceContent(source);
    return {
      ...source,
      status: extraction.status,
      blocking_reason: extraction.blocking_reason || '',
      content_text: extraction.content_text || '',
      reused: false,
    };
  });
}

export function materializeReadyMaterials(extracted) {
  return extracted
    .filter((source) => source.status === 'ready')
    .map((source, index) => {
      const materialId = `MAT-${String(index + 1).padStart(3, '0')}`;
      if (source.reused && source.reused_material) {
        return {
          ...source.reused_material,
          material_id: materialId,
          source_id: source.source_id,
          source_role: safeText(source.source_role),
          kind: source.kind,
          relative_path: source.relative_path,
        };
      }
      return {
        material_id: materialId,
        source_id: source.source_id,
        kind: source.kind,
        source_role: safeText(source.source_role),
        relative_path: source.relative_path,
        content_text: source.content_text,
        excerpt: source.content_text.slice(0, 240),
      };
    });
}
