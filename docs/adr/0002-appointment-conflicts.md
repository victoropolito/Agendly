# ADR 0002 — Conflitos de agenda garantidos pelo PostgreSQL

**Status:** Aceito  
**Data:** 2026-08-10

## Decisão

Slots são calculados no backend, mas a confirmação é garantida por transação e constraint de exclusão PostgreSQL baseada em intervalo temporal por profissional.

## Consequência

Em disputa concorrente, apenas uma reserva é persistida. A outra recebe uma resposta de indisponibilidade; a tela deve atualizar os horários sem considerar o estado local como definitivo.
