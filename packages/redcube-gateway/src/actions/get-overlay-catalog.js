import { getDefaultOverlayCatalog } from '@redcube/overlay-registry';

export async function getOverlayCatalog() {
  return {
    ok: true,
    ...getDefaultOverlayCatalog(),
  };
}
