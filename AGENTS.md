# AGENTS.md

> Pre-scaffold repo: `README.md` is the only product spec. No `package.json`, no source code, no git, no CI/lint/test config yet. Do not assume any toolchain exists — check before running commands.

## MVP constraint (do not violate)

- MVP uses **only `data/*.md`** as content source. **No DB, no users, no auth.**
- Full stack in README (Next.js 16, Prisma, Postgres, JWT, Docker) is a future target — do not scaffold Prisma/Postgres/JWT for the MVP.
- Stack for MVP: Next.js 16 + TypeScript + Zod. Hexagonal layout: `domain / application / infrastructure`.

## Content source

- `data/` is currently **empty**. Expected files per README: `phrasal-verbs.md`, `collocations.md`, `prepositions.md`, `idioms.md`, `word-formations.md`.
- Content stays decoupled from UI so it can be edited without touching logic. Future migration path is Markdown → JSON with shape `{ expression, type, level, meaning, example, translation, category }` (see README "Posible evolución").
- Sections: Phrasal Verbs, Collocations, Prepositions, Idioms & Expressions, Word Formation. Levels B1/B2/C1.

## Core UX invariant

- Flashcard flow is active recall, in this order: **Ver → recordar → producir → revelar → comparar → repetir**.
- Card front shows expression + prompt to recall meaning and invent an example; back reveals meaning + example + translation. "Reveal" must never show the answer upfront. UI copy is Spanish (rioplatense: "Pensá").

## Spec-driven workflow

- Skills live in `.agents/skills/`: `spec` (design), `spec-impl` (implement), `context7-mcp` (library docs).
- No `specs/` folder yet — `/spec` creates it as `specs/NN-slug.md` with states `Draft / In review / Approved / Implemented / Obsolete`.
- `/spec-impl` runs **only** on `Approved` specs, on branch `spec-NN-slug`. Never auto-commit; implement one plan step at a time and pause for diff review. Never expand scope beyond the spec — deferred items go in a new spec.

## Docs

- `opencode.json` wires Context7 MCP — use it for Next.js/Prisma/Zod API questions instead of guessing from training data.
