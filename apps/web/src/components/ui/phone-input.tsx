import * as React from 'react';

import { Input } from '@/components/ui/input';
import { formatBrazilianPhone } from '@/lib/phone-mask';

/** Drop-in replacement for `<Input>` on Brazilian phone/WhatsApp fields — auto-formats as the user types. */
const PhoneInput = React.forwardRef<HTMLInputElement, React.ComponentProps<typeof Input>>(function PhoneInput(
  { value, onChange, ...props },
  ref,
) {
  return (
    <Input
      {...props}
      ref={ref}
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      value={typeof value === 'string' ? value : ''}
      onChange={(event) => {
        event.target.value = formatBrazilianPhone(event.target.value);
        onChange?.(event);
      }}
    />
  );
});

export { PhoneInput };
