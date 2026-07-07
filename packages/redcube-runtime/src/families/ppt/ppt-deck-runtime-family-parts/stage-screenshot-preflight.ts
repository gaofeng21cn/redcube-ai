// @ts-nocheck

function buildReviewMarkdownWithDeps(deps, contract, reviewArtifact, reviewOwner) {
  const {
    safeArray,
    safeText,
  } = deps;
  const lines = [
    `# ${contract.title} 视觉质控`,
    '',
    `- review_owner: ${safeText(reviewOwner, 'codex_cli_runtime')}`,
    `- 状态：${reviewArtifact.status}`,
  ];
  if (reviewArtifact.review_capture) {
    lines.push(`- capture_id：${safeText(reviewArtifact.review_capture.capture_id)}`);
    lines.push(`- capture_screenshots_dir：${safeText(reviewArtifact.review_capture.screenshots_dir)}`);
    if (reviewArtifact.review_capture.review_markdown_file) {
      lines.push(`- capture_review_markdown：${safeText(reviewArtifact.review_capture.review_markdown_file)}`);
    }
    if (reviewArtifact.review_capture.manifest_file) {
      lines.push(`- capture_manifest：${safeText(reviewArtifact.review_capture.manifest_file)}`);
    }
    if (reviewArtifact.review_capture.store_dir) {
      lines.push(`- capture_store_dir：${safeText(reviewArtifact.review_capture.store_dir)}`);
    }
    if (Number.isFinite(Number(reviewArtifact.review_capture.device_scale_factor))) {
      lines.push(`- device_scale_factor：${Number(reviewArtifact.review_capture.device_scale_factor)}`);
    }
    const screenshotWidth = Number(reviewArtifact.review_capture?.screenshot_dimensions?.width || 0);
    const screenshotHeight = Number(reviewArtifact.review_capture?.screenshot_dimensions?.height || 0);
    if (screenshotWidth > 0 && screenshotHeight > 0) {
      lines.push(`- screenshot_dimensions：${screenshotWidth}x${screenshotHeight}`);
    }
  }
  lines.push(
    `- director_intent_landed：${reviewArtifact.checks.director_intent_landed}`,
    `- anti_template_ok：${reviewArtifact.checks.anti_template_ok}`,
    `- overflow_free：${reviewArtifact.checks.overflow_free}`,
    `- occlusion_free：${reviewArtifact.checks.occlusion_free}`,
    `- visual_density_ok：${reviewArtifact.checks.visual_density_ok}`,
    `- speaker_fit_ok：${reviewArtifact.checks.speaker_fit_ok}`,
    `- edge_clearance_ok：${reviewArtifact.checks.edge_clearance_ok}`,
    `- block_content_fit_ok：${reviewArtifact.checks.block_content_fit_ok}`,
    `- title_typography_ok：${reviewArtifact.checks.title_typography_ok}`,
    `- page_number_consistency_ok：${reviewArtifact.checks.page_number_consistency_ok}`,
  );
  if (Object.hasOwn(reviewArtifact.checks, 'baseline_comparison_passed')) {
    lines.push(`- baseline_comparison_passed：${reviewArtifact.checks.baseline_comparison_passed}`);
  }
  if (reviewArtifact.ai_review?.review_summary) {
    lines.push('', '## AI 审阅结论');
    lines.push(`- review_model：${safeText(reviewArtifact.ai_review.review_model)}`);
    lines.push(`- weak_pages：${safeArray(reviewArtifact.ai_review.weak_pages).join(', ') || 'none'}`);
    lines.push(`- review_summary：${reviewArtifact.ai_review.review_summary}`);
  }
  lines.push('', '## 分页记录');
  for (const slide of reviewArtifact.slide_reviews) {
    lines.push(`- ${slide.slide_id} / ${slide.layout_family} / ${slide.status} / ${slide.screenshot_file}`);
    if (slide.ai_review) {
      lines.push(`  - AI judgement: ${slide.ai_review.judgement}`);
      lines.push(`  - AI findings: ${safeArray(slide.ai_review.visual_findings).join('；')}`);
      lines.push(`  - Recommended fix: ${safeText(slide.ai_review.recommended_fix, 'none')}`);
    }
  }
  if (reviewArtifact.baseline_review?.summary) {
    lines.push('', '## Baseline Relative Review', reviewArtifact.baseline_review.summary);
  }
  return `${lines.join('\n')}\n`;
}

function countHtmlMatches(deps, html, pattern) {
  return deps.safeText(html).match(pattern)?.length || 0;
}

function hasHtmlAttribute(deps, html, name) {
  return new RegExp(`\\s${name}=(['"]).+?\\1`, 'i').test(deps.safeText(html));
}

function buildScreenshotReviewPreflightArtifactWithDeps(deps, contract, renderArtifact, adapter) {
  const {
    PAGE_FIX_ROUTE,
    attachCommon,
    safeArray,
    safeText,
  } = deps;
  const failures = [];
  for (const slide of safeArray(renderArtifact?.html_bundle?.slides)) {
    const slideId = safeText(slide?.slide_id);
    const html = safeText(slide?.content);
    const missingAnchors = [];
    const missingSlideMetadata = [];
    if (!/data-slide-root=(['"])true\1/i.test(html)) missingAnchors.push('data-slide-root');
    if (slideId && !new RegExp(`data-slide-id=(['"])${slideId}\\1`, 'i').test(html)) missingAnchors.push('data-slide-id');
    if (countHtmlMatches(deps, html, /data-qa-block=(['"])[^'"]+\1/gi) < 2) missingAnchors.push('data-qa-block');
    if (countHtmlMatches(deps, html, /data-primary-point=(['"])true\1/gi) < 1) missingAnchors.push('data-primary-point');
    for (const metadataName of [
      'data-title',
      'data-layout-family',
      'data-speaker-seconds',
      'data-recipe-id',
      'data-template-id',
      'data-peak-page',
      'data-director-role',
    ]) {
      if (!hasHtmlAttribute(deps, html, metadataName)) missingSlideMetadata.push(metadataName);
    }
    const sourceTraceMissing = safeArray(slide?.evidence_and_sources).length === 0;
    if (missingAnchors.length > 0 || missingSlideMetadata.length > 0 || sourceTraceMissing) {
      failures.push({
        slide_id: slideId,
        title: safeText(slide?.title),
        status: 'block',
        missing_anchors: missingAnchors,
        missing_slide_metadata: missingSlideMetadata,
        source_trace_missing: sourceTraceMissing,
        recommended_fix: 'rerun fix_html before screenshot AI review',
      });
    }
  }
  if (failures.length === 0) return null;
  const targetSlideIds = failures.map((failure) => safeText(failure.slide_id)).filter(Boolean);
  const checks = {
    html_review_anchors_ok: failures.every((failure) => safeArray(failure.missing_anchors).length === 0),
    slide_metadata_ok: failures.every((failure) => safeArray(failure.missing_slide_metadata).length === 0),
    source_trace_ok: failures.every((failure) => !failure.source_trace_missing),
    ai_review_passed: false,
  };
  const failedChecks = Object.entries(checks)
    .filter(([, value]) => value === false)
    .map(([key]) => key);
  return {
    ...attachCommon('screenshot_review', contract, null, adapter),
    review_overlay: 'screenshot_review',
    mode: 'preflight',
    status: 'block',
    issues: ['preflight_gate_failed'],
    checks,
    preflight_gate: {
      status: 'block',
      gate_model: 'deterministic_ppt_screenshot_review_preflight',
      ai_review_skipped: true,
      target_slide_ids: targetSlideIds,
      failures,
    },
    slide_reviews: failures,
    artifact_refs: [safeText(renderArtifact?.html_bundle?.html_file)].filter(Boolean),
    review_state_patch: {
      current_status: 'blocked_for_revision',
      ready_for_export: false,
      latest_review_stage: 'screenshot_review',
      latest_checks: checks,
      pending_reviews: failedChecks,
      blocking_reasons: failedChecks,
      rerun_from_stage: PAGE_FIX_ROUTE,
      rerun_policy: {
        status: 'rerun_required',
        rerun_from_stage: PAGE_FIX_ROUTE,
        default_route: PAGE_FIX_ROUTE,
        scope: 'slide',
        target_slide_ids: targetSlideIds,
        source_review_stage: 'preflight_gate',
      },
    },
  };
}

export function createPptDeckScreenshotPreflightParts(deps) {
  return {
    buildReviewMarkdown: (contract, reviewArtifact, reviewOwner) => buildReviewMarkdownWithDeps(
      deps,
      contract,
      reviewArtifact,
      reviewOwner,
    ),
    buildScreenshotReviewPreflightArtifact: (contract, renderArtifact, adapter) => buildScreenshotReviewPreflightArtifactWithDeps(
      deps,
      contract,
      renderArtifact,
      adapter,
    ),
  };
}
