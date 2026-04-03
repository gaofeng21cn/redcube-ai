import { auditDeliverableRequest } from '@redcube/runtime';

export async function auditDeliverable(request) {
  return auditDeliverableRequest(request);
}
