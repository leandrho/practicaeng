# SPEC 18 — Cobertura total de pistas con fotos literales

> **Status:** Implementado
> **Depends on:** SPEC 14, SPEC 15, SPEC 16
> **Date:** 2026-09-18
> **Objective:** Cubrir con foto literal local las ~490 pistas restantes siguiendo el patrón de SPEC 16.

## Scope

**In:**

- `public/hints/*.webp`: ~490 fotos nuevas vendorizadas, una por expresión/familia restante, mismo formato que el lote 1 (ancho máx. ~640 px, tope 120 KB por archivo, WebP, sin hotlinking).
- `src/infrastructure/hints/curated.ts`: ampliar de 20 a ~510 entradas (clave = expresión normalizada `lowercase.trim()`, valor = `HintId`).
- `src/infrastructure/hints/photos.ts`: una entrada por `HintId` nuevo con `src`, `width`, `height` y `credit { author, license, source }`.
- `src/infrastructure/hints/photos.test.ts`: cobertura = todos los curados tienen foto y archivo dentro del presupuesto (salvo fallbacks documentados).
- `src/domain/hints.ts` y `gallery.tsx`: sin cambios salvo que un lote lo exija (el fallback SVG por `type` sigue intacto).
- Criterio visual literal/obvio de SPEC 16 para los 6 grupos: phrasals restantes (180), collocations (50), prepositions (49), idioms (35), irregular-verbs (100, mapeo por base), word-formation (76, mapeo por `family.base`).
- Revisión visual obligatoria por foto contra `meaningEs` y ejemplo antes de vendorizar.

**Out of scope (for future specs):**

- URLs remotas, hotlinking, GIF/video/Lottie o APIs con key.
- Cambios en `data/*.md`, `Card`, `WordFamily`, parsers o `resolveHint`.
- Persistir `showHint`, atajo de teclado, pistas progresivas o analytics.
- Reemplazar las 20 fotos del lote 1.

## Data model

Sin cambios de tipos. Se reutiliza el modelo de SPEC 15:

```ts
// src/infrastructure/hints/photos.ts
type PhotoCredit = { author: string; license: string; source: string };
type PhotoEntry = {
  src: `/hints/${string}.webp`;
  width: number;
  height: number;
  credit: PhotoCredit;
};
const hintPhotos: Partial<Record<HintId, PhotoEntry>> = { /* ~510 entradas */ };
```

Convenciones:

- `HintId` = `<kebab-expresión>-<concepto>` en minúsculas ASCII, único (ej. `a-piece-of-cake-slice`, `make-a-decision-pen`, `eat-meal`, `decide-choice`).
- Clave de `curated.ts` = expresión exacta normalizada: phrasals/collocations/prepositions/idioms según `card.expression`; irregulars según base (`be`, no el triple); word-formation según `family.base` en minúsculas.
- `alt` siempre genérico (`Pista visual`); el crédito visible lleva solo autor y licencia, nunca el significado.
- Sin texto legible en escena salvo que sea la pista misma (regla SPEC 16).
- Fuentes permitidas (decisión del usuario: cualquier fuente libre): Unsplash, Pexels, Wikimedia Commons, Flickr vía Openverse, con licencia que permita uso comercial (CC BY / BY-SA / CC0 / PDM / Unsplash / Pexels); la entrada guarda autor + licencia + página de origen aunque la licencia no exija atribución.

Detalle de lotes (490 restantes = 180 + 50 + 49 + 35 + 100 + 76):

| Lote | Grupo | Cantidad | Ejemplo de mapeo |
|---|---|---|---|
| A | Idioms | 35 | `break the ice` → foto de gente rompiendo el hielo en reunión |
| B | Collocations | 50 | `make a decision` → persona decidiendo entre opciones |
| C | Prepositions | 49 | `interested in` → persona mirando tecnología con interés |
| D | Irregular verbs | 100 | `eat` → alguien comiendo; `go` → gente yendo a la playa |
| E1–E3 | Phrasal verbs | 180 (3×60) | `ask out` → invitación a cenar; `bring up` → mencionar un tema |
| F | Word formation | 76 | `decide` → decisión; `succeed` → éxito |

## Implementation plan

1. Lote A (idioms, 35): curar fotos literales, convertir a WebP ≤120 KB en `public/hints/`, ampliar `curated.ts` + `photos.ts`, actualizar `photos.test.ts`. Verificación: `vitest run photos` en verde y revisión visual de las 35.
2. Lote B (collocations, 50): mismo procedimiento para las 50 collocations. Verificación: `vitest run` en verde, build sin requests de red.
3. Lote C (prepositions, 49): mismo procedimiento; las abstractas (`advantage of`, `reason for`) usan best-effort literal y si no hay nada digno quedan en fallback SVG documentado. Verificación: lista explícita de fallbacks en el PR.
4. Lote D (irregular verbs, 100): mapeo por base (`eat`, `take`, `write`) con acción literal del ejemplo. Verificación: `resolveHint("eat", "irregular-verb", …)` devuelve el curado.
5. Lote E1 (phrasals 60/180): primeros 60 phrasals restantes por orden de archivo. Verificación: build verde.
6. Lote E2 (phrasals 60/180): siguientes 60. Verificación: build verde.
7. Lote E3 (phrasals 60/180): últimos 60, con lo que phrasals queda 200/200. Verificación: ningún phrasal cae a fallback.
8. Lote F (word-formation, 76): mapeo por `family.base` con objeto/escena del significado orientativo; abstractas sin literal digno quedan en fallback documentado. Verificación: `npm run lint && npm run typecheck && npm run test && npm run build` en verde.

## Acceptance criteria

- [x] Cada lote mergeado deja `npm run lint && npm run typecheck && npm run test && npm run build` en verde sin `.env` ni requests de red.
- [x] Toda foto vendorizada pesa ≤120 KB, tiene ≤640 px de ancho y es WebP en `public/hints/` (reorganizado luego en `public/hints/<sección>/` por pedido del usuario).
- [x] Toda entrada de `photos.ts` tiene archivo existente, dimensiones reales y crédito con autor, licencia y página de origen.
- [x] Cada foto muestra el significado de forma literal y obvia (persona/objeto/acción del ejemplo); las que quedan en fallback SVG están listadas en el PR.
- [x] Antes de pulsar "Ver pista", el DOM no contiene foto, crédito ni respuestas; tras pulsar, la foto tiene `alt` genérico.
- [x] Al completar los 8 pasos, `curated.ts` cubre las ~510 expresiones y ningún grupo visual (idioms, collocations, irregulars, phrasals) cae a fallback salvo las abstractas documentadas.

## Decisions

- **Yes:** un solo spec por lotes incrementales en lugar de 6 specs. Cada paso deja el sistema funcional y pausable para diff review.
- **Yes:** cualquier fuente libre (Unsplash/Pexels/Wikimedia/Flickr) en lugar de solo Openverse. Pedido del usuario; se mantiene la exigencia de uso comercial permitido y crédito trazable.
- **Yes:** literal best-effort + fallback SVG documentado. Para abstractas (`advantage of`, `differently`) no se fuerza una foto engañosa.
- **Yes:** todo incluido (irregulars por base, word-formation por `family.base`). Pedido del usuario; el costo es solo más entradas, sin cambios de tipos.
- **Yes:** mismos nombres de patrón `<kebab>-<concepto>` y mismo presupuesto 120 KB/WebP/640 px. Consistencia con SPEC 15/16 y repo estimado en ~25 MB totales.
- **No:** hotlinking ni URLs remotas. Rompe el build estático offline.
- **No:** tocar `data/*.md`, `Card`, parsers ni `resolveHint`. La foto sigue siendo presentación.

## Risks

| Risk | Mitigation |
| ---- | ---------- |
| Un lote de 100 fotos es irrevisable | Phrasals se parte en 3×60; cada lote es un PR propio con lista de conceptos |
| El repo crece ~25 MB de golpe | Lotes secuenciales; tope 120 KB/foto testeado en `photos.test.ts` |
| Una candidata titular engaña o tiene texto | Revisión visual obligatoria por foto antes de vendorizar (regla SPEC 16) |
| La foto tan literal spoilea | Aceptado por el usuario; la pista sigue optativa y colapsada |
| Fuente remota muere antes de vendorizar | Solo se mergea lo vendorizado en `public/hints/`; la URL directa queda en el historial |

## What is **not** in this spec

- URLs remotas, hotlinking, GIF/video/Lottie o APIs con key.
- Cambios en `data/*.md`, `Card`, `WordFamily`, parsers o `resolveHint`.
- Persistencia de `showHint`, atajo de teclado o pistas progresivas.
- Reemplazo de las 20 fotos del lote 1.
