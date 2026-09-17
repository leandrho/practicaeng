# SPEC 02 — Modelo de dominio y schemas Zod

> **Status:** Implementado
> **Depends on:** SPEC 01
> **Date:** 2026-09-17
> **Objective:** Definir los tipos y schemas Zod canónicos (`Card`, `WordFamily`, `GapFill`) tolerantes a los `data/*.md` reales.

## Scope

**In:**

- `src/domain/card.ts`: `Card { expression, type, level, meaningEs, exampleEn, translationEs?, category, sourceFile }` con schema Zod; `CardType = phrasal-verb|collocation|preposition|idiom`; `level` default `"B1-B2"` (los `.md` reales solo declaran B1–B2 global); `translationEs` opcional (los `.md` no la traen); `category` string derivada del header `##` más cercano.
- `src/domain/word-formation.ts`: `WordFamily { base, noun?, adjective?, adverb?, meaningHint?, examples[] }` (`---` del `.md` = ausente) y `GapFill { prompt, base, answer }`.
- `src/domain/sections.ts`: mapa sección → archivo real (`phrasal-verbs → data/phrasal-verbs-b1-b2-200.md`, `collocations → data/collocations-b1-b2.md`, `prepositions → data/fixed-prepositions-b1-b2.md`, `idioms → data/idioms-b1-b2.md`, `word-formation → data/word-formation-b1-b2.md`).
- Tests unitarios puros en `src/domain/*.test.ts` (válido/inválido por schema).

**Out of scope (for future specs):**

- Parser markdown y loader (SPEC 03, 04).
- Casos de uso y sesión (SPEC 05).
- UI (SPEC 06, 07).
- Migración a JSON canónico con `translation` obligatoria (backlog post-MVP).

## Data model

```ts
// src/domain/card.ts
const Card = z.object({
  expression: z.string().min(1),          // "give up"
  type: z.enum(["phrasal-verb", "collocation", "preposition", "idiom"]),
  level: z.string().default("B1-B2"),    // default: los .md no traen level por tarjeta
  meaningEs: z.string().min(1),          // "rendirse"
  exampleEn: z.string().min(1),          // "Don't give up."
  translationEs: z.string().optional(),  // ausente en los .md reales
  category: z.string().min(1),           // header ## más cercano, ej. "MAKE"
  sourceFile: z.string().min(1),         // "data/idioms-b1-b2.md"
});

// src/domain/word-formation.ts
const WordFamily = z.object({
  base: z.string().min(1),               // "decide"
  noun: z.string().optional(),           // "decision" ("---" = ausente)
  adjective: z.string().optional(),
  adverb: z.string().optional(),
  meaningHint: z.string().optional(),
  examples: z.array(z.string()).default([]),
});
const GapFill = z.object({
  prompt: z.string().min(1),             // "I haven't made a final ______ yet. (DECIDE)"
  base: z.string().min(1),
  answer: z.string().min(1),             // "decision"
});
```

Convenciones:

- `level` es string libre con default, no enum: hoy todo es `"B1-B2"`; el enum B1/B2/C1 llegaría con datos futuros sin romper el schema.
- `translationEs` opcional hasta que exista contenido real traducido.

## Implementation plan

1. Crear `src/domain/card.ts` con enums, schemas y tipos inferidos (`export type Card = z.infer<typeof CardSchema>`). Verificación: `tsc --noEmit` en verde.
2. Crear `src/domain/word-formation.ts` con `WordFamily` y `GapFill`. Verificación: importa desde `card.ts` sin ciclos.
3. Crear `src/domain/sections.ts` con el mapa sección → archivo real + test de que los 5 archivos existen en disco. Verificación: test en verde.
4. Escribir `src/domain/*.test.ts`: Card válida pasa; `expression` vacía falla; `type` inválido falla; `level` ausente → default `"B1-B2"`; `WordFamily` con todo `---` (todo ausente) falla por refinamiento `al menos 1 forma`. Verificación: `vitest run` en verde.
5. Exportar todo desde `src/domain/index.ts`. Verificación: `lint + typecheck + test + build` en verde.

## Acceptance criteria

- [x] `z.parse` de una Card completa devuelve el objeto sin mutaciones salvo `level` default.
- [x] Card sin `level` → `level === "B1-B2"`.
- [x] Card sin `translationEs` pasa; con `translationEs: ""` falla.
- [x] `type: "verb"` falla con error Zod.
- [x] `WordFamily` con `noun/adjective/adverb` ausentes falla (refinamiento mínimo 1 forma).
- [x] `sections.ts` lista exactamente 5 secciones y los 5 archivos existen en `data/`.
- [x] `npm run lint && npm run typecheck && npm run test && npm run build` en verde.

## Decisions

- **Yes:** `translationEs` opcional. Los `.md` reales no traen traducción del ejemplo; volverla obligatoria bloquearía el MVP.
- **Yes:** `level` string con default `"B1-B2"`. Refleja los datos reales y deja abierta la granularidad B1/B2/C1 sin migración de schema.
- **Yes:** `category` derivada del header `##`. Es la única categorización que existe en collocations/prepositions.
- **No:** normalizar `data/` ahora. El dominio tolera los datos; el parser adapta (SPEC 03/04).
- **No:** JSON canónico en MVP. Es backlog; el shape ya es compatible hacia adelante.

## What is **not** in this spec

- Parsing de markdown, lectura de archivos, caché de build.
- Lógica de sesión, filtros, orden aleatorio.
- UI, rutas, estilos.
