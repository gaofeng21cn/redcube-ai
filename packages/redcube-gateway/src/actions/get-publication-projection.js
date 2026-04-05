import { getPublicationProjection as loadPublicationProjection } from '@redcube/runtime';

export async function getPublicationProjection(request) {
  return loadPublicationProjection(request);
}
