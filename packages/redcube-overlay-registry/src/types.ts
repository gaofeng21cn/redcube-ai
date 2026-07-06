import type {
  OverlayCatalogEntry,
} from '@redcube/overlay-core';

export interface DefaultOverlayModuleSpec {
  overlayId: string;
  module: string;
  exportName: string;
}

export interface OverlayCatalogSurface {
  surface_kind: 'overlay_catalog';
  overlays: OverlayCatalogEntry[];
}

export interface DefaultOverlayCatalogSurface extends OverlayCatalogSurface {}

export type {
  OverlayCatalogEntry,
};
