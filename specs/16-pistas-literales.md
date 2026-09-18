# SPEC 16 — Pistas literales y obvias (recuraduría del lote 1)

> **Status:** Implementado
> **Depends on:** SPEC 15
> **Date:** 2026-09-18
> **Objective:** Reemplazar las 19 fotos metafóricas del lote 1 por fotos literales y obvias que muestren directamente el significado, y completar la curaduría pendiente de `look-after-orbit` (20/20 con foto).

## Scope

**In:**

- `public/hints/*.webp`: las 20 fotos re-vendorizadas con el mismo nombre de archivo (mismo `HintId`), ~640 px de ancho máx., tope 120 KB por archivo, WebP. Dos recortes de edición: `get-away-horizon` sin los bordes negros con rótulo, `break-down-split` sin la marca de agua inferior.
- `src/infrastructure/hints/photos.ts`: 20 entradas con `src`, dimensiones reales y crédito actualizado (autor, licencia, página de origen). Se suma `look-after-orbit`; ya no hay `HintId` curado sin foto.
- `src/infrastructure/hints/photos.test.ts`: el test de cobertura ahora exige los 20 curados (se elimina el filtro que excluía `look-after-orbit`).
- `app/components/Flashcard.test.tsx`: crédito esperado actualizado (`Foto: David Rosen / CC BY 2.0`) y fallback SVG verificado con una expresión sin curaduría (`run into`) en lugar de `look after`.
- `curated.ts`, `gallery.tsx`, `resolveHint`, `Card`, parsers y `data/*.md` no se tocan.

**Out of scope (for future specs):**

- Las ~580 fotos restantes (specs por sección, igual que SPEC 15).
- URLs remotas, GIF/video/Lottie, APIs con key.
- Persistir `showHint`, atajo de teclado, pistas progresivas o analytics.
- Cambios en `data/*.md`, `Card`, `WordFamily`, parsers o `resolveHint`.

## Data model

Sin cambios de tipos: `Partial<Record<HintId, PhotoEntry>>` con `src`, `width`, `height` y `credit { author, license, source }`. Pasa a tener las 20 entradas (cobertura total, sin ausencias a propósito).

Fotos curadas (concepto literal, licencia de uso comercial verificada vía Openverse, todas BY 2.0 o BY-SA 2.0):

| Expresión | Archivo | Concepto literal | Licencia |
|---|---|---|---|
| ask around | `ask-around-ripples.webp` | Hombre preguntando a una vecina en el balcón | CC BY 2.0 |
| back up | `back-up-layers.webp` | Laptop junto a disco externo (copia de seguridad) | CC BY 2.0 |
| break down | `break-down-split.webp` | Grúa remolcando un vehículo averiado | CC BY 2.0 |
| bring back | `bring-back-orbit.webp` | Foto antigua (trae recuerdos) | CC BY 2.0 |
| call off | `call-off-cross.webp` | Cartel de evento cancelado | CC BY-SA 2.0 |
| carry on | `carry-on-path.webp` | Escritorio de trabajo (seguir con el trabajo) | CC BY-SA 2.0 |
| catch up | `catch-up-steps.webp` | Corredor alcanzando a otro en carrera | CC BY 2.0 |
| check in | `check-in-gate.webp` | Mostrador de check-in en aeropuerto con valijas | CC BY 2.0 |
| cheer up | `cheer-up-sun.webp` | Niños riendo felices | CC BY 2.0 |
| give up | `give-up-flag.webp` | Boxeador agotado (a punto de rendirse) | CC BY 2.0 |
| get along | `get-along-bridge.webp` | Tres niñas abrazadas riendo (llevarse bien) | CC BY 2.0 |
| get away | `get-away-horizon.webp` | Vacaciones en la playa | CC BY 2.0 |
| get back | `get-back-loop.webp` | Casa (el hogar al que se regresa) | CC BY 2.0 |
| get over | `get-over-arch.webp` | Caballos saltando el obstáculo (superar) | CC BY 2.0 |
| look after | `look-after-orbit.webp` | Niña paseando/cuidando a su perro | CC BY 2.0 |
| look for | `look-for-beacon.webp` | Llave perdida encontrada (buscar las llaves) | CC BY-SA 2.0 |
| look forward to | `look-forward-arrow.webp` | Reencuentro feliz padre-hijo (¡qué ganas de verte!) | CC BY 2.0 |
| make up | `make-up-join.webp` | Dos amigas abrazadas (reconciliarse) | CC BY 2.0 |
| pick up | `pick-up-rise.webp` | Mudanceros levantando muebles (recoger) | CC BY 2.0 |
| put off | `put-off-pause.webp` | Calendario de pared (posponer la reunión) | CC BY-SA 2.0 |

## Implementation plan

1. Buscar candidatas literales por `HintId` en Openverse (filtro de licencias comerciales BY/BY-SA/CC0/PDM) y descargar la URL directa. Verificación: revisión visual de cada candidata contra `meaningEs` y su ejemplo (se descartaron 3: bandera con texto, teclado enterrado, panorama sin personas).
2. Convertir a WebP (~640 px, ≤120 KB) en `public/hints/<hint-id>.webp` con los recortes indicados y reescribir `photos.ts` con dimensiones y créditos. Verificación: `photos.test.ts` (archivo existente, presupuesto, cobertura 20/20).
3. Actualizar `Flashcard.test.tsx` (nuevo crédito, fallback con expresión no curada). Verificación: `vitest run` en verde.
4. Corrida global `npm run lint && npm run typecheck && npm run test && npm run build`. Verificación: todo en verde sin `.env` ni requests de red.

## Acceptance criteria

- [x] Las 20 fotos muestran el significado de forma literal y obvia (persona/objeto/acción del ejemplo, no metáfora paisajística).
- [x] `look after` tiene foto; ningún curado queda en fallback SVG.
- [x] Ninguna foto supera 120 KB; el `alt` sigue genérico y el crédito solo lleva autor/licencia.
- [x] Antes de pulsar "Ver pista", el DOM no contiene foto, crédito ni respuestas.
- [x] `npm run lint && npm run typecheck && npm run test && npm run build` en verde.

## Decisions

- **Yes:** criterio literal/obvio en lugar de metafórico. Pedido del usuario: las metáforas no resaltaban la pista.
- **Yes:** mantener los mismos nombres de archivo. El `HintId` no cambia, así que no se toca `curated.ts` ni `gallery.tsx`.
- **Yes:** se permite texto incidental en escena (cartel "Cancelled", nota de la llave) cuando es la pista misma; se recortó el rótulo agregado y la marca de agua que no aportaban.
- **Yes:** completar `look-after-orbit` en este lote. Con criterio literal ("cuidar a mi perro") la curaduría pendiente se resolvió con una niña paseando a su perro.
- **No:** hotlinking, URLs remotas, GIF/video o APIs con key (igual que SPEC 15).

## Risks

| Risk | Mitigation |
| ---- | ---------- |
| La foto tan literal spoilea demasiado | Es lo pedido; la pista sigue optativa y colapsada, la invariante Ver → recordar se preserva |
| El texto en escena distrae | Solo se aceptó cuando es parte de la pista; rótulo agregado y watermark recortados |
| El crédito visible filtra la respuesta | Solo autor y licencia; el alt y el caption nunca llevan el significado |
| Una candidata titular engaña (bandera/texto, teclado) | Revisión visual obligatoria por foto antes de vendorizar |

## What is **not** in this spec

- Las ~580 fotos restantes (specs de seguimiento por sección).
- URLs remotas, hotlinking, GIF/video/Lottie o APIs con key.
- Cambios en `data/*.md`, `Card`, `WordFamily`, parsers o `resolveHint`.
- Persistencia de `showHint`, atajo de teclado o pistas progresivas.
