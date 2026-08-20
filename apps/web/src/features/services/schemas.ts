import { z } from 'zod';

export const serviceFormSchema = z.object({
  name: z.string().min(2, 'Informe o nome do serviço.').max(120),
  description: z.string().max(2000).optional(),
  priceReais: z.coerce.number().min(0, 'Informe um preço válido.').max(100_000),
  durationMinutes: z.coerce.number().int().min(5, 'Mínimo de 5 minutos.').max(600, 'Máximo de 600 minutos.'),
  isActive: z.boolean(),
});
export type ServiceFormValues = z.infer<typeof serviceFormSchema>;
export type ServiceFormInput = z.input<typeof serviceFormSchema>;
