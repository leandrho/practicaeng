# SPEC 19 — Sección de frases cotidianas

> **Status:** Implementada
> **Depends on:** SPEC 06, SPEC 08, SPEC 12, SPEC 17, SPEC 18
> **Date:** 2026-09-19
> **Objective:** Agregar una sección Everyday Phrases con 150 frases cotidianas B1-B2, traducciones y una pista fotográfica local por tarjeta.

## Scope

**In:**

- `data/everyday-phrases-b1-b2-150.md`: 150 tarjetas de frases cotidianas inéditas, agrupadas en seis categorías de 25, con `meaningEn`, traducción rioplatense, ejemplo en inglés y su traducción.
- Las categorías del Markdown y del filtro son `Greetings & socializing`, `Courtesy & requests`, `Home & daily routine`, `Shopping, food & services`, `Travel & directions` y `Work, plans & problems`.
- `src/domain/card.ts`: nuevo tipo de tarjeta `everyday-phrase`.
- `src/domain/sections.ts`, `src/infrastructure/content-loader.ts` y sus tests: sección `everyday-phrases`, archivo de contenido y carga mediante el parser de bullets existente.
- `src/infrastructure/fixtures/content/data/everyday-phrases-b1-b2-150.md`: fixture mínimo de una tarjeta para la sección nueva.
- `app/page.tsx` y `app/page.test.tsx`: tarjeta de inicio `Everyday Phrases`, ruta `/everyday-phrases`, detalle `Common phrases for daily situations`, conteo y segmento en la barra de distribución.
- `app/[section]/page.tsx`: título, prompt, acento y generación estática para la nueva sección, usando el flujo de flashcards existente.
- `app/globals.css`: acento propio `--accent-everyday-phrases: #0e7490` en claro y `#67e8f9` en oscuro, aplicado al card, home y fallback de pista de la sección.
- `public/hints/everyday-phrases/*.webp`: 150 fotos locales, una por frase, en WebP, con ancho máximo de 640 px, peso máximo de 120 KB y sin texto legible.
- `src/infrastructure/hints/curated.ts` y `photos.ts`: los 150 mapeos de expresión normalizada a `HintId` y sus fotos, dimensiones y créditos trazables.
- `src/domain/hints.ts`, `src/domain/hints.test.ts` y `src/infrastructure/hints/photos.test.ts`: soporte de fallback para `everyday-phrase` y cobertura que garantiza que toda pista curada tiene foto local dentro del presupuesto.
- Tests de contenido, dominio, home, ruta y pistas actualizados para la séptima sección y sus 150 tarjetas.

**Out of scope (for future specs):**

- Más de 150 frases, otros niveles o separación individual entre B1 y B2.
- Frases repetidas literalmente de las secciones actuales.
- Persistencia de progreso, favoritos, autenticación, analytics o cambios al flujo de active recall.
- Hotlinking, imágenes remotas, APIs con key, GIF, video o fallback SVG para las 150 frases finales.
- Cambios al contenido o a las fotos ya existentes en las otras secciones.

## Data model

```ts
// src/domain/card.ts
const CardTypeSchema = z.enum([
  "phrasal-verb",
  "collocation",
  "preposition",
  "idiom",
  "irregular-verb",
  "everyday-phrase",
]);

// src/domain/sections.ts
const SECTIONS = [
  "phrasal-verbs",
  "collocations",
  "prepositions",
  "idioms",
  "irregular-verbs",
  "word-formation",
  "everyday-phrases",
] as const;

const SECTION_FILES = {
  "everyday-phrases": "data/everyday-phrases-b1-b2-150.md",
};
```

Cada línea de contenido usa el formato de `parseBulletCards`:

```md
## Greetings & socializing
- **How's it going?** --- ask how someone is doing --- ¿Cómo va todo? --- *How's it going at your new job?* --- *¿Cómo va todo en tu nuevo trabajo?*
```

Convenciones:

- Las 150 tarjetas usan el nivel combinado existente `B1-B2`.
- Cada categoría contiene exactamente 25 frases.
- Las expresiones no repiten, tras normalizarlas con `lowercase.trim()`, ninguna expresión de `data/*.md` existente ni otra tarjeta del archivo nuevo.
- Todo `HintId` de la sección tiene el patrón `<kebab-expresion>-<concepto-literal>` y una entrada correspondiente en `hintPhotos`.
- Las fotos viven en `public/hints/everyday-phrases/<hint-id>.webp`; cada entrada guarda `src`, dimensiones reales y `credit { author, license, source }`.
- El `alt` es siempre `Pista visual` y el crédito visible contiene únicamente autor y licencia.

## Implementation plan

1. Extender `CardTypeSchema`, `SECTIONS`, `SECTION_FILES`, `CONTENT_SECTIONS` y `parseCards` para `everyday-phrases`; agregar el fixture mínimo y actualizar tests de dominio, cargador y `getSections`. Verificación: el repositorio carga una tarjeta fixture de tipo `everyday-phrase`.
2. Crear `data/everyday-phrases-b1-b2-150.md` con las seis categorías y 25 tarjetas válidas en cada una; actualizar el baseline de conteos del cargador y agregar validación de 150 tarjetas, categorías completas y ausencia de expresiones repetidas. Verificación: el repositorio devuelve exactamente 150 `everyday-phrase` B1-B2.
3. Integrar la sección en `app/page.tsx` y `app/[section]/page.tsx`, con título `Everyday Phrases`, detalle `Common phrases for daily situations`, prompt estándar de flashcard y acento propio; actualizar los tests del home y los estilos claro/oscuro, incluido el fallback de pista. Verificación: `/everyday-phrases` se genera estáticamente, muestra una tarjeta y permite los filtros existentes.
4. Agregar soporte `everyday-phrase` en `resolveHint` y su test; curar el lote `Greetings & socializing` con sus 25 fotos WebP y mapeos/créditos. Verificación: las 25 expresiones resuelven una pista curada con foto local.
5. Curar `Courtesy & requests` (25 fotos) y actualizar `curated.ts`, `photos.ts` y los tests de presupuesto. Verificación: las 50 frases acumuladas de la sección tienen foto local y crédito.
6. Curar `Home & daily routine` (25 fotos) y actualizar sus registros. Verificación: las 75 frases acumuladas de la sección tienen foto local y crédito.
7. Curar `Shopping, food & services` (25 fotos) y actualizar sus registros. Verificación: las 100 frases acumuladas de la sección tienen foto local y crédito.
8. Curar `Travel & directions` (25 fotos) y actualizar sus registros. Verificación: las 125 frases acumuladas de la sección tienen foto local y crédito.
9. Curar `Work, plans & problems` (25 fotos), completar los 150 registros y reforzar `photos.test.ts` para exigir paridad exacta entre los `HintId` curados de Everyday Phrases y sus archivos locales. Verificación: las 150 frases resuelven una foto local sin fallback.

## Acceptance criteria

- [x] `data/everyday-phrases-b1-b2-150.md` contiene exactamente 150 tarjetas válidas `B1-B2`, distribuidas en seis categorías de exactamente 25 frases.
- [x] Ninguna expresión normalizada de Everyday Phrases se repite dentro del archivo ni coincide con una expresión normalizada de las secciones existentes.
- [x] `contentRepository.getCards("everyday-phrases")` devuelve 150 tarjetas de tipo `everyday-phrase` y `getSections()` expone las siete secciones fijas.
- [x] El home muestra `Everyday Phrases`, `Common phrases for daily situations`, el conteo 150 y un enlace funcional a `/everyday-phrases`.
- [x] `/everyday-phrases` muestra el título, el prompt estándar de recall y conserva el flujo Ver → recordar → producir → revelar → comparar → repetir sin mostrar respuestas antes de Reveal.
- [x] La sección usa el acento cian `#0e7490` en claro y `#67e8f9` en oscuro sin reutilizar el acento de otra sección.
- [x] Cada una de las 150 expresiones resuelve una pista curada con una foto WebP local existente en `public/hints/everyday-phrases/`, de hasta 640 px de ancho y 120 KB.
- [x] Cada foto tiene dimensiones reales y crédito con autor, licencia y página de origen; no contiene texto legible ni revela la respuesta mediante `alt` o crédito.
- [x] No queda ninguna expresión de Everyday Phrases en fallback SVG al finalizar la implementación.
- [x] `npm run lint && npm run typecheck && npm run test && npm run build` termina en verde sin `.env` ni requests de red.

## Decisions

- **Yes:** sección principal independiente `Everyday Phrases`. Permite practicar frases conversacionales frecuentes sin mezclar su propósito con phrasal verbs, collocations o idioms.
- **Yes:** 150 frases B1-B2 en seis grupos iguales de 25. Mantiene la convención actual de nivel combinado y ofrece categorías utilizables por el filtro.
- **Yes:** crear `data/everyday-phrases-b1-b2-150.md` con el parser de bullets existente. Evita un nuevo formato de contenido o parser.
- **Yes:** tipo de dominio `everyday-phrase`. Representa correctamente las frases y habilita acento y fallback propios.
- **Yes:** significado y ejemplo en inglés con traducción rioplatense. Es el formato de aprendizaje vigente y conserva el dorso de tarjeta existente.
- **Yes:** fotos locales para las 150 frases desde el primer lanzamiento. La sección no termina con fallbacks y mantiene el build estático offline.
- **Yes:** acento cian (`#0e7490` claro, `#67e8f9` oscuro). Distingue visualmente la sección sin reutilizar un color asociado a otro tipo.
- **No:** duplicar expresiones existentes. Cada tarjeta nueva debe aportar una frase cotidiana distinta.
- **No:** separar B1 de B2. Extender el formato por tarjeta y los filtros queda para otra spec si se necesita.
- **No:** URLs remotas, hotlinking o imágenes generadas en runtime. Son incompatibles con la garantía offline y el control de peso del repositorio.

## Risks

| Risk | Mitigation |
| ---- | ---------- |
| Una frase propuesta coincide con contenido ya publicado | Comparar expresiones normalizadas contra todas las fuentes `data/*.md` antes de aceptar el lote. |
| Una frase abstracta no admite una foto literal | Seleccionar o reformular la frase durante curaduría; no se acepta fallback para esta sección. |
| Las 150 fotos inflan demasiado el repositorio | Tope de 120 KB por WebP y seis lotes de 25 con verificación en cada paso. |
| Una foto, crédito o alt revela la respuesta | Revisión visual por expresión; alt genérico y crédito limitado a autor/licencia. |
| Una fuente externa desaparece | Solo se entrega la foto ya vendorizada; `source` queda como trazabilidad, no como dependencia de runtime. |

## What is **not** in this spec

- Más de 150 frases, niveles separados B1/B2 o otras secciones temáticas.
- Duplicados de phrasal verbs, collocations, prepositions, idioms o irregular verbs existentes.
- Progreso persistente, favoritos, usuarios, autenticación o analytics.
- Hotlinking, APIs con key, GIF/video y fallbacks SVG para las frases finales.
- Cambios al contenido o las fotos de las secciones ya existentes.
