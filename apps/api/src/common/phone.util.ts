import { BadRequestException } from '@nestjs/common';

export function normalizePhone(value: string): string {
  const normalized = value.replace(/\D/g, '');
  if (normalized.length < 10 || normalized.length > 15) {
    throw new BadRequestException('Telefone inválido.');
  }
  return normalized;
}
