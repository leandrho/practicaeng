# SPEC 05 — Casos de uso de sesión y evaluación

> **Status:** Draft
> **Depends on:** SPEC 01, SPEC 02
> **Date:** 2026-09-17
> **Objective:** Implementar la lógica pura de sesión flashcards (frente/revelado, anterior/siguiente) más filtros y evaluación de gap-fill, sin UI ni persistencia.

## Scope

**In:**

- `src/application/session.ts`: máquina mínima `{ cards, index, revealed }` + `reveal()`, `next()`, `prev()`, `goTo(i)`; funciones puras (retornan nuevo estado, no mutan); bordes definidos: `next` en última → se queda (flag `atEnd`), `prev` en primera → se queda (`atStart`); `goTo` fuera de rango → error.
- `src/application/getSections.ts` / `getCards.ts` / `filterCards.ts`: secciones fijas (5), `filterCards(cards, { level?, category?, type? })` AND de criterios, comparaciones exactas.
- `src/application/checkGapFill.ts`: normaliza (trim + lowercase + colapsa espacios) y compara con `answer` (acepta primera forma si hay `/`); retorna `{ correct: boolean }`.
- `src/application/shuffle.ts`: barajado con semilla opcional (determinístico en tests).
- Tests puros para todo (usan fixtures, no leen `data/`).

**Out of scope (for future specs):**

- UI, rutas, URL params (SPEC 06–08).
- Persistencia, progreso, SRS, stats, favoritos (backlog post-MVP).
- Aleatoriedad criptográfica o analytics.

## Data model

```ts
// src/application/session.ts
type SessionState = { cards: Card[]; index: number; revealed: boolean };
type SessionView = SessionState & { current: Card | null; atStart: boolean; atEnd: boolean };
type Filter = { level?: string; category?: string; type?: CardType };
```

Convenciones:

- Estado inmutable: cada transición retorna un objeto nuevo.
- `reveal()` solo flipa `revealed: true`; nunca expone datos extra (la UI decide qué renderizar).
- `next/prev` resetean `revealed: false`.

## Implementation plan

1. `filterCards` + tests (filtro B1-B2 devuelve todo; categoría inexistente → `[]`; combinación level+category AND). Verificación: `vitest` en verde.
2. `session.ts` (init/reveal/next/prev/goTo + `SessionView`) + tests de bordes e inmutabilidad. Verificación: en verde.
3. `checkGapFill` + tests (`"Decision"` vs `"decision"` → correct; `"decisions"` → incorrect; espacios extra → correct). Verificación: en verde.
4. `shuffle` con semilla + test determinístico (misma semilla → mismo orden; distinto array original intacto). Verificación: en verde.
5. Barrels + verificación global `lint + typecheck + test + build`.

## Acceptance criteria

- [ ] `reveal()` en `index 0` no cambia `index` ni `cards`, solo `revealed`.
- [ ] `next()` en la última tarjeta mantiene `index` y marca `atEnd === true`.
- [ ] `prev()` en la primera mantiene `index` y marca `atStart === true`.
- [ ] `goTo(-1)` y `goTo(cards.length)` lanzan error.
- [ ] Ninguna transición muta el estado de entrada (`Object.isFrozen` o comparación de referencia en tests).
- [ ] `filterCards` con `{ level: "B1-B2" }` devuelve todas; con `{ category: "NOPE" }` devuelve `[]`.
- [ ] `checkGapFill("  DECISION ", "decision")` → `{ correct: true }`.
- [ ] `shuffle` no muta el input y con semilla fija es determinístico.
- [ ] `npm run lint && npm run typecheck && npm run test && npm run build` en verde.

## Decisions

- **Yes:** funciones puras sin clases. Testeables, sin estado oculto, migran tal cual cuando haya DB.
- **Yes:** bordes que se quedan en lugar de wrap-around. Evita saltos sorpresivos; el wrap se agregaría como opción explícita si se pide.
- **Yes:** `checkGapFill` tolerante a mayúsculas/espacios pero estricta en contenido (`decisions` ≠ `decision`).
- **No:** persistencia de sesión. Sin DB en MVP; la sesión vive en memoria/URL.
- **No:** SRS ni ponderación. Backlog post-MVP.

## What is **not** in this spec

- Componentes, páginas, estilos, URL params.
- Lectura de `data/`, Prisma, JWT.
- Progreso, rachas, estadísticas.
