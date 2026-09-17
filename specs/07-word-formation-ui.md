# SPEC 07 — UI de word-formation con gap-fill

> **Status:** Implementado
> **Depends on:** SPEC 01, SPEC 02, SPEC 04, SPEC 05
> **Date:** 2026-09-17
> **Objective:** Modo word-formation completo: frente con base para producir formas, ejercicio gap-fill con input y reverso con la familia.

## Scope

**In:**

- Ruta estática `app/word-formation/page.tsx` (datos de SPEC 04 en build time).
- Frente: `BASE` en grande + "Producí: noun / adjective / adverb" + ejercicio gap-fill con `prompt`, input de texto y botón `Comprobar` (usa `checkGapFill` de SPEC 05, feedback correcto/incorrecto en texto, no solo color) + botón `[ Revelar familia ]`.
- Reverso: `noun / adjective / adverb` presentes (ausentes marcados como "—"), `meaningHint`, `examples[]`, botones `Anterior/Siguiente`.
- Navegación entre familias vía `session.ts`-like local (índice + revealed + gap-fill state reseteado al cambiar).
- Teclado: Enter = comprobar, Espacio = revelar (sin robar foco del input: Espacio en input escribe espacio).

**Out of scope (for future specs):**

- Filtros URL (SPEC 08, se enchufan después).
- Banco de oraciones real para las 80 familias (mejora de contenido, no cambia código).
- Persistencia de aciertos, rachas, SRS (backlog).

## Data model

This feature introduces no new data structures. Reusa `WordFamily`, `GapFill`, `checkGapFill`. Estado local del componente:

```ts
type WFState = { index: number; revealed: boolean; guess: string; checked: "idle" | "correct" | "incorrect" };
```

## Implementation plan

1. Página + loader de familias en build time. Verificación: ruta hace build con conteo real.
2. Frente base + input gap-fill + `Comprobar` con feedback texto ("Correcto: decision" / "Todavía no: probá de nuevo"). Verificación: test componente ambos casos.
3. Reverso familia + Anterior/Siguiente con reseteo de `guess/checked`. Verificación: cambiar de tarjeta limpia el input.
4. Teclado (Enter comprobar; atajos sin conflicto con input) + `aria-live` para feedback. Verificación: manual + test.
5. Tailwind responsive + verificación global.

## Acceptance criteria

- [x] Frente muestra `BASE` y no muestra las formas antes de revelar (assert DOM).
- [x] Escribir `decision` y Comprobar → feedback "correcto" en texto.
- [x] Escribir `decisions` y Comprobar → feedback "incorrecto" en texto (no solo color rojo).
- [x] Revelar muestra las formas presentes y "—" en las ausentes.
- [x] Cambiar de tarjeta resetea input, feedback y revelado.
- [x] Enter en el input comprueba; Espacio en el input escribe espacio (no revela).
- [x] `npm run lint && npm run typecheck && npm run test && npm run build` en verde.

## Decisions

- **Yes:** modo completo en MVP (decisión tuya). Input + revelar conviven: el input ejercita producción, el revelar muestra la familia.
- **Yes:** feedback en texto además de color. Accesibilidad (daltonismo, lectores de pantalla).
- **No:** validación en servidor. Todo es local y estático; no hay nada que proteger.
- **No:** tolerancia a typos (distancia Levenshtein). Estricta salvo mayúsculas/espacios; la tolerancia iría en spec propia si se pide.

## Risks

| Risk | Mitigation |
| ---- | ---------- |
| Respuestas con `/` (`careful / careless`) confunden al usuario | El prompt acepta la primera forma y el reverso muestra la celda completa; placeholder del input lo aclara |
| Enter hace submit/reload del form | Usar `onSubmit.preventDefault()`; test que asserts no-reload |

## What is **not** in this spec

- Filtros URL, secciones bullet, progreso, persistencia.
- Nuevas oraciones o contenido: solo se usa lo parseado en SPEC 04.
