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
    listOverlays() {
      return Object.keys(table);
    },
  };
}
