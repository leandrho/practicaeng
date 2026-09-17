# SPEC 09 — Polish y cierre del MVP

> **Status:** Draft
> **Depends on:** SPEC 01, SPEC 02, SPEC 03, SPEC 04, SPEC 05, SPEC 06, SPEC 07, SPEC 08
> **Date:** 2026-09-17
> **Objective:** Cerrar el MVP estático con metadatos, errores controlados, accesibilidad mínima y checklist Done verificada.

## Scope

**In:**

- Metadatos ES en `app/layout.tsx` (title/description/lang="es"), 404 (`app/not-found.tsx`) y `error.tsx` por sección con mensaje en español rioplatense.
- Contenido roto → fallo de build legible (surfacing de `ParseError` archivo+línea) o, si rompe en runtime, tarjeta de error controlada; verificación manual rompiendo una tarjeta en rama temporal (no se commitea).
- Accesibilidad mínima: landmarks, foco visible, contraste AA en botones Reveal/Comprobar, `aria-live` ya puesto en 06/07 se audita acá.
- `README.md`: sección "Cómo editar `data/`" (formatos bullet y tabla, `---`, headers como categoría) sin tocar código.
- Checklist Done: `lint + typecheck + test + build` en verde + `next build` sin `.env`.

**Out of scope (for future specs):**

- Cualquier feature: progreso, SRS, stats, favoritos, random/daily, multiple-choice, EN↔ES, JSON, Prisma/Postgres/JWT/Docker (backlog, una spec cada uno).

## Data model

This feature introduces no new data structures.

## Implementation plan

1. Metadatos + `not-found.tsx` + `error.tsx` por sección. Verificación: visitar `/nope` muestra 404 ES.
2. Test de contenido roto: romper 1 tarjeta en rama temporal → build falla con archivo+línea; revertir. Verificación: mensaje accionable confirmado.
3. Auditoría a11y (tab completo home → sección → Reveal → Siguiente solo con teclado; contraste de botones). Verificación: checklist manual pasada.
4. `README.md` con guía de edición de `data/` (ejemplo bullet + fila tabla + qué no tocar). Verificación: un tercero edita una tarjeta siguiendo solo el README y el build pasa.
5. Corrida final `lint + typecheck + test + build` sin `.env` + marcar specs 01–08 como `Implemented` al fusionar.

## Acceptance criteria

- [ ] `/nope` muestra 404 en español, no stacktrace.
- [ ] Error en un Server Component de sección muestra `error.tsx` en español con botón reintentar.
- [ ] Contenido `.md` roto hace fallar el build con archivo y línea (verificado en rama temporal, revertido).
- [ ] Flujo completo solo con teclado: home → sección → Reveal → Siguiente → filtros.
- [ ] Botones Reveal/Comprobar cumplen contraste AA (medido, valores anotados en el PR).
- [ ] `README.md` explica ambos formatos `.md` con ejemplo copiable.
- [ ] `env -i` + build pasa sin `.env` ni red ni DB.
- [ ] `npm run lint && npm run typecheck && npm run test && npm run build` en verde.

## Decisions

- **Yes:** la guía de `data/` vive en `README.md`, no en Notion externa. El contenido lo edita cualquiera sin tocar código.
- **Yes:** 404/error en español rioplatense. Consistente con el copy del producto.
- **No:** i18n multi-idioma. La UI es ES fija en el MVP.
- **No:** telemetry/analytics. Nada que medir hasta tener usuarios con persistencia.

## What is **not** in this spec

- Features nuevas de ningún tipo. Si algo falta, va al backlog como spec nueva, no se cuela acá.
- Prisma/Postgres/JWT/Docker/migración JSON: backlog post-MVP en este orden sugerido: `10-json-migration` → `11-prisma-postgres` → `12-jwt-users` → `13-progress-srs` → `14-stats-favorites` → `15-practice-modes`.
