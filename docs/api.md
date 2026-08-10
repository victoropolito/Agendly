# Contrato REST inicial

Todos os endpoints autenticados exigem Bearer token. Rotas administrativas usam o tenant ativo da associação autenticada; IDs de tenant não são recebidos do cliente.

| Área | Endpoint | Papéis |
| --- | --- | --- |
| Auth | `POST /auth/tenant-register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me` | público/autenticado |
| Tenant | `GET/PATCH /tenant/me`; `GET/PUT /tenant/me/business-hours` | admin |
| Profissionais | `GET/POST /professionals`; `GET/PATCH /professionals/:id`; `GET/PUT /professionals/:id/hours` | admin; leitura própria para profissional |
| Serviços | `GET/POST /services`; `GET/PATCH /services/:id` | admin; leitura interna permitida |
| Clientes | `GET /customers`; `GET /customers/:id` | admin/profissional limitado |
| Agenda | `GET /appointments`; `POST /appointments`; `POST /appointments/:id/cancel`; `POST /appointments/:id/reschedule` | admin/profissional; cliente somente para os próprios |
| Bloqueios | `POST /schedule-blocks`; `DELETE /schedule-blocks/:id` | admin/profissional próprio |
| Dashboard | `GET /dashboard/summary` | admin |
| Público | `GET /public/barbershops/:slug`; `GET /public/barbershops/:slug/services`; `GET /public/barbershops/:slug/professionals`; `GET /public/barbershops/:slug/availability`; `POST /public/barbershops/:slug/appointments` | público |

Respostas de conflito de agenda usam `409 Conflict` com código `APPOINTMENT_SLOT_UNAVAILABLE`. A validação de entrada retorna `400`; acesso entre tenants retorna `404` para não revelar existência do recurso.
