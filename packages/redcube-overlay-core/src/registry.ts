import type {
  OverlayCatalogEntry,
  OverlayDefinition,
  OverlayRegistry,
} from './types.js';

export function createOverlayRegistry(overlays: Record<string, OverlayDefinition>): OverlayRegistry {
  const table = { ...overlays };

  for (const [overlayKey, overlay] of Object.entries(table)) {
    if (overlay?.overlayId !== overlayKey) {
      throw new Error(
        `Overlay registry key mismatch: expected ${overlayKey}, got ${overlay?.overlayId}`,
      );
    }
  }

  return {
    getOverlay(overlayId: string): OverlayDefinition {
      const overlay = table[overlayId];
      if (!overlay) {
        throw new Error(`Unknown overlay: ${overlayId}`);
      }
      return overlay;
    },
    describeOverlay(overlayId: string): OverlayCatalogEntry {
      const overlay = this.getOverlay(overlayId);
      if (typeof overlay.describeOverlay === 'function') {
        return overlay.describeOverlay();
      }
      return {
        overlay_id: overlay.overlayId,
        default_profile_id: overlay.defaultProfileId || null,
        profiles: Object.keys(overlay.profiles || {}),
      };
    },
    listOverlays(): string[] {
      return Object.keys(table);
    },
    listOverlayCatalog(): OverlayCatalogEntry[] {
      return this.listOverlays().map((overlayId) => this.describeOverlay(overlayId));
    },
    listProfiles(overlayId: string): string[] {
      const overlay = this.getOverlay(overlayId);
      return Object.keys(overlay.profiles || {});
    },
  };
}
