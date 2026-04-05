import { getDefaultOverlayCatalog } from '@redcube/overlay-registry';

export async function getOverlayCatalog() {
  const catalog = getDefaultOverlayCatalog();
  return {
    ok: true,
    ...catalog,
    recommended_action: 'create_deliverable',
    summary: {
      total_overlays: catalog.overlays.length,
      total_profiles: catalog.overlays.reduce((sum, overlay) => sum + overlay.profiles.length, 0),
    },
  };
}
