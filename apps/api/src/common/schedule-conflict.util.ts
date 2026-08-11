const OVERLAP_CONSTRAINT_NAME = 'schedule_entries_professional_time_no_overlap';

export function isScheduleConflictError(error: unknown): boolean {
  return error instanceof Error && error.message.includes(OVERLAP_CONSTRAINT_NAME);
}
