# SPEC 15 — Fotos reales locales en las pistas

> **Status:** Implementado
> **Depends on:** SPEC 14
> **Date:** 2026-09-18
> **Objective:** Las pistas curadas muestran una foto real local (WebP en `public/hints/`) en lugar del SVG abstracto, manteniendo el botón optativo, la invariante de no-spoiler y el build estático offline.

## Scope

**In:**

- `public/hints/*.webp`: 19 fotos vendorizadas (una por cada `HintId` curado salvo `look-after-orbit`), ancho máx. ~640 px, tope 120 KB por archivo, formato WebP.
- `src/infrastructure/hints/photos.ts` (nuevo): registro `Partial<Record<HintId, PhotoEntry>>` con `src`, dimensiones y crédito (`author`, `license`, `source` con la página de origen). Es la única fuente que ata foto a pista.
- `src/infrastructure/hints/gallery.tsx`: si el `HintId` tiene entrada en `photos.ts`, renderiza la foto con `next/image` (`loading="lazy"`, contenedor con aspect-ratio fijo); si no, renderiza el SVG actual sin cambios.
- Micro-crédito visible bajo la foto (`Foto: <autor> / <licencia>`, texto atenuado). No contiene `meaningEs / exampleEn / translationEs`, así que no viola la invariante.
- `resolveHint`, `curated.ts`, `Card`, parsers y `data/*.md` no se tocan. `look-after-orbit` sigue resolviendo al fallback SVG hasta su curaduría.
- Estilos en `app/globals.css` para `.visual-hint__photo` (mismo marco y acento por sección que el SVG).
- Tests: `src/infrastructure/hints/photos.test.ts` nuevo (toda entrada del registro tiene archivo existente dentro del presupuesto; todo `HintId` curado salvo `look-after-orbit` tiene foto) + extensión de `Flashcard.test.tsx` y `WordFormationClient.test.tsx` (foto ausente pre-pista, presente post-pista con alt genérico, re-ocultar, reset al navegar).

**Out of scope (for future specs):**

- Las ~580 fotos restantes (una spec de seguimiento por sección: collocations, prepositions, idioms, word-formation, resto de phrasals).
- Curaduría de `look-after-orbit` (queda en fallback SVG; su concepto "cuidar" falló 4 búsquedas: batatas, fuente, feria con texto, ilustración vintage).
- URLs remotas o hotlinking, GIF/video/Lottie, APIs con key, traducción o generación en tiempo de ejecución.
- Persistir `showHint`, atajo de teclado para la pista, pistas progresivas o analytics (igual que SPEC 14).
- Cambios en `data/*.md`, `Card`, `WordFamily`, parsers o `resolveHint`.

## Data model

```ts
// src/infrastructure/hints/photos.ts
type PhotoCredit = {
  author: string; // ej. "Artotem"
  license: string; // ej. "CC BY 2.0"
  source: string; // landing page de la foto (atribución verificable)
};
type PhotoEntry = {
  src: `/hints/${string}.webp`;
  width: number;
  height: number;
  credit: PhotoCredit;
};
const hintPhotos: Partial<Record<HintId, PhotoEntry>> = {
  /* 19 entradas; "look-after-orbit" ausente a propósito → fallback SVG */
};
```

Convenciones:

- El nombre de archivo es el `HintId` (`give-up-flag.webp`). Sin entrada en el registro, `gallery.tsx` usa el SVG.
- El `alt` de la foto es siempre genérico ("Pista visual"); el crédito visible lleva autor y licencia, nunca el significado.
- Ninguna foto contiene texto legible ni la respuesta literal (regla aprendida en curaduría: se descartó una feria con cartel "ORGANIC VEGETABLES").

Fotos curadas (concepto metafórico, licencia de uso comercial verificada vía Openverse):

| Expresión | Archivo | Concepto | Licencia |
|---|---|---|---|
| ask around | `ask-around-ripples.webp` | Gota macro / onda que se expande | CC BY 2.0 |
| back up | `back-up-layers.webp` | Cairn de piedras (apoyo) | CC BY 2.0 |
| break down | `break-down-split.webp` | Tierra agrietada | CC BY-SA 2.0 |
| bring back | `bring-back-orbit.webp` | Amanecer sobre el campo (la luz vuelve) | CC BY-SA 2.0 |
| call off | `call-off-cross.webp` | Teatro vacío (evento cancelado) | CC BY 2.0 |
| carry on | `carry-on-path.webp` | Sendero entre colinas | CC0 |
| catch up | `catch-up-steps.webp` | Línea de llegada en pista | Dominio público |
| check in | `check-in-gate.webp` | Ala de avión al amanecer | CC BY 2.0 |
| cheer up | `cheer-up-sun.webp` | Sol entre nubes sobre el lago | CC BY-SA 4.0 |
| give up | `give-up-flag.webp` | Calle empinada (la cuesta antes de rendirse) | CC BY 2.0 |
| get along | `get-along-bridge.webp` | Ponte Vecchio sobre el Arno (conexión) | CC BY 2.0 |
| get away | `get-away-horizon.webp` | Ruta vacía al horizonte | CC BY 2.0 |
| get back | `get-back-loop.webp` | Escalera espiral desde arriba (bucle) | CC BY 2.0 |
| get over | `get-over-arch.webp` | Sendero de montaña (superar el paso) | CC BY 2.0 |
| look after | — (fallback SVG) | Curaduría pendiente | — |
| look for | `look-for-beacon.webp` | Faro (buscar a lo lejos) | CC BY-SA 2.0 |
| look forward to | `look-forward-arrow.webp` | Globos aerostáticos (ilusión que se eleva) | CC0 |
| make up | `make-up-join.webp` | Confluencia de dos ríos (unión) | CC BY-SA 2.0 |
| pick up | `pick-up-rise.webp` | Avión de papel (levantar vuelo) | CC BY 2.0 |
| put off | `put-off-pause.webp` | Reloj de arena (el tiempo se escurre) | CC BY 2.0 |

## Implementation plan

1. Descargar las 19 fuentes con la licencia ya verificada, convertir a WebP (~640 px, ≤120 KB) en `public/hints/<hint-id>.webp` y crear `photos.ts` con `src`, dimensiones y crédito. Verificación: `photos.test.ts` confirma archivo existente y presupuesto por entrada.
2. Agregar la rama foto a `gallery.tsx` (`next/image` lazy + micro-crédito + alt genérico) con fallback SVG intacto cuando no hay entrada. Verificación: click en "Ver pista" muestra la foto en una tarjeta curada y el SVG en `look after`.
3. Agregar estilos `.visual-hint__photo` en `app/globals.css` (marco, acento por sección, aspect-ratio anti-CLS, ambos temas). Verificación: render claro/oscuro sin flash ni salto de layout.
4. Extender `Flashcard.test.tsx` y `WordFormationClient.test.tsx` (ausencia pre-pista, presencia post-pista, re-ocultar, reset al navegar, alt sin texto de respuesta). Verificación: `vitest run` en verde.
5. Corrida global `npm run lint && npm run typecheck && npm run test && npm run build`. Verificación: todo en verde sin `.env` ni requests de red.

## Acceptance criteria

- [x] Antes de pulsar "Ver pista", el DOM del frente no contiene la foto, el micro-crédito ni `meaningEs / exampleEn / translationEs`.
- [x] Pulsar "Ver pista" en una tarjeta curada muestra su foto WebP con alt genérico y micro-crédito de autor/licencia; segundo click la oculta.
- [x] `look after` muestra el fallback SVG sin romper el layout.
- [x] Cambiar de tarjeta/familia resetea la pista a oculta.
- [x] Ninguna de las 19 fotos supera 120 KB ni contiene texto legible o la respuesta literal.
- [x] `npm run lint && npm run typecheck && npm run test && npm run build` en verde.

## Decisions

- **Yes:** fotos locales vendorizadas en `public/hints/`. Preserva el build estático offline y evita API keys, en línea con SPEC 14.
- **Yes:** Openverse como buscador de fuentes (API anónima, devuelve licencia + URL directa + página de origen). Sin cuentas ni secretos en el repo.
- **Yes:** micro-crédito visible. Las licencias BY/BY-SA lo exigen; autor y licencia no filtran la respuesta.
- **Yes:** `Partial<Record<...>>` con fallback SVG. Cobertura total desde el día uno y `look after` diferido sin romper nada.
- **Yes:** lote 1 = 19 curadas; resto en specs por sección. Un PR con 600 fotos sería irrevisable y sumaría 30+ MB a git de una vez.
- **No:** hotlinking a Flickr/Wikimedia. Frágil, con red obligatoria y sin control de peso.
- **No:** verificar solo por metadata. Dos candidatas se descartaron al verlas (batatas, feria con texto); la revisión visual es parte de la curaduría.
- **No:** tocar `data/*.md`, `Card`, parsers ni `resolveHint`. La foto es presentación, igual que el SVG.

## Risks

| Risk | Mitigation |
| ---- | ---------- |
| La foto literal spoilea el significado | Concepto metafórico + revisión visual contra `meaningEs` antes de vendorizar |
| El crédito visible filtra la respuesta | Solo autor y licencia; el alt y el caption nunca llevan el significado |
| Una foto con texto legible distrae o filtra | Regla explícita: sin texto legible; verificación visual por foto |
| El peso del repo crece sin control | Tope 120 KB/foto testeado + specs por sección en lugar de un solo lote gigante |
| La fuente remota muere antes de vendorizar | Las URLs directas están en el historial de curaduría; si una cae se re-cura ese `HintId` |

## What is **not** in this spec

- Las ~580 fotos restantes (specs de seguimiento por sección).
- Curaduría de `look-after-orbit`.
- URLs remotas, hotlinking, GIF/video/Lottie o APIs con key.
- Cambios en `data/*.md`, `Card`, `WordFamily`, parsers o `resolveHint`.
- Persistencia de `showHint`, atajo de teclado o pistas progresivas.
