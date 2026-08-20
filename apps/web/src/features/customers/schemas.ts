import { z } from 'zod';

export const customerFormSchema = z.object({
  name: z.string().min(2, 'Informe o nome do cliente.').max(120),
  phone: z.string().min(10, 'Informe um telefone válido.').max(24),
  email: z.union([z.literal(''), z.string().email('E-mail inválido.')]).optional(),
});
export type CustomerFormValues = z.infer<typeof customerFormSchema>;
