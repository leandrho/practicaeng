# SPEC 10 — Rediseño moderno de la interfaz (claro + oscuro)

> **Status:** Implementado
> **Depends on:** SPEC 01, SPEC 06, SPEC 07, SPEC 08, SPEC 09
> **Date:** 2026-09-17
> **Objective:** Rediseñar toda la interfaz con un sistema visual moderno en tema claro y oscuro sin cambiar lógica, contenido ni el flujo de active recall.

## Scope

**In:**

- Sistema de tokens en CSS variables (`--bg`, `--surface`, `--text`, `--muted`, `--accent-*` por sección, `--radius`, `--shadow`) + Tailwind existente, sin reescribir dominio/aplicación.
- Primitivas Radix (slot/dialog/tooltip según se necesite) + Tailwind para estilos; tipografía vía `next/font` (una familia moderna legible + fallback de sistema).
- Home: hero compacto + grid de 5 secciones con color por sección, conteos y barra de progreso de sesión (`x/y`).
- Flashcard (4 secciones bullet) y word-formation: mismo flujo e invariantes, con nueva tarjeta (flip/fade expresivo, frente/dorso, botones `Reveal`/`Anterior`/`Siguiente`).
- Filtros (`Filters` con chips desde datos reales + "Limpiar filtros") y estado vacío con el texto exacto actual, rediseñados visualmente sin cambiar su lógica.
- `ThemeToggle`: respeta `prefers-color-scheme` + toggle manual guardado en `localStorage` + script inline mínimo anti-flash en `app/layout.tsx`.
- `not-found.tsx` y `error.tsx` por sección con el nuevo sistema visual, manteniendo el copy en español rioplatense.
- Accesibilidad: foco visible, teclado `←/→/Espacio`, `aria-live="polite"` intactos, contraste AA medido en ambos temas, `prefers-reduced-motion` degradando a corte seco.
- Guías aplicadas: `frontend-design`, `web-design-guidelines`, `vercel-react-best-practices` (islas Client mínimas, sin romper build estático).

**Out of scope (for future specs):**

- Cambios en `domain/`, `application/`, parsers o `data/*.md`; nuevos modos de práctica, progreso persistente, SRS, stats, favoritos, random/daily, multiple-choice, EN↔ES.
- Migración JSON, Prisma/Postgres, JWT, Docker, i18n multi-idioma, telemetry.
- Ilustraciones custom, landing marketinera larga, búsqueda full-text, paginación.

## Data model

No hay nuevas estructuras de dominio. Reusa `Card`, `SessionState`, `Filter` de las SPECs 02/05. Lo único nuevo es estado UI de tema:

```ts
// infrastructure/ui/theme.ts
type Theme = "light" | "dark";
// localStorage key: "practicaeng:theme:v1" → Theme | "system"
// CSS: :root / [data-theme="dark"] definen --bg, --surface, --text, --muted, --accent-*
```

Convenciones: la URL sigue siendo fuente de verdad para filtros; el tema vive en `data-theme` sobre `<html>` y nunca en la URL.

## Implementation plan

1. Tokens + fuentes + script anti-flash en `app/layout.tsx` y `app/globals.css` (claro por defecto, `[data-theme="dark"]`). Verificación: build pasa, sin flash al recargar en oscuro.
2. `ThemeToggle` (auto del SO + toggle con persistencia `practicaeng:theme:v1`) + primitivas Radix base. Verificación: toggle cambia `data-theme`, persiste tras reload, respeta SO en primera visita.
3. Home: hero compacto + grid de 5 secciones (color por sección, conteos, links) + barra `x/y` de sesión. Verificación: render estático con 5 links y conteos correctos.
4. `Flashcard` rediseñada (flip/fade expresivo + fallback a corte con `prefers-reduced-motion`, frente sin respuesta en DOM, dorso + Anterior/Siguiente + teclado). Verificación: test DOM `queryByText(meaning)` es null antes de Reveal.
5. Word-formation + `Filters` + estado vacío + `not-found.tsx`/`error.tsx` con el nuevo sistema. Verificación: `?category=NOPE` muestra texto exacto + botón limpiar; `/nope` muestra 404 ES.
6. Auditoría final: contraste AA en ambos temas (valores anotados), recorrido solo-teclado, `lint + typecheck + test + build` sin `.env`, capturas claro/oscuro.

## Acceptance criteria

- [x] Home muestra hero + 5 secciones con conteos y links funcionales en ambos temas.
- [x] Antes de Reveal, el DOM no contiene `meaningEs` ni `exampleEn`.
- [x] Reveal muestra `meaningEs` + `exampleEn` con animación; con `prefers-reduced-motion` el cambio es instantáneo.
- [x] `Anterior`/`Siguiente` y `←/→/Espacio` funcionan sin perder el filtro activo.
- [x] Toggle de tema persiste tras reload y respeta al SO en primera visita, sin flash.
- [x] `?category=MAKE` filtra bien; `?category=NOPE` muestra estado vacío exacto + botón limpiar.
- [x] `/nope` muestra 404 en español; error en sección muestra `error.tsx` en español con reintentar.
- [x] Botones Reveal/Comprobar cumplen contraste AA en claro y oscuro (valores medidos).
- [x] Flujo completo solo con teclado en ambos temas.
- [x] Copy del frente incluye "Pensá"; resto del copy sigue en rioplatense.
- [x] `npm run lint && npm run typecheck && npm run test && npm run build` en verde sin `.env`.

## Decisions

- **Yes:** todas las vistas (home, tarjetas, word-formation, filtros, 404/error). Evita mezclar UI vieja y nueva.
- **Yes:** estilo limpio claro + oscuro (no solo claro, no playful). Moderno sin oscurecer por defecto; AA más fácil de sostener.
- **Yes:** Radix + Tailwind, no Framer Motion ni shadcn completo. Accesible y liviano, compatible con RSC y build estático.
- **Yes:** `next/font` con una familia + fallback sistema. Sin FOUT, funciona tras el build.
- **Yes:** tema auto (SO) + toggle guardado en `localStorage` (`practicaeng:theme:v1`). Compartible y persistente con script anti-flash mínimo.
- **Yes:** home con hero + cards + barra `x/y`. Da contexto y progreso de sesión sin inventar persistencia.
- **Yes:** animaciones expresivas con degradación a corte si hay `prefers-reduced-motion`. Efecto moderno sin excluir.
- **No:** tocar flujo Ver→recordar→producir→revelar→comparar→repetir, copy rioplatense ni invariante DOM. Es el corazón pedagógico.
- **No:** progreso/SRS/favoritos/stats en esta spec. Van al backlog como specs propias.

## Risks

| Risk | Mitigación |
| ---- | ---------- |
| Flash de tema incorrecto al cargar | Script inline mínimo que fija `data-theme` antes del paint; test manual en ambos temas |
| Contraste roto en oscuro | Paleta validada AA en ambos temas, valores anotados; no usar acento sobre fondo sin medir |
| Radix suma JS y rompe lo estático | Solo primitivas necesarias, islas Client mínimas; `next build` estático verificado en cada paso |
| Animación expresiva marea o rompe a11y | `prefers-reduced-motion` → corte seco; `aria-live` y foco intactos |
| Fuente web falla offline | `next/font` con fallback de sistema; layout legible sin la webfont |

## What is **not** in this spec

- Lógica de negocio, parsers, `data/`, persistencia de progreso, SRS, stats, favoritos.
- Prisma/Postgres/JWT/Docker, migración JSON, i18n, analytics.
- Si algo de eso falta, va en su propia spec, no se cuela acá.
