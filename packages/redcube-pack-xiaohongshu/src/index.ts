import {
  buildXhsPlanSlides as buildXhsPlanSlidesJs,
  buildXhsRenderHtml as buildXhsRenderHtmlJs,
  buildXhsVisualDirection as buildXhsVisualDirectionJs,
  inferXhsVisualPresentation as inferXhsVisualPresentationJs,
} from './planning.js';
import { compileXhsRenderSlides as compileXhsRenderSlidesJs } from './render-compiler.js';

import type {
  CompileXhsRenderSlidesInput,
  PackDeliverablePaths,
  XhsHydratedContract,
  XhsPlanArtifact,
  XhsPlanSlide,
  XhsPlanningDependencies,
  XhsResearchArtifact,
  XhsRenderArtifact,
  XhsRenderArtifactDependencies,
  XhsRenderSlide,
  XhsSourceVisualPresentation,
  XhsStorylineArtifact,
  XhsVisualDirectionArtifact,
  XhsVisualDirectionDependencies,
} from './types.js';

export function inferXhsVisualPresentation(slide: { layout_family: XhsPlanSlide['layout_family'] }): XhsSourceVisualPresentation {
  return inferXhsVisualPresentationJs(slide) as XhsSourceVisualPresentation;
}

export function buildXhsPlanSlides(
  contract: XhsHydratedContract,
  storyline: XhsStorylineArtifact | null,
  research: XhsResearchArtifact | null,
  deps: XhsPlanningDependencies,
): XhsPlanSlide[] {
  return buildXhsPlanSlidesJs(contract, storyline, research, deps) as XhsPlanSlide[];
}

export function buildXhsVisualDirection(
  contract: XhsHydratedContract,
  deliverablePaths: PackDeliverablePaths,
  mode: XhsVisualDirectionArtifact['mode'],
  baselineDeliverableId: string,
  deps: XhsVisualDirectionDependencies,
): XhsVisualDirectionArtifact {
  return buildXhsVisualDirectionJs(
    contract,
    deliverablePaths,
    mode,
    baselineDeliverableId,
    deps,
  ) as XhsVisualDirectionArtifact;
}

export async function buildXhsRenderHtml(
  contract: XhsHydratedContract,
  deliverablePaths: PackDeliverablePaths,
  deps: XhsRenderArtifactDependencies,
): Promise<XhsRenderArtifact> {
  return buildXhsRenderHtmlJs(contract, deliverablePaths, deps) as Promise<XhsRenderArtifact>;
}

export function compileXhsRenderSlides(input: CompileXhsRenderSlidesInput): XhsRenderSlide[] {
  return compileXhsRenderSlidesJs(input) as XhsRenderSlide[];
}

export type {
  CompileXhsRenderSlidesInput,
  PackDeliverablePaths,
  XhsHydratedContract,
  XhsPlanArtifact,
  XhsPlanSlide,
  XhsPlanningDependencies,
  XhsPromptRoute,
  XhsResearchArtifact,
  XhsRenderArtifact,
  XhsRenderArtifactDependencies,
  XhsRenderContract,
  XhsRenderSlide,
  XhsSourceReference,
  XhsSourceVisualPresentation,
  XhsStorylineArtifact,
  XhsVisualDirection,
  XhsVisualDirectionArtifact,
  XhsVisualDirectionDependencies,
} from './types.js';
