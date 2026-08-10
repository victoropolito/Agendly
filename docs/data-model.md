# Modelo de dados inicial

Convenções: PKs são UUID; timestamps usam `timestamptz`; preços usam centavos (`integer`); exclusão lógica usa `deleted_at` apenas em cadastros que precisam preservar histórico.

| Tabela | Campos essenciais | Índices e constraints |
| --- | --- | --- |
| `tenants` | `id`, `name`, `slug`, `timezone`, `status`, contato, endereço, `created_at`, `updated_at`, `deleted_at` | `slug` único; índice em `status` |
| `users` | `id`, `name`, `phone_normalized`, `email`, `password_hash`, `status`, timestamps | `phone_normalized` único; e-mail único quando informado |
| `tenant_members` | `id`, `tenant_id`, `user_id`, `role`, `status`, timestamps | FK para tenant/user; único `(tenant_id, user_id, role)` |
| `professionals` | `id`, `tenant_id`, `user_id?`, nome público, telefone, `is_active`, timestamps | FK; único parcial `(tenant_id, user_id)`; índice `(tenant_id, is_active)` |
| `customers` | `id`, `tenant_id`, `user_id?`, nome, telefone, e-mail, timestamps | único `(tenant_id, phone_normalized)`; índice `(tenant_id, name)` |
| `services` | `id`, `tenant_id`, nome, descrição, `price_cents`, `duration_minutes`, `is_active`, timestamps, `deleted_at` | índice `(tenant_id, is_active)`; duração e preço não negativos |
| `professional_services` | `tenant_id`, `professional_id`, `service_id` | FKs; único `(professional_id, service_id)` |
| `business_hours` | `id`, `tenant_id`, `weekday`, `start_time`, `end_time`, `is_active` | índice `(tenant_id, weekday)`; `start_time < end_time` |
| `professional_hours` | `id`, `tenant_id`, `professional_id`, `weekday`, `start_time`, `end_time`, `is_active` | índice `(tenant_id, professional_id, weekday)` |
| `appointments` | `id`, `tenant_id`, `customer_id`, `professional_id`, `service_id`, `starts_at`, `ends_at`, preço/duração congelados, `status`, `source`, timestamps | índices `(tenant_id, starts_at)` e `(professional_id, starts_at)`; constraint anti-sobreposição para status ativos |
| `schedule_blocks` | `id`, `tenant_id`, `professional_id`, `starts_at`, `ends_at`, motivo, timestamps | índice `(professional_id, starts_at)`; também exclui sobreposição com agenda |
| `schedule_entries` | tabela interna: `id`, `tenant_id`, `professional_id`, `starts_at`, `ends_at`, referência opcional a agendamento ou bloqueio | constraint de exclusão única para qualquer ocupação da agenda |
| `notifications` | `id`, `tenant_id`, `appointment_id?`, canal, tipo, destino, payload, status, tentativas, erro, timestamps | índice `(tenant_id, status, created_at)` |
| `whatsapp_connections` | `id`, `tenant_id`, provider, status, identificadores externos e referência segura de segredo | único `(tenant_id, provider)` |

## Estados iniciais

- `tenant.status`: `ACTIVE`, `SUSPENDED`.
- `appointment.status`: `CONFIRMED`, `CANCELLED`, `COMPLETED`, `NO_SHOW`.
- Agendamentos confirmados e bloqueios possuem uma `schedule_entry`; cancelamento ou remoção de bloqueio exclui a entrada na mesma transação e libera o horário.
- `notification.status`: `PENDING`, `PROCESSING`, `SENT`, `FAILED`.
