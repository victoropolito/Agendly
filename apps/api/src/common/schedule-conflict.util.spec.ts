import { isScheduleConflictError } from './schedule-conflict.util';

describe('isScheduleConflictError', () => {
  it('recognizes a Postgres exclusion constraint violation by name', () => {
    const error = new Error(
      'Invalid `prisma.appointment.create()` invocation: conflicting key value violates exclusion constraint "schedule_entries_professional_time_no_overlap"',
    );
    expect(isScheduleConflictError(error)).toBe(true);
  });

  it('does not misclassify unrelated errors', () => {
    expect(isScheduleConflictError(new Error('customers_tenantId_phoneNormalized_key'))).toBe(false);
    expect(isScheduleConflictError('not an error instance')).toBe(false);
  });
});
