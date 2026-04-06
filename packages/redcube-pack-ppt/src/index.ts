import {
  buildPptDetailedOutline as buildPptDetailedOutlineJs,
  buildPptOutlineSlides as buildPptOutlineSlidesJs,
  buildPptRenderArtifact as buildPptRenderArtifactJs,
  buildPptSlideBlueprint as buildPptSlideBlueprintJs,
  buildPptVisualDirection as buildPptVisualDirectionJs,
} from './index.js';
import { compilePptRenderSlides as compilePptRenderSlidesJs } from './render-compiler.js';

import type {
  CompilePptRenderSlidesInput,
  PptBlueprintArtifact,
  PptBuildRenderArtifactInput,
  PptDeliverablePaths,
  PptDetailedOutlineArtifact,
  PptHydratedContract,
  PptOutlineDependencies,
  PptOutlineSlide,
  PptRenderArtifact,
  PptRenderArtifactDependencies,
  PptRenderSlide,
  PptSlideBlueprintDependencies,
  PptVisualDirectionArtifact,
  PptVisualDirectionDependencies,
} from './types.js';

export function buildPptOutlineSlides(
  contract: PptHydratedContract,
  deps: PptOutlineDependencies,
): PptOutlineSlide[] {
  return buildPptOutlineSlidesJs(contract, deps) as PptOutlineSlide[];
}

export function buildPptDetailedOutline(
  contract: PptHydratedContract,
  deps: PptOutlineDependencies & PptSlideBlueprintDependencies,
): PptDetailedOutlineArtifact {
  return buildPptDetailedOutlineJs(contract, deps) as PptDetailedOutlineArtifact;
}

export function buildPptSlideBlueprint(
  contract: PptHydratedContract,
  deps: PptOutlineDependencies & PptSlideBlueprintDependencies,
): PptBlueprintArtifact {
  return buildPptSlideBlueprintJs(contract, deps) as PptBlueprintArtifact;
}

export function buildPptVisualDirection(
  contract: PptHydratedContract,
  blueprintArtifact: PptBlueprintArtifact,
  mode: PptVisualDirectionArtifact['visual_direction']['mode'],
  baselineDeliverableId: string,
  deps: PptVisualDirectionDependencies,
): PptVisualDirectionArtifact {
  return buildPptVisualDirectionJs(
    contract,
    blueprintArtifact,
    mode,
    baselineDeliverableId,
    deps,
  ) as PptVisualDirectionArtifact;
}

export async function buildPptRenderArtifact(
  input: PptBuildRenderArtifactInput,
  deps: PptRenderArtifactDependencies,
): Promise<PptRenderArtifact> {
  return buildPptRenderArtifactJs(input, deps) as Promise<PptRenderArtifact>;
}

export function compilePptRenderSlides(input: CompilePptRenderSlidesInput): PptRenderSlide[] {
  return compilePptRenderSlidesJs(input) as PptRenderSlide[];
}

export type {
  CompilePptRenderSlidesInput,
  PptBlueprintArtifact,
  PptBlueprintSlide,
  PptBuildRenderArtifactInput,
  PptDeliverablePaths,
  PptDetailedOutlineArtifact,
  PptHydratedContract,
  PptOutlineDependencies,
  PptOutlineSlide,
  PptRenderArtifact,
  PptRenderArtifactDependencies,
  PptRenderContract,
  PptRenderSlide,
  PptSlideBlueprintDependencies,
  PptSourceMaterial,
  PptSourceReference,
  PptVisualDirection,
  PptVisualDirectionArtifact,
  PptVisualDirectionDependencies,
} from './types.js';
