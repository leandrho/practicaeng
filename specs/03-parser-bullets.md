# SPEC 03 — Parser y loader de los 4 archivos bullet

> **Status:** Implementado
> **Depends on:** SPEC 01, SPEC 02
> **Date:** 2026-09-17
> **Objective:** Parsear `phrasal-verbs`, `collocations`, `prepositions` e `idioms` desde sus `.md` reales a `Card[]` validadas con Zod en build time.

## Scope

**In:**

- `src/infrastructure/markdown-parser.ts`: 2 gramáticas bullet — (a) phrasal `### N. expresión` + `- **Significado:**` + `- **Ejemplo:**`; (b) bullets `**expr** --- significado --- *ejemplo*` (collocations/prepositions/idioms). `category` = header `##` más cercano (phrasal sin headers → `category = "general"`).
- Ignorar bloques no-tarjeta: intro, nota `>`, y el bloque final "Estructura sugerida para la app" con JSON de ejemplo en phrasal-verbs.
- `src/infrastructure/content-loader.ts`: lee los 4 archivos reales por ruta de `sections.ts` (solo server/build, nunca client), valida cada tarjeta con `CardSchema`, error legible `{ archivo, línea, motivo }`; exporta `ContentRepository { getCards(section), getSections() }` y lista de secciones.
- Fixtures mínimas (3–5 tarjetas por gramática) + tests: parse OK, tarjeta rota → error con archivo/línea, ninguna `Card` sale sin pasar por Zod.
- Verificación contra datos reales: ~200 + ~50 + ~49 + ~35 tarjetas sin errores.

**Out of scope (for future specs):**

- Tabla word-formation (SPEC 04, gramática distinta).
- Casos de uso, sesión, filtros (SPEC 05).
- UI (SPEC 06).
- Renombrar archivos `data/` (se mantienen nombres reales).

## Data model

This feature introduces no new data structures. Reusa `Card`, `CardType`, mapa de `sections.ts` de SPEC 02. Solo agrega el tipo de error:

```ts
// src/infrastructure/markdown-parser.ts
type ParseError = { file: string; line: number; reason: string };
```

Convenciones:

- `type` se deriva del archivo: `phrasal-verbs-*` → `phrasal-verb`, `collocations-*` → `collocation`, `fixed-prepositions-*` → `preposition`, `idioms-*` → `idiom`.
- `level` no se parsea (ausente en `.md`): queda el default `"B1-B2"` del schema.
- `translationEs` no se parsea (ausente): queda `undefined`.

## Implementation plan

1. Implementar gramática (b) bullets + tests con fixture de 5 líneas (incluye header `## MAKE` → `category: "MAKE"` y bullet multilínea con `*ejemplo*` partido). Verificación: `vitest` en verde.
2. Implementar gramática (a) phrasal (`### 1. ask around` + Significado/Ejemplo) + test con 3 tarjetas y caso `Ejemplo` faltante → `ParseError` con línea. Verificación: en verde.
3. Implementar corte de bloques no-tarjeta (intro/`>`/sección final JSON de phrasal). Test: parsear cola real de phrasal-verbs no produce tarjetas fantasma. Verificación: en verde.
4. Implementar `content-loader.ts` (lectura `fs` server-only, `import "server-only"` si aplica) + `ContentRepository`. Verificación: loader sobre fixtures devuelve `Card[]` validadas.
5. Correr loader sobre `data/` reales y fijar conteos esperados como asserts (phrasal 200; colloc/prep/idioms por conteo real ± tolerancia documentada). Verificación: `lint + typecheck + test + build` en verde.

## Acceptance criteria

- [x] Loader parsea los 4 archivos reales con 0 errores y conteos coinciden con los asserts.
- [x] Bullet multilínea (`*ejemplo*` partido en 2 líneas) se une en un solo `exampleEn`.
- [x] Tarjeta sin `Ejemplo` produce `ParseError` con archivo y línea correctos.
- [x] El bloque JSON final de phrasal-verbs genera 0 tarjetas.
- [x] Collocations bajo `## DO` → `category === "DO"`; phrasal → `category === "general"`.
- [x] Ningún `Card` se construye sin `CardSchema.parse` (prohibido casteo `as Card` sobre datos crudos).
- [x] `content-loader` no es importable desde Client Components (server-only o test que falla si se importa en client).
- [x] `npm run lint && npm run typecheck && npm run test && npm run build` en verde.

## Decisions

- **Yes:** 2 gramáticas en una spec (phrasal vs bullets). Las 3 de bullets comparten una sola implementación parametrizada por `type`.
- **Yes:** errores con archivo+línea. Sin esto, corregir 200 tarjetas de phrasal es inviable.
- **Yes:** asserts de conteo sobre datos reales. Detectan ediciones accidentales de `data/`.
- **No:** tocar `data/`. Si una tarjeta real está rota, el parser la reporta; la corrección de contenido va en commit separado, no en esta rama.
- **No:** caché incremental. ~334 tarjetas parsean en ms en build; optimizar sería overengineering.

## Risks

| Risk | Mitigation |
| ---- | ---------- |
| Ediciones futuras de `data/` rompen la gramática silenciosamente | Asserts de conteo + `ParseError` hacen fallar el build con mensaje accionable |
| Bullets multilínea con `---` dentro del ejemplo | El split se hace solo sobre el primer `---` fuera de `*...*`; test dedicado |

## What is **not** in this spec

- Tabla word-formation y gap-fill.
- Sesión, filtros, orden, UI.
- Renombres de archivos o corrección masiva de contenido.
