# Estratégia de testes

- Unitários: serviços de domínio e cálculo de disponibilidade.
- Integração: PostgreSQL real para constraints, Prisma, guards e isolamento de tenant.
- E2E: fluxos públicos e administrativos da API.
- Essenciais: login, RBAC, tenant cruzado, slots, cancelamento, reagendamento e duas confirmações concorrentes no mesmo intervalo.
- Frontend: componentes críticos e fluxo público de reserva com Playwright após o primeiro incremento funcional.
