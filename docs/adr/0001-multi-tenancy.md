# ADR 0001 — Isolamento lógico por tenant_id

**Status:** Aceito  
**Data:** 2026-08-10

## Contexto

O MVP atende múltiplas barbearias sem necessidade atual de banco ou schema dedicado por cliente.

## Decisão

Usar um PostgreSQL compartilhado. Toda entidade de domínio da barbearia terá `tenant_id`; o backend resolve o contexto do tenant e o aplica obrigatoriamente nas operações. Constraints e índices incluirão o tenant sempre que necessário.

## Consequências

Desenvolvimento e operação permanecem simples no MVP. O risco de vazamento é mitigado por guardas, filtros obrigatórios e testes. RLS no PostgreSQL pode ser acrescentado como defesa em profundidade quando o produto exigir maior maturidade operacional.
