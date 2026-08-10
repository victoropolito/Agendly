# Arquitetura do MVP

## Decisões-base

- Monorepo com `apps/web` (Next.js) e `apps/api` (NestJS), TypeScript e pnpm workspaces.
- PostgreSQL compartilhado com isolamento lógico obrigatório por `tenant_id`.
- Prisma é o acesso padrão ao banco; consultas de domínio recebem `TenantContext` validado no backend.
- Redis atende rate limit e BullMQ. Notificações são assíncronas e nunca participam da transação de agenda.
- Datas são persistidas como `timestamptz`; cada tenant possui `timezone` IANA (padrão `America/Sao_Paulo`).
- Valores monetários são inteiros em centavos e duração é mantida em minutos.

## Limites de módulos

| Módulo | Responsabilidade |
| --- | --- |
| `auth` | Identidade, senha, tokens e sessão. |
| `tenants` | Tenant, membros, papéis e contexto do tenant. |
| `professionals`, `services`, `customers` | Cadastros e regras próprias. |
| `availability` | Calcula slots elegíveis; não cria reservas. |
| `appointments` | Cria, cancela e reagenda transacionalmente. |
| `notifications` | Consome eventos pós-commit e registra tentativas. |
| `whatsapp` | Implementa providers de envio, sem regra de agenda. |

## Isolamento multi-tenant

1. Entidades operacionais possuem `tenant_id` e índices compostos com ele.
2. Endpoints autenticados resolvem o tenant por associação `tenant_member`, nunca por um ID confiado ao cliente.
3. Cada busca por recurso restringe simultaneamente `id` e `tenant_id`.
4. Rotas públicas resolvem apenas tenant ativo pelo `slug`.
5. A suíte de testes deve cobrir acesso cruzado para cada módulo protegido.

## Agenda e concorrência

- Horários do negócio e do profissional definem as janelas elegíveis.
- Agendamentos ativos e bloqueios excluem intervalos sobrepostos.
- A confirmação executa em transação PostgreSQL.
- Uma constraint de exclusão sobre o intervalo de um profissional será criada em migration SQL: dois agendamentos ativos não poderão ocupar o mesmo período, mesmo sob concorrência.
- Eventos de notificação são publicados somente após o commit.

## Segurança

- Senhas com Argon2id; access token curto e refresh token rotacionável e revogável.
- DTOs validados no backend, RBAC por guarda e rate limiting em login e rotas públicas.
- Segredos somente por variáveis de ambiente; logs nunca incluem tokens ou hashes.

## Fora do MVP

Pagamentos, unidades, férias, escalas, integração oficial Meta e OTP por WhatsApp ficam fora do primeiro incremento de produto.
