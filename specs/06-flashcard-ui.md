# SPEC 06 — UI de flashcards (4 secciones bullet)

> **Status:** Implementado
> **Depends on:** SPEC 01, SPEC 02, SPEC 03, SPEC 05
> **Date:** 2026-09-17
> **Objective:** Visor de flashcards con el flujo Ver → recordar → producir → revelar → comparar → repetir y navegación anterior/siguiente.

## Scope

**In:**

- Rutas estáticas: `/` (índice de 5 secciones con conteos), `app/[section]/page.tsx` para `phrasal-verbs|collocations|prepositions|idioms` con `generateStaticParams` (datos de SPEC 03 en build time).
- Componente `Flashcard` (Server para datos + Client para interacción): frente con `expression` + "¿Qué significa? Pensá un ejemplo con esta expresión." + botón `[ Reveal ]`; dorso con `meaningEs` + `exampleEn` (+ `translationEs` si existe) + botones `Anterior/Siguiente`; estado vía `session.ts` (SPEC 05).
- Teclado ←/→/Espacio, `aria-live="polite"` en reveal, foco visible, copy rioplatense ("Pensá").
- Invariante dura: el frente nunca contiene `meaningEs/exampleEn/translationEs` en el DOM (ni ocultos).

**Out of scope (for future specs):**

- Word-formation y gap-fill (SPEC 07).
- Filtros por URL (SPEC 08).
- Progreso, "Lo sabía/No lo sabía", favoritos, stats (backlog).

## Data model

This feature introduces no new data structures. Reusa `Card`, `SessionState`, `ContentRepository`. Mapeo ruta → sección de `sections.ts`.

## Implementation plan

1. Página `/` con las 5 secciones (nombre ES, conteo, link). Verificación: render estático con 5 links.
2. `app/[section]/page.tsx` + `generateStaticParams` (4 secciones bullet; word-formation redirige a su ruta de SPEC 07). Verificación: build genera las 4 rutas.
3. Componente `Flashcard` frente (expression + prompt + Reveal, sin respuesta en DOM). Test: `queryByText(meaning)` es null antes de Reveal. Verificación: en verde.
4. Dorso + Anterior/Siguiente cableados a `session.ts` + teclado + `aria-live`. Verificación: click Reveal muestra dorso; bordes no rompen.
5. Tailwind responsive (móvil primero, tarjeta legible a 360px) + verificación global.

## Acceptance criteria

- [ ] `/` muestra 5 secciones con conteos correctos y links funcionales.
- [x] Cada ruta de sección hace build estático sin errores.
- [ ] Antes de Reveal, el DOM no contiene `meaningEs` ni `exampleEn` (assert de test).
- [x] Click en Reveal muestra `meaningEs` + `exampleEn`.
- [x] `Siguiente` en la última y `Anterior` en la primera no rompen (botón deshabilitado o sin cambio).
- [x] Teclas ←/→/Espacio replican Anterior/Siguiente/Reveal.
- [x] Copy del frente incluye "Pensá" (rioplatense), no "Piensa".
- [x] Sección inexistente (`/nope`) → 404, no crash.
- [x] `npm run lint && npm run typecheck && npm run test && npm run build` en verde.

## Decisions

- **Yes:** Server Components para datos + isla Client mínima para interacción. Menos JS, compatible con estático.
- **Yes:** invariante testeada en DOM, no solo visual. Es el corazón pedagógico del producto.
- **Yes:** word-formation fuera: tiene interacción distinta (input) y va en SPEC 07.
- **No:** botones "Lo sabía/No lo sabía". Requieren persistencia (post-MVP); agregarlos ahora sería UI muerta.

## Risks

| Risk | Mitigation |
| ---- | ---------- |
| Phrasal con 200 tarjetas genera página pesada | Render de a 1 tarjeta (solo current en DOM) + prefetch de la siguiente como máximo |
| Hidratación rompe el invariante (respuesta en HTML inicial) | Frente y dorso se condicionan por estado client; test DOM lo cubre |

## What is **not** in this spec

- Word-formation, gap-fill, filtros URL.
- Persistencia, progreso, favoritos, SRS, stats.
