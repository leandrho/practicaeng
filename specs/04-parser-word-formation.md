# SPEC 04 — Parser de word-formation (tabla + gap-fill)

> **Status:** Implementado
> **Depends on:** SPEC 01, SPEC 02
> **Date:** 2026-09-17
> **Objective:** Parsear la tabla de `word-formation-b1-b2.md` a `WordFamily[]` y derivar ejercicios `GapFill` para el modo completo.

## Scope

**In:**

- `src/infrastructure/word-formation-parser.ts`: parsea filas de la tabla `Base/Sustantivo/Adjetivo/Adverbio/Significado` (`---` = ausente, celdas con `/` = múltiples formas ej. `amazing / amazed`, celdas multilínea unidas); ignora secciones "Ejemplos para practicar en contexto" e "Idea de tarjeta para la app" (solo se extraen como `examples[]` de ayuda los bullets `**base → ...:** *...*`); valida con `WordFamilySchema` (falla si las 3 formas están ausentes).
- `src/infrastructure/word-formation-loader.ts`: `getWordFamilies(): WordFamily[]` server-only + `buildGapFills(family): GapFill[]` determinístico (1 por forma presente: `prompt` con `______` + `(BASE)`, `answer` = primera forma de la celda).
- Fixtures: 5 filas reales (incluye una con `---` y una con `/`) + tests.
- Verificación contra datos reales: ~80 familias, 0 errores.

**Out of scope (for future specs):**

- Evaluación de respuestas y sesión (SPEC 05).
- UI de word-formation y gap-fill (SPEC 07).
- Nuevos ejercicios generados por IA o banco externo de oraciones.

## Data model

This feature introduces no new data structures. Reusa `WordFamily` y `GapFill` de SPEC 02. Reglas de derivación:

```ts
// Ejemplo de derivación (ilustrativo, no código final)
family = { base: "decide", noun: "decision", adjective: "decisive", adverb: "decisively" }
gapFills = [
  { prompt: "She made an important ______ yesterday. (DECIDE)", base: "decide", answer: "decision" },
  // ... uno por forma presente; la oración viene de examples[] o plantilla "______ (BASE)"
]
```

Convenciones:

- Celda con `/` (`careful / careless`): se guarda la celda completa como string; `answer` del gap-fill = primera forma (`careful`).
- Sin oración de contexto disponible → plantilla `Complete with the correct form of "BASE": ______ (BASE)`; nunca se inventan oraciones con IA.

## Implementation plan

1. Parser de filas de tabla (bordes `|`, multilínea, `---` → `undefined`) + tests con 3 filas. Verificación: `vitest` en verde.
2. Corte de secciones no-tabla + extracción de `examples[]` desde bullets `**base → ...**`. Test: cola real del archivo no genera familias fantasma. Verificación: en verde.
3. `buildGapFills` determinístico (1 por forma presente) + tests (familia completa → 3 gap-fills; familia solo-noun → 1). Verificación: en verde.
4. Loader server-only + assert de conteo sobre datos reales (~80, tolerancia documentada). Verificación: `lint + typecheck + test + build` en verde.

## Acceptance criteria

- [x] Loader parsea `word-formation-b1-b2.md` real con 0 errores y conteo dentro de la tolerancia.
- [x] Fila con `---` en adverbio → `adverb === undefined` (no string `"---"`).
- [x] Celda `amazing / amazed` se conserva completa; su gap-fill usa `amazing`.
- [x] Familia con las 3 formas ausentes falla con error archivo+línea.
- [x] `buildGapFills` es determinístico: mismo input, mismo output, mismo orden (noun → adjective → adverb).
- [x] Secciones finales ("Ejemplos…", "Idea de tarjeta…") generan 0 familias.
- [x] `npm run lint && npm run typecheck && npm run test && npm run build` en verde.

## Decisions

- **Yes:** modo completo con gap-fill en MVP (decisión tuya). La derivación es determinística desde la tabla, sin contenido nuevo que redactar.
- **Yes:** prompts plantilla cuando no hay oración. Inventar oraciones a mano para 80 familias bloquearía el MVP; las oraciones reales se incorporan después sin cambiar el modelo.
- **No:** evaluación de respuestas acá. Va en SPEC 05 (`checkGapFill` pura y testeable).
- **No:** banco de oraciones externo. Fuera del MVP.

## Risks

| Risk | Mitigation |
| ---- | ---------- |
| Filas de tabla con anchos irregulares / celdas partidas en 3 líneas | Parser une líneas hasta cerrar `|` por conteo de columnas, no por línea; test con fila `apply` real |
| `---` con espacios (`--`) por edición manual | Normalizar celda con trim y regex `^-+$` → ausente |

## What is **not** in this spec

- `checkGapFill`, sesión, filtros.
- UI, inputs, feedback visual.
- Corrección masiva del `.md`.
