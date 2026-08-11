import { DateTime } from 'luxon';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function jsWeekdayOf(date: string, timezone: string): number {
  const dt = DateTime.fromISO(date, { zone: timezone });
  return dt.weekday % 7;
}

export function localDateTimeToUtc(date: string, time: string, timezone: string): Date {
  const dt = DateTime.fromISO(`${date}T${time}`, { zone: timezone });
  return dt.toUTC().toJSDate();
}

export function utcToLocalTime(value: Date, timezone: string): string {
  return DateTime.fromJSDate(value, { zone: 'utc' }).setZone(timezone).toFormat('HH:mm');
}

export function isValidDateString(value: string): boolean {
  return DATE_PATTERN.test(value) && DateTime.fromISO(value).isValid;
}

export function nowInZone(timezone: string): DateTime {
  return DateTime.now().setZone(timezone);
}

export function laterOf(a: Date, b: Date): Date {
  return a.getTime() > b.getTime() ? a : b;
}

export function earlierOf(a: Date, b: Date): Date {
  return a.getTime() < b.getTime() ? a : b;
}
