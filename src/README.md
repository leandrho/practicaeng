# src — Arquitectura hexagonal (MVP)

Capas:

- `domain/` — Entidades y reglas puras. No importa de `application`, `infrastructure` ni `app`.
- `application/` — Casos de uso. Solo puede importar de `domain`.
- `infrastructure/` — Adaptadores (lectura de `data/*.md` en build time, etc.). Puede importar de `domain` y `application`.
- `app/` (Next.js App Router, fuera de `src/`) — UI y rutas. Puede importar de `application`, `domain` e `infrastructure`.

## Regla de imports

Solo hacia adentro:

```text
app → application → domain ← infrastructure
```

- `domain` nunca importa `application` / `infrastructure` / `app`.
- `application` nunca importa `infrastructure` / `app`.
- Todo contenido externo (`data/*.md`) se valida con Zod en el borde (SPEC 02/03) antes de entrar al dominio.

Los barrels `index.ts` de cada capa existen vacíos (`export {}`) para que los imports no rompan mientras se implementan SPEC 02–08.
