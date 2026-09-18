# SPEC 12 — UI toda en inglés

> **Status:** Implementado
> **Depends on:** SPEC 06, SPEC 07, SPEC 08, SPEC 09, SPEC 10, SPEC 11
> **Date:** 2026-09-18
> **Objective:** Pasar todo el chrome del UI a inglés para eliminar el espanglish, manteniendo los datos de aprendizaje en español.

## Scope

**In:**

- `app/layout.tsx`: metadata `title` → "PracticaEng — Practice English vocabulary", `description` → "Practice frequent English vocabulary and structures with active recall flashcards.", `<html lang="es">` → `lang="en"`, skip link "Saltar al contenido" → "Skip to content".
- `app/page.tsx`: nombres "Colocaciones" → "Collocations", "Preposiciones" → "Prepositions", "Modismos y expresiones" → "Idioms & Expressions", "Formación de palabras" → "Word Formation" (Phrasal verbs ya está en inglés); detalles "Verbos con partícula" → "Verbs with particles", "Combinaciones naturales" → "Natural word combinations", "Preposiciones fijas" → "Fixed prepositions", "Expresiones idiomáticas" → "Idiomatic expressions", "Familias de palabras" → "Word families"; unidades "tarjetas" → "cards", "familias" → "families"; hero "Practicá inglés" → "Practice English", "Elegí una sección y practicá con tarjetas: ver, recordar, producir, revelar, comparar, repetir." → "Pick a section and practice with flashcards: see, recall, produce, reveal, compare, repeat.", "{total} tarjetas · {n} secciones" → "{total} cards · {n} sections"; aria "Distribución de tarjetas por sección" → "Card distribution by section", "Practicar {name}" → "Practice {name}".
- `app/components/FlashcardClient.tsx`: "Tarjeta X de Y" → "Card X of Y", "Significado:" → "Meaning:", "Ejemplo:" → "Example:", "Traducción:" → "Translation:", aria "Navegación de tarjetas" → "Card navigation", "Anterior" → "Previous", "Siguiente" → "Next", frente "¿Qué significa? Pensá un ejemplo con esta expresión." → "What does it mean? Think of an example with this expression." ("Reveal" ya está en inglés).
- `app/components/WordFormationClient.tsx`: "Familia X de Y" → "Family X of Y", "Pista:" → "Hint:", aria "Navegación de familias" → "Family navigation", "Anterior" → "Previous", "Siguiente" → "Next", "Producí: noun / adjective / adverb." → "Produce: noun / adjective / adverb.", placeholder "Escribí la primera forma si hay alternativas…" → "Type the first form if there are alternatives…", "Comprobar" → "Check", "Correcto: X" → "Correct: X", "Todavía no: probá de nuevo." → "Not yet: try again.", "Revelar familia" → "Reveal family", "Esta familia no tiene ejercicios disponibles." → "This family has no exercises available." ("Base", "Noun", "Adjective", "Adverb" ya están en inglés).
- `app/components/FiltersContent.tsx`: aria "Filtros" → "Filters", "Nivel" → "Level", "Todos" → "All", "Categoría" → "Category", "Todas" → "All", "Limpiar filtros" → "Clear filters".
- `app/components/EmptyState.tsx`: "No hay tarjetas con estos filtros." → "No cards match these filters.", "Limpiar filtros" → "Clear filters".
- `app/components/FilterDrawerProvider.tsx`: botón "Filtros" → "Filters", título "Filtros" → "Filters", aria "Cerrar panel de filtros" → "Close filters panel", aria "Filtros" → "Filters", "Cerrar filtros" → "Close filters", error de contexto → "useFilterDrawerContext must be used within FilterDrawerProvider".
- `app/components/ThemeToggle.tsx`: "Cambiar a tema claro" → "Switch to light theme", "Cambiar a tema oscuro" → "Switch to dark theme".
- `app/not-found.tsx`, `app/[section]/not-found.tsx`, `app/word-formation/not-found.tsx`: "Esta página no existe." → "This page doesn't exist.", "Volvé al inicio para elegir una sección y seguir practicando." → "Go back home to pick a section and keep practicing.", "Ir al inicio" → "Go home".
- `app/[section]/error.tsx`, `app/word-formation/error.tsx`: "No pudimos cargar esta sección" → "We couldn't load this section", "Algo salió mal." → "Something went wrong.", "Probá de nuevo. Si el problema sigue, volvé más tarde." → "Try again. If the problem persists, come back later.", "Reintentar" → "Retry".
- Actualización de los tests afectados (`page.test.tsx`, `Flashcard.test.tsx`, `WordFormationClient.test.tsx`, `ThemeToggle.test.tsx`, `FilterDrawerProvider.test.tsx`, `error.test.tsx`).

**Out of scope (for future specs):**

- Botón ES para el español en el dorso (SPEC 13).
- Cambios de lógica, estilos, rutas o estructura de datos.
- Contenido de `data/*.md` (sigue en su formato actual).

## Data model

This feature introduces no new data structures. Solo cambian strings literales del UI. Los campos `meaningEs`, `translationEs` y `meaningHint` siguen en español porque son el contenido de aprendizaje, no el chrome.

## Implementation plan

1. Traducir `app/layout.tsx` (metadata, `lang`, skip link). Verificación: render del layout con `lang="en"`.
2. Traducir `app/page.tsx` (nombres, detalles, hero, conteos, aria-labels) + `app/page.test.tsx`. Verificación: test del home en verde.
3. Traducir `FlashcardClient.tsx` (frente, dorso, navegación) + `Flashcard.test.tsx`. Verificación: test de flashcard en verde.
4. Traducir `WordFormationClient.tsx` + `WordFormationClient.test.tsx`. Verificación: test en verde.
5. Traducir filtros (`FiltersContent.tsx`, `EmptyState.tsx`, `FilterDrawerProvider.tsx` + tests), `ThemeToggle.tsx` + test, `not-found.tsx` ×3 y `error.tsx` ×2 (+ tests). Verificación: suite completa en verde.
6. Corrida global `npm run lint && npm run typecheck && npm run test && npm run build`. Verificación: todo en verde.

## Acceptance criteria

- [x] Ningún string visible del UI queda en español (búsqueda de "Practicá", "Tarjeta", "Anterior", "Siguiente", "Limpiar", "Filtros", "Comprobar", "Revelar", "Pista", "Significado", "Traducción", "Practicá", "Elegí" en `app/` solo devuelve comentarios o datos de test).
- [x] `<html lang="en">` y metadata en inglés.
- [x] El flujo Ver → recordar → producir → revelar → comparar → repetir sigue intacto (invariante DOM del frente sin respuestas).
- [x] `npm run lint && npm run typecheck && npm run test && npm run build` en verde.

## Decisions

- **Yes:** traducir también los aria-labels y la metadata, no solo lo visible. Un lector de pantalla en inglés con labels en español es el mismo espanglish en otro canal.
- **Yes:** los datos (`meaningEs`, `translationEs`, `meaningHint`) quedan en español. Son el objeto de estudio, no el chrome; su visibilidad se regula en SPEC 13.
- **Yes:** "Base" queda como está en word-formation. Es válido en inglés y evita renombrar concepto de dominio.
- **No:** i18n con diccionarios o multi-idioma. El producto es UI en inglés + contenido ES; un sistema de locales sería overengineering para el MVP.

## What is **not** in this spec

- Botón ES del dorso.
- Persistencia de preferencias de idioma.
- Cambios visuales, de rutas o de contenido.
