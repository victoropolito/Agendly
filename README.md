# Agendly

Plataforma SaaS multi-tenant para barbearias.

## Pré-requisitos

- Node.js 24+
- pnpm 11+
- Docker Desktop

## Ambiente local

1. Copie `.env.example` para `.env` e substitua os segredos locais.
2. Execute `docker compose up -d`.
3. Execute `pnpm install`.
4. Execute `pnpm dev:api` e `pnpm dev:web` em terminais separados.

A documentação de arquitetura está em [`docs/`](docs/).
