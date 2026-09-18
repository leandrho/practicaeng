# SPEC 17 — Encabezado de práctica fuera del card

> **Status:** Implementado
> **Depends on:** SPEC 12
> **Date:** 2026-09-18
> **Objective:** Mostrar el título de la sección y la instrucción de recall una sola vez arriba del card en lugar de repetirla dentro de cada frente.

## Scope

**In:**

- `app/[section]/page.tsx`: header server-side con `h1` del nombre de sección y el párrafo de instrucción verbatim (`What does it mean? Think of an example with this expression.`), renderizado una vez sobre el `<Flashcard>`.
- `app/word-formation/page.tsx`: mismo patrón con `h1` "Word Formation" y el párrafo verbatim (`Produce: noun / adjective / adverb.`).
- `app/components/FlashcardClient.tsx`: se elimina el `<p>` del prompt en `FlashcardFront`; la expression pasa de `h1` a `h2`.
- `app/components/WordFormationClient.tsx`: se elimina el `<p>Produce:…</p>` del frente (se mantiene el kicker `Base`); la base pasa de `h1` a `h2`.
- `app/globals.css`: estilos `.practice-header` (mismo ancho 44rem que el card) y ajuste del selector `.flashcard__kicker + h1` a `h2`.
- Tests de componente y verificación de suite completa.

**Out of scope (for future specs):**

- Resumen de filtros activos o conteo de cards en el header (posible spec 18).
- Cambios en el dorso, navegación, pistas, drawer de filtros o `data/*.md`.
- Internacionalización del header al español.

## Data model

Esta feature no introduce nuevas estructuras de datos. Reutiliza `ContentSection` y los nombres de sección ya usados en `app/page.tsx` (`Phrasal verbs`, `Collocations`, `Prepositions`, `Idioms & Expressions`, `Word Formation`).

## Implementation plan

1. Crear este spec en `specs/17-practice-header.md`.
2. Agregar el header en `app/[section]/page.tsx` con mapa de títulos por sección e instrucción verbatim. Verificación: `curl localhost:3000/phrasal-verbs` contiene un solo `What does it mean`.
3. Agregar el header en `app/word-formation/page.tsx`. Verificación: `curl localhost:3000/word-formation` contiene un solo `Produce:`.
4. Quitar el prompt del frente y degradar `h1` → `h2` en `FlashcardClient.tsx` y `WordFormationClient.tsx`. Verificación: `vitest run` en verde.
5. Estilos `.practice-header` en `globals.css` y ajuste del selector del kicker. Verificación: revisión visual en ambos temas.
6. Actualizar/agregar asserts en `Flashcard.test.tsx` y `WordFormationClient.test.tsx`. Verificación: `npm run lint && npm run typecheck && npm run test && npm run build` en verde.

## Acceptance criteria

- [x] Cada página de práctica tiene exactamente un `h1` (el título de la sección) y la expression/base del card es `h2`.
- [x] La instrucción aparece una sola vez por página, arriba del card, y no se re-anima al cambiar de carta (vive fuera del `key={card.expression}`).
- [x] El frente del card ya no contiene el texto de la instrucción.
- [x] El flujo Ver → recordar → producir → revelar → comparar → repetir se preserva (Reveal sigue sin mostrar la respuesta por adelantado).
- [x] `npm run lint && npm run typecheck && npm run test && npm run build` en verde.

## Decisions

- **Yes:** mover el texto verbatim en inglés. Pedido del usuario; la UI es inglesa desde SPEC 12.
- **Yes:** header en el server component de página, no en el client del card. Se renderiza una vez y no participa de las animaciones de transición entre cartas.
- **Yes:** degradar la expression/base a `h2`. Un solo `h1` por página (a11y/SEO); los tests por rol `heading` siguen pasando.
- **Yes:** solo título + instrucción, sin resumen de filtros ni conteo. Lo más simple que resuelve el pedido; el resto va a otra spec si se pide.
- **No:** ocultar la instrucción tras Reveal. Al vivir fuera del card queda siempre visible; se asume como mejora, no como pérdida.

## What is **not** in this spec

- Resumen de filtros activos o conteo de cards en el header.
- Cambios visuales al card, dorso, navegación o pistas.
- Traducción del header al español.
