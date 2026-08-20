import { z } from 'zod';

export const professionalFormSchema = z.object({
  name: z.string().min(2, 'Informe o nome do profissional.').max(120),
  phone: z.union([z.literal(''), z.string().min(10).max(24)]).optional(),
  isActive: z.boolean(),
  serviceIds: z.array(z.string()),
});
export type ProfessionalFormValues = z.infer<typeof professionalFormSchema>;
