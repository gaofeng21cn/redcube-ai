export function createOverlayRegistry(overlays) {
  const table = { ...overlays };

  for (const [overlayKey, overlay] of Object.entries(table)) {
    if (overlay?.overlayId !== overlayKey) {
      throw new Error(
        `Overlay registry key mismatch: expected ${overlayKey}, got ${overlay?.overlayId}`,
      );
    }
  }

  return {
    getOverlay(overlayId) {
      const overlay = table[overlayId];
      if (!overlay) {
        throw new Error(`Unknown overlay: ${overlayId}`);
      }
      return overlay;
    },
    describeOverlay(overlayId) {
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
    listOverlays() {
      return Object.keys(table);
    },
    listOverlayCatalog() {
      return this.listOverlays().map((overlayId) => this.describeOverlay(overlayId));
    },
    listProfiles(overlayId) {
      const overlay = this.getOverlay(overlayId);
      return Object.keys(overlay.profiles || {});
    },
  };
}
