import { z } from 'zod';

const optionalPhone = z.union([z.literal(''), z.string().min(10, 'Informe um WhatsApp válido.').max(24)]).optional();
const optionalEmail = z
  .union([z.literal(''), z.string().max(70, 'E-mail muito longo.').email('E-mail inválido.')])
  .optional();

export const customerRegisterSchema = z
  .object({
    name: z.string().min(2, 'Informe seu nome.').max(120),
    phone: optionalPhone,
    email: optionalEmail,
    password: z.string().min(10, 'A senha deve ter pelo menos 10 caracteres.').max(128),
  })
  .superRefine((data, ctx) => {
    if (!data.phone && !data.email) {
      const message = 'Informe pelo menos um: e-mail ou WhatsApp.';
      ctx.addIssue({ code: z.ZodIssueCode.custom, message, path: ['phone'] });
      ctx.addIssue({ code: z.ZodIssueCode.custom, message, path: ['email'] });
    }
  });
export type CustomerRegisterValues = z.infer<typeof customerRegisterSchema>;

export const customerLoginSchema = z.object({
  identifier: z.string().min(3, 'Informe seu e-mail ou WhatsApp.').max(255),
  password: z.string().min(1, 'Informe sua senha.'),
});
export type CustomerLoginValues = z.infer<typeof customerLoginSchema>;
