# SPEC 01 — Foundation scaffold estático

> **Status:** Implementado
> **Depends on:** (ninguna)
> **Date:** 2026-09-17
> **Objective:** Crear el scaffold Next.js 16 + TS strict + Tailwind + ESLint/Prettier + Vitest con layout hexagonal vacío y build estático en verde.

## Scope

**In:**

- Scaffold Next.js 16 (App Router, TypeScript strict) con Tailwind y home placeholder estática en español.
- Estructura hexagonal vacía: `src/domain/`, `src/application/`, `src/infrastructure/` con barrel `index.ts` por capa y regla de imports documentada en `src/README.md`.
- Calidad estricta: scripts `lint` (ESLint), `typecheck` (`tsc --noEmit`), `test` (`vitest run`), `build`; 1 test smoke.
- Config estática: rutas pre-renderizadas en build, sin rutas dinámicas, sin `cookies()/headers()`, sin secrets, sin Prisma/JWT/Docker.

**Out of scope (for future specs):**

- Modelo de dominio y schemas Zod (SPEC 02).
- Parser/loader de `data/*.md` (SPEC 03, 04). `data/` no se toca.
- Casos de uso, UI flashcards, filtros, word-formation, gap-fill (SPEC 05–08).
- Prisma/Postgres/JWT/Docker/migración JSON (backlog post-MVP).

## Data model

This feature introduces no new data structures. Solo directorios vacíos con barrels (`export {}`) para que los imports no rompan.

Convenciones fijadas acá, válidas para todo el MVP:

- Imports solo hacia adentro: `app → application → domain ← infrastructure`. `domain` nunca importa `application/infrastructure/app`.
- Todo contenido externo se valida con Zod en el borde (se implementa en SPEC 02/03).

## Implementation plan

1. Crear app Next.js 16 + TS + Tailwind: `package.json`, `tsconfig.json` strict (`strict: true`, `noUncheckedIndexedAccess: true`), `app/layout.tsx` (metadatos ES), `app/page.tsx` placeholder. Verificación: `npm run dev` levanta, `/` responde 200.
2. Crear `src/domain/index.ts`, `src/application/index.ts`, `src/infrastructure/index.ts` + `src/README.md` con la regla de imports. Verificación: `tsc --noEmit` en verde.
3. Agregar ESLint (config flat Next) + Prettier + scripts `lint`, `typecheck`. Verificación: `npm run lint && npm run typecheck` en verde.
4. Agregar Vitest (`vitest.config.ts`, `src/smoke.test.ts` con 1 assert) + script `test`. Verificación: `npm run test` en verde.
5. Endurecer estático: sin `cookies()/headers()/export const dynamic`, sin dependencias `prisma/@prisma/*`/`jsonwebtoken`; `npm run build` en env limpio sin `.env`. Verificación: build en verde.

## Acceptance criteria

- [x] `npm run lint` pasa sin errores ni warnings.
- [x] `npm run typecheck` pasa.
- [x] `npm run test` pasa (≥1 test smoke).
- [x] `npm run build` pasa sin variables de entorno ni acceso a DB/red.
- [x] Buscar `cookies()|headers()|prisma|jsonwebtoken` en `src` y `app` no devuelve archivos.
- [x] Existen `src/domain`, `src/application`, `src/infrastructure` con `index.ts` cada una.
- [x] `/` renderiza placeholder en español con una clase Tailwind visible en el DOM.

## Decisions

- **Yes:** Tailwind. Estándar de Next, evita CSS ad-hoc desde el día 1.
- **Yes:** calidad estricta desde 01. El costo se paga una vez, cada spec hereda el gate.
- **Yes:** estático estricto. `data/*.md` se lee en build time (SPEC 03/04), nunca en runtime.
- **No:** renombrar `data/*-b1-b2.md`. El loader mapea nombres reales en SPEC 03.
- **No:** Prisma/JWT/Docker en MVP. SPEC 02/05 dejan puertos para enchufarlos sin reescribir dominio.

## Risks

| Risk | Mitigation |
| ---- | ---------- |
| Next.js 16 cambia flags de `create-next-app` / setup Tailwind | Consultar Context7 MCP durante la implementación, no asumir flags de memoria |
| `noUncheckedIndexedAccess` rompe código copiado de tutoriales | Accesos con guards desde 01, queda como estándar |

## What is **not** in this spec

- Schemas Zod, parsers, casos de uso, flashcards, filtros, gap-fill.
- Lectura o edición de `data/`.
- DB, usuarios, auth, persistencia, analytics.
