const MOBILE_LOCAL_DIGITS = 9;
const LANDLINE_LOCAL_DIGITS = 8;

/**
 * Formats digits typed in any order/shape into a Brazilian phone mask —
 * "(XX) XXXXX-XXXX" for mobile (local part starting with 9) or "(XX) XXXX-XXXX"
 * for landline — and truncates once the number is complete, which also caps
 * the maximum length a user can type.
 */
export function formatBrazilianPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 0) return '';

  const ddd = digits.slice(0, 2);
  if (digits.length <= 2) return `(${ddd}`;

  const isMobile = digits[2] === '9';
  const localDigits = isMobile ? MOBILE_LOCAL_DIGITS : LANDLINE_LOCAL_DIGITS;
  const local = digits.slice(2, 2 + localDigits);
  const splitAt = isMobile ? 5 : 4;
  const firstPart = local.slice(0, splitAt);
  const secondPart = local.slice(splitAt);

  return secondPart ? `(${ddd}) ${firstPart}-${secondPart}` : `(${ddd}) ${firstPart}`;
}
