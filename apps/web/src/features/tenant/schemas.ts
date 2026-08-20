import { z } from 'zod';

export const tenantSettingsSchema = z.object({
  name: z.string().min(2, 'Informe o nome da barbearia.').max(120),
  phone: z.union([z.literal(''), z.string().min(10).max(24)]).optional(),
  email: z.union([z.literal(''), z.string().email('E-mail inválido.')]).optional(),
  description: z.string().max(2000).optional(),
  address: z.string().max(1000).optional(),
  timezone: z.string().max(64).optional(),
});
export type TenantSettingsValues = z.infer<typeof tenantSettingsSchema>;
