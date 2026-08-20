export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(status: number, code: string | undefined, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export function isSlotUnavailableError(error: unknown): boolean {
  return error instanceof ApiError && error.code === 'APPOINTMENT_SLOT_UNAVAILABLE';
}
