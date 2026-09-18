# SPEC 14 — Pistas animadas SVG en el frente

> **Status:** Implementado
> **Depends on:** SPEC 02, SPEC 06, SPEC 07, SPEC 10, SPEC 13
> **Date:** 2026-09-18
> **Objective:** Agregar al frente de cada tarjeta un botón optativo "Ver pista" que muestra una animación SVG+CSS abstracta alusiva al significado sin revelar la respuesta en texto.

## Scope

**In:**

- `src/domain/hints.ts` (nuevo, lógica pura sin dependencias UI): `HintId`, `HintKind = curated | fallback`, función `resolveHint(expression, type, category) → HintId` con normalización (`lowercase, trim`); sin tocar `Card`, parsers de SPEC 03/04 ni `data/*.md`.
- `src/infrastructure/hints/` (nuevo): registro `curated.ts` (mapa expresión normalizada → `HintId`, 20–30 entradas iniciales) + componente `gallery.tsx` que renderiza el SVG animado por `HintId` + 5 fallbacks genéricos (uno por `phrasal-verb | collocation | preposition | idiom` + uno para base de word-formation); SVG inline + CSS en `app/globals.css`, sin fetch ni assets externos.
- `app/components/FlashcardClient.tsx`: botón secundario "Ver pista" en el frente, subordinado a Reveal; estado `showHint: boolean` local por tarjeta con reset al navegar (misma técnica `key={card.expression}` del frente/dorso); pista fuera del DOM hasta pulsar; región con `aria-live="polite"`, botón con `aria-pressed` y `aria-label` "Show visual hint" / "Hide visual hint"; segundo click oculta.
- `app/components/WordFormationClient.tsx`: mismo botón en el frente (antes de "Revelar familia"), resuelto por `family.base`; sin cambios en dorso ni gap-fill.
- Accesibilidad y motion: SVG decorativo con `aria-hidden`, texto alternativo genérico ("Pista visual animada") que nunca contiene `meaningEs / exampleEn / translationEs`; `prefers-reduced-motion` degrada a frame estático; ocultar equivale a pausar (sin animación corriendo oculta).
- Tests: `src/domain/hints.test.ts` (curada resuelve, desconocida → fallback, normalización case-insensitive) + extensión de `Flashcard.test.tsx` y `WordFormationClient.test.tsx` (ausencia pre-pista, presencia post-pista, re-ocultar, reset al navegar).

**Out of scope (for future specs):**

- GIF/API externa (Giphy/Tenor), video, Lottie, ilustraciones generadas por IA.
- Editar `data/*.md` para agregar campo `Hint:` o cambiar parsers.
- Persistir la preferencia de pista (localStorage o sesión).
- Atajo de teclado dedicado para la pista (Espacio ya es Reveal).
- Pistas progresivas por niveles (primera letra, traducción parcial) o analytics de uso.
- Cambios visuales fuera del botón y el contenedor de pista.

## Data model

```ts
// src/domain/hints.ts
type HintKind = "curated" | "fallback";
type HintId = string; // ej. "give-up-flag" o "fallback:idiom"
function resolveHint(expression: string, type: string, category: string): HintId;
```

Convenciones:

- La expresión se normaliza antes de buscar (`toLowerCase().trim()`).
- `curated.ts` es la única fuente curada; todo lo no mapeado cae al fallback de su `type`.
- La pista es presentación, no contenido: no entra a `Card` ni a `WordFamily`.

## Implementation plan

1. Crear `src/domain/hints.ts` con tipos, normalización y `resolveHint` contra un registro mínimo. Verificación: `vitest run hints` en verde.
2. Crear `src/infrastructure/hints/curated.ts` (8–10 curadas iniciales de phrasal verbs frecuentes) + `gallery.tsx` + 5 fallbacks SVG+CSS + tokens en `app/globals.css` con `prefers-reduced-motion`. Verificación: render claro/oscuro sin flash.
3. Cablear el botón "Ver pista" en el frente de `FlashcardClient.tsx` (fuera del DOM hasta pulsar, `aria-pressed`, reset por tarjeta). Verificación: click muestra/oculta manual.
4. Replicar el patrón en el frente de `WordFormationClient.tsx` resuelto por `family.base`. Verificación: click muestra/oculta manual.
5. Completar el registro hasta 20–30 curadas y extender `Flashcard.test.tsx`, `WordFormationClient.test.tsx` y `hints.test.ts`. Verificación: `vitest run` en verde.
6. Corrida global `npm run lint && npm run typecheck && npm run test && npm run build`. Verificación: todo en verde sin `.env` ni requests de red.

## Acceptance criteria

- [x] Antes de pulsar "Ver pista", el DOM del frente no contiene el SVG de la pista ni `meaningEs / exampleEn / translationEs`.
- [x] Pulsar "Ver pista" muestra la animación; pulsarlo de nuevo la oculta (`aria-pressed` refleja el estado).
- [x] Cambiar de tarjeta/familia resetea la pista a oculta.
- [x] Una expresión sin curada muestra el fallback de su `type` sin romper el layout.
- [x] Con `prefers-reduced-motion`, la pista se ve estática.
- [x] Recorrido solo-teclado: Tab alcanza el botón y Espacio sigue siendo Reveal sin colisión.
- [x] `npm run lint && npm run typecheck && npm run test && npm run build` en verde.

## Decisions

- **Yes:** SVG+CSS local hecho a mano. Offline, sin API keys, sin licencias, build estático intacto y compatible con el MVP (solo `data/*.md` como contenido).
- **No:** GIF externo (Giphy/Tenor). Más expresivo pero exige red, claves, licencias y rompe el build estático offline.
- **No:** emoji + CSS como única pista. Cero assets pero poco expresivo para phrasal verbs abstractos; queda como recurso dentro de los SVG si sirve.
- **Yes:** botón optativo colapsado por defecto en el frente. Preserva el invariante Ver → recordar → producir → revelar; una pista siempre visible spoilearía.
- **Yes:** subset curado (20–30) + fallback genérico por `type`. Cobertura total desde el día uno sin bloquearse en ilustrar 600+ tarjetas.
- **Yes:** incluye word-formation (frente por `family.base`). El usuario lo pidió; el costo extra es solo un fallback más y el mismo botón.
- **Yes:** pista abstracta/metafórica, nunca literal ni con texto de respuesta. Si la ilustración delata demasiado, se descarta en review.
- **No:** tocar `data/*.md`, `Card` o parsers. La pista es capa de presentación registrada en código.

## Risks

| Risk | Mitigation |
| ---- | ---------- |
| La ilustración literal spoilea el significado | Guía abstracta + review de cada curada contra su `meaningEs` |
| El estado `showHint` sobrevive al cambiar de tarjeta | Reset por `key` de tarjeta + test de reset (igual que SPEC 13) |
| Tests viejos esperan frente sin botón | Se actualizan a buscar Reveal + Ver pista como elementos separados |
| Scope se agranda (ilustrar todo) | Tope 20–30 curadas; el resto va en un spec nuevo |

## What is **not** in this spec

- GIF/video/Lottie o cualquier fetch externo.
- Cambios en `data/*.md`, parsers o schemas `Card` / `WordFamily`.
- Persistencia de la preferencia de pista.
- Atajo de teclado para la pista.
- Pistas progresivas por niveles o stats de uso.
