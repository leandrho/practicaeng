# SPEC 11 — Filtros en sidebar lateral + drawer en mobile

> **Status:** Implementado
> **Depends on:** SPEC 08, SPEC 10
> **Date:** 2026-09-17
> **Objective:** Filtros ocultos por defecto en un drawer superpuesto con botón en el header, en todos los viewports, sin cambiar la lógica de filtrado. (Pasos 1–4 iteraron un sidebar desktop; el paso 7 lo reemplazó por drawer único.)

## Scope

**In:**

- Layout de una columna en `app/[section]/page.tsx` y `app/word-formation/page.tsx`, con la tarjeta centrada en ambos ejes (`min-height` de viewport + `align-content: center`, scroll normal si excede).
- `FilterDrawerProvider` (isla Client en `app/layout.tsx`): botón "Filtros" en el header solo cuando hay filtros registrados + drawer superpuesto con overlay en todos los viewports, reutilizando `FiltersContent`.
- `RegisterPracticeFilters` por página de práctica (registra `cards/filter/pathname` en el contexto, limpia al desmontar).
- Estilos en `app/globals.css`: overlay + panel + breakpoint eliminados del sidebar, `prefers-reduced-motion` intacto.
- Accesibilidad del drawer: `aria-expanded` / `aria-controls`, cierre con `Esc`, click en overlay y botón cerrar, foco visible, retorno de foco al botón.
- Tests de render + interacción del drawer (abrir/cerrar/Esc, botón ausente en home) y preservación de la lógica URL existente.

**Out of scope (for future specs):**

- Cambios en `domain/`, `application/filterCards`, parsers o `data/*.md`.
- Multi-select, búsqueda full-text, orden aleatorio, paginación.
- Hamburgesa global en el header o cambios en el home (`app/page.tsx` queda igual).
- Persistencia de filtros, progreso, favoritos, SRS, stats.

## Data model

This feature introduces no new data structures. Reusa `Filter` y `Filterable` de SPEC 05/08. La URL sigue siendo la fuente de verdad:

```ts
// ?level=B1-B2&category=MAKE → { level: "B1-B2", category: "MAKE" }
```

Lo único nuevo es estado local UI del drawer (no persiste, no va a la URL):

```ts
// app/components/FiltersDrawer.tsx (Client island)
type DrawerState = { open: boolean };
// open vive en useState, inicia en false, nunca se serializa.
```

Convenciones: `Filters` sigue siendo Server y la única vía visual de `filterCards`; el drawer solo muestra/oculta ese mismo contenido.

## Implementation plan

1. Estilos del layout en `app/globals.css`: `.practice-layout` con grid `16.5rem 1fr` en `>=56rem`, drawer + overlay ocultos en desktop y visibles en `<56rem`, corte seco con `prefers-reduced-motion`. Verificación: inspección visual desktop/mobile, `npm run build` pasa.
2. Extraer el contenido actual de `app/components/Filters.tsx` a `FiltersContent` (Server, misma lógica de `createFilterHref`, chips desde datos reales, "Limpiar filtros") sin cambiar hrefs ni copy. Verificación: `Filters.test.tsx` existente sigue en verde.
3. Crear `app/components/FiltersDrawer.tsx` (Client): botón "Filtros" + `dialog` lateral + overlay + cierre por X/Esc/overlay/click en chip. `aria-expanded` y `aria-controls` cableados, foco al drawer al abrir y retorno al botón al cerrar. Verificación: test jsdom abrir → visible, `Esc` → cerrado, click en chip → llama a cerrar.
4. Cablear `app/[section]/page.tsx` y `app/word-formation/page.tsx` al layout: `<div class="practice-layout">` con `<aside>` (desktop) + `<FiltersDrawer>` (mobile) + contenido actual (`Flashcard` / `WordFormationClient`). `key` por filtro y `clearFiltersPath` intactos. Verificación: `?category=MAKE` filtra, `?category=NOPE` muestra estado vacío exacto.
5. Auditoría final: recorrido solo-teclado, ambos temas, contraste AA intacto, `npm run lint && npm run typecheck && npm run test && npm run build` en verde.
6. (Enmienda review) Centrado vertical: `.practice-layout__content` con `min-height` de viewport + `align-content: center`; horizontal intacto en la columna; scroll normal si el contenido excede. Verificación: tarjeta al medio con contenido corto, scroll normal con contenido largo, cadena verde.
7. (Enmienda review) Drawer global: `FilterDrawerProvider` en `app/layout.tsx` con botón en el header (solo en práctica), `RegisterPracticeFilters` por página; se elimina el sidebar y el drawer in-page. Verificación: home sin botón, práctica con botón, abrir/cerrar/Esc/chip testeados, cadena verde.

## Acceptance criteria

- [x] En desktop (`>=56rem`) los filtros se veían como sidebar a la izquierda (verificado en pasos 1–4; reemplazado por el paso 7: sin sidebar, drawer global).
- [x] En mobile (`<56rem`) los filtros estaban tras un botón "Filtros" sobre la tarjeta (verificado en pasos 1–4; reemplazado por el paso 7: botón único en el header).
- [x] El drawer se cierra con botón cerrar, click en overlay y tecla `Esc`.
- [x] Clickear un chip dentro del drawer navega a la URL filtrada y cierra el drawer.
- [x] `?category=MAKE` en collocations muestra solo tarjetas `MAKE`.
- [x] URL copiada en otra pestaña restaura el mismo filtro.
- [x] `?category=NOPE` muestra "No hay tarjetas con estos filtros." + botón limpiar (no crash).
- [x] Limpiar filtros vuelve a `?` sin params y muestra todo.
- [x] `Anterior/Siguiente` no pierden el filtro activo.
- [x] Agregar una categoría nueva en `data/` la muestra en el drawer sin tocar código.
- [x] Botón "Filtros" expone `aria-expanded` correcto y el foco vuelve al botón al cerrar el drawer.
- [x] Con `prefers-reduced-motion` el drawer abre/cierra sin animación.
- [x] Flujo completo solo con teclado en ambos temas, copy en español rioplatense intacto.
- [x] Con contenido corto, la tarjeta y el estado vacío quedan centrados horizontal y verticalmente en la pantalla; con contenido largo, la página scrollea normal.
- [x] Centro horizontal a pantalla completa (verificado como columna en el paso 6; tras el paso 7 no hay sidebar que montar).
- [x] El sidebar lateral no existe: en todos los viewports los filtros viven en un drawer superpuesto, oculto al entrar.
- [x] El header muestra el botón "Filtros" solo en páginas de práctica; en el home no aparece.
- [x] `npm run lint && npm run typecheck && npm run test && npm run build` en verde.

## Decisions

- **Yes:** solo páginas de práctica (`[section]` + `word-formation`). Home queda igual para no mezclar navegación de secciones con filtros de sesión.
- **Yes:** sidebar izquierda sticky (~16.5rem). Patrón estándar de lectura LTR, deja la tarjeta a la derecha con el acento por sección intacto.
- **Yes:** botón "Filtros" + drawer dedicado en mobile en vez de hamburguesa global. La hamburguesa global mezcla navegación del sitio con filtros de la vista; el botón contextual es más descubrible y no toca `app/layout.tsx`.
- **Yes:** el drawer cierra al navegar (click en chip). Evita un drawer tapando la tarjeta recién filtrada; combinar nivel + categoría se hace reabriendo, que es el caso menos frecuente.
- **Yes:** `Filters` sigue Server, drawer es isla Client mínima. Preserva build estático y no duplica la lógica de `createFilterHref`.
- **Yes:** breakpoint `56rem` (~896px). Coincide con el ancho donde `44rem` de tarjeta + `16.5rem` de sidebar + gaps ya no entran cómodos.
- **No:** hamburguesa en el header. Va en otra spec si se quiere navegación global mobile; acá solo filtros.
- **Yes:** (enmienda review) centrado en ambos ejes con scroll normal. `min-height` de viewport + `align-content: center`: centra cuando sobra espacio, crece y scrollea cuando falta.
- **Yes:** (enmienda review) centro horizontal en la columna de contenido. Centrar en el viewport completo montaría la tarjeta sobre el sidebar en desktop.
- **Yes:** (enmienda review) drawer superpuesto único en todos los viewports con botón en el header. Una sola UX, sin sidebar que empuje; al estar oculto la tarjeta queda centrada a pantalla completa.
- **Yes:** (enmienda review) siempre oculto al entrar, sin persistencia. Simple y predecible; el registro por página resetea el estado al navegar.
- **Yes:** (enmienda review) botón en el header vía contexto (`FilterDrawerProvider` + `RegisterPracticeFilters`). El header es server y no conoce la página; el contexto evita romper el build estático (sin `headers()` ni fetch).
- **No:** (enmienda review) tarjeta fija (`position: fixed`) al scrollear. Invasivo y rompe el flujo de lectura; el centrado es en flujo.
- **No:** tocar `filterCards`, parsers, `data/` ni el texto del estado vacío. Es cambio puramente visual.
- **No:** multi-select ni búsqueda. Tentador "ya que estamos", pero es otra spec.

## Risks

| Risk | Mitigación |
| ---- | ---------- |
| Drawer Client rompe el build estático | Isla mínima solo en el drawer; `FiltersContent` sigue Server; `next build` verificado en cada paso |
| Foco atrapado o perdido al abrir/cerrar | Foco al drawer al abrir, retorno al botón al cerrar, `Esc` y overlay siempre disponibles; test jsdom + recorrido manual con teclado |
| Click en chip navega sin cerrar (carrera Server/Client) | `onClick` cierra el estado local antes de la navegación; la navegación Server re-monta con drawer cerrado por defecto |
| Overlay rompe contraste en oscuro | Overlay neutro semitransparente sobre `--bg`, drawer usa `--surface`; contraste AA re-medido en ambos temas |
| Animación del drawer marea | `prefers-reduced-motion` → apertura/cierre instantáneos, sin slide/fade |

## What is **not** in this spec

- Hamburgesa global en el header ni cambios en el home.
- Cambios en lógica de filtrado, parsers, `data/`, persistencia, progreso, favoritos, SRS, stats.
- Multi-select, búsqueda full-text, orden aleatorio, paginación.
- Si algo de eso falta, va en su propia spec, no se cuela acá.
