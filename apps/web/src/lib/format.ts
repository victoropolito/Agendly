export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatDurationMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h${rest}min`;
}

export function formatPhoneDisplay(phone: string | null | undefined): string {
  if (!phone) return '—';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

/**
 * `isoDate` is a pure calendar date ("YYYY-MM-DD") with no time-of-day, so it's parsed as local
 * year/month/day components — not via `new Date(isoDate)`, which the JS spec anchors to UTC
 * midnight and would shift the displayed weekday/day back by one for any UTC-negative viewer.
 */
export function formatDateLong(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });
}

export function formatDateShort(isoDate: string, timezone?: string): string {
  return new Date(isoDate).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(timezone ? { timeZone: timezone } : {}),
  });
}

export function formatTime(isoDateTime: string, timezone?: string): string {
  return new Date(isoDateTime).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    ...(timezone ? { timeZone: timezone } : {}),
  });
}

const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: 'Confirmado',
  CANCELLED: 'Cancelado',
  COMPLETED: 'Concluído',
  NO_SHOW: 'Não compareceu',
};

export function formatAppointmentStatus(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
