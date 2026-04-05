import { intakeSource as runSourceIntake } from '@redcube/runtime';

export async function intakeSource(request) {
  return runSourceIntake(request);
}
