import { BadRequestException } from '@nestjs/common';

export function normalizePhone(value: string): string {
  const normalized = value.replace(/\D/g, '');
  if (normalized.length < 10 || normalized.length > 15) {
    throw new BadRequestException('Telefone inválido.');
  }
  return normalized;
}

/**
 * Every phone captured in the product is a Brazilian DDD + number typed without a country
 * code (e.g. "(11) 99999-0000" → "11999990000", 10-11 digits). WhatsApp needs the full E.164
 * digits including the country code, so we prepend "55" unless it's already there.
 */
export function toWhatsAppE164BR(phoneNormalized: string): string {
  if (phoneNormalized.length <= 11) {
    return `+55${phoneNormalized}`;
  }
  return phoneNormalized.startsWith('55') ? `+${phoneNormalized}` : `+55${phoneNormalized}`;
}
