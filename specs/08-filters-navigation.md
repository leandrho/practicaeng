# SPEC 08 — Filtros por URL y navegación

> **Status:** Implementado
> **Depends on:** SPEC 05, SPEC 06, SPEC 07
> **Date:** 2026-09-17
> **Objective:** Filtrar tarjetas por `?level=` y `?category=` con URL copiable y estado vacío legible en ambas UIs.

## Scope

**In:**

- `searchParams` (`level`, `category`) en `app/[section]` y `app/word-formation` (word-formation filtra por `category` = letra inicial o "todas"; `level` hoy siempre `B1-B2` pero el filtro queda funcional para datos futuros).
- UI de filtros: chips/select con valores derivados de los datos reales (no hardcodeados salvo `level`), preservación del filtro al Anterior/Siguiente, reset visible ("Limpiar filtros").
- Estado vacío: "No hay tarjetas con estos filtros." + botón limpiar; nunca crash ni página en blanco.
- `filterCards` de SPEC 05 como única vía de filtrado (la UI no filtra a mano).

**Out of scope (for future specs):**

- Filtros por estado/progreso/favoritos (requieren persistencia, backlog).
- Búsqueda full-text (spec propia si se pide).
- Paginación (solo si el build de phrasal lo exige; se mediría en SPEC 06).

## Data model

This feature introduces no new data structures. Reusa `Filter` de SPEC 05. La URL es la fuente de verdad:

```ts
// ?level=B1-B2&category=MAKE → { level: "B1-B2", category: "MAKE" }
```

## Implementation plan

1. Leer `searchParams` en `app/[section]` y pasar `Filter` a `filterCards`. Verificación: `?category=DO` muestra solo DO.
2. Componente `Filters` (chips desde valores reales + limpiar) compartido por ambas rutas. Verificación: test de render con valores dados.
3. Estado vacío + preservar filtro al navegar sesión. Verificación: test + manual.
4. Verificación global `lint + typecheck + test + build`.

## Acceptance criteria

- [x] `?category=MAKE` en collocations muestra solo tarjetas `MAKE`.
- [x] URL copiada en otra pestaña restaura el mismo filtro.
- [x] `?category=NOPE` muestra estado vacío con texto exacto y botón limpiar (no crash).
- [x] Limpiar filtros vuelve a `?` sin params y muestra todo.
- [x] `Anterior/Siguiente` no pierden el filtro activo.
- [x] Valores del filtro salen de los datos (agregar una categoría nueva en `data/` la muestra sin tocar código).
- [x] `npm run lint && npm run typecheck && npm run test && npm run build` en verde.

## Decisions

- **Yes:** URL como fuente de verdad. Compartible, sin estado global ni persistencia.
- **Yes:** `level` funcional aunque hoy todo sea `B1-B2`. Cuando haya B1/B2/C1 por tarjeta, el filtro ya anda.
- **No:** filtros en `page.tsx` de `/` (índice). Solo en vistas de práctica.
- **No:** debounce/búsqueda. Fuera del MVP.

## What is **not** in this spec

- Progreso, favoritos, estados New/Learning/Known/Difficult.
- Búsqueda full-text, orden aleatorio persistente, paginación.
