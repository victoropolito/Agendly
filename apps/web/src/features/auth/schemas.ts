import { z } from 'zod';

const phoneField = z
  .string()
  .min(10, 'Informe um telefone válido.')
  .max(24, 'Telefone muito longo.')
  .regex(/^[0-9+()\-\s]+$/, 'Use apenas números, espaços e os símbolos + ( ) -.');

const emailField = z.string().min(1, 'Informe o e-mail.').max(70, 'E-mail muito longo.').email('E-mail inválido.');

const slugField = z
  .string()
  .min(1, 'Informe o endereço da barbearia.')
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use apenas letras minúsculas, números e hífens.');

const passwordField = z.string().min(10, 'A senha deve ter pelo menos 10 caracteres.').max(128);

export const loginSchema = z.object({
  email: emailField,
  password: passwordField,
});
export type LoginValues = z.infer<typeof loginSchema>;

export const registerTenantSchema = z.object({
  tenantName: z.string().min(2, 'Informe o nome da barbearia.').max(120),
  tenantSlug: slugField,
  adminName: z.string().min(2, 'Informe seu nome.').max(120),
  phone: phoneField,
  email: emailField,
  password: passwordField,
});
export type RegisterTenantValues = z.infer<typeof registerTenantSchema>;
