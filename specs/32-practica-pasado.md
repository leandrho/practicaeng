# SPEC 32 — Práctica de Pasado con gap-fill + Reveal

> **Status:** Implementado
> **Depends on:** SPEC 31
> **Date:** 2026-09-24
> **Objective:** Agregar la sección Pasado de práctica de tiempos verbales con 50 o más ejercicios combinados de gap-fill y Reveal, con pista de contexto estilo libro y sin fotos, reutilizando la infraestructura de la SPEC 31.

## Why this spec exists

La SPEC 31 fijó el formato combinado y la infraestructura compartida con la sección Presente. Esta spec suma la segunda sección del grupo Grammar practice sin crear formato ni componentes nuevos: solo contenido, catálogo y ruta.

## Scope

**In:**

- Tarjeta `Pasado` en el grupo `Grammar practice` del inicio, con contador de ejercicios y enlace a `/verb-tenses/past`.
- Ruta `/verb-tenses/past` con práctica solo de ejercicios, sin teoría, reutilizando `VerbTensesPracticeClient`.
- Archivo nuevo `data/verb-tenses-past.md` con 50 o más ejercicios y reparto mínimo por forma: `Past Simple` 10 o más, `Past Progressive` 10 o más, `Past Perfect Simple` 10 o más, `Past Perfect Progressive` 10 o más, `Mixed` 10 o más.
- Extensión de `src/domain/verb-tenses.ts` con el slug `past`, el título `Pasado` y la unión de formas del pasado; extensión de la lista cerrada de `Form` en el parser y el loader.
- Mismo formato combinado de la SPEC 31: consigna en inglés, oración con un único hueco `____`, Check con respuestas cerradas, contexto estilo libro con fuente, y Reveal con modelo, explicación y traducción.
- Tests de parser, loader, cliente y página para la sección; documentación del reparto en `README.md`.

**Out of scope (for future specs):**

- Secciones Futuros y Condicionales, que van en las SPECs 33 y 34.
- Formas como used to, would o was-were going to, que quedan en Grammar B1+.
- Teoría, fotos, audio, opción múltiple, progreso, persistencia o Mixed Practice.
- Cambios al formato combinado o a la infraestructura de la SPEC 31.

## Data model

Reutiliza `VerbTenseExercise` de la SPEC 31 con esta unión de `form`:

```ts
form: "Past Simple" | "Past Progressive" | "Past Perfect Simple" | "Past Perfect Progressive" | "Mixed";
```

Formato en `data/verb-tenses-past.md`, un bullet por ejercicio con el separador literal ` --- `:

```md
## Pasado
- **Form:** Past Simple --- **Prompt (EN):** Complete the finished action: I / visit my grandmother yesterday. --- **Sentence (EN):** I ____ my grandmother yesterday. --- **Answers:** visited --- **Model (EN):** I visited my grandmother yesterday. --- **Explanation (ES):** El *past simple* expresa acciones terminadas con referencia pasada. --- **Translation (ES):** Ayer visité a mi abuela. --- **Context (EN):** "Did you see your grandmother?" "Yes, I visited her yesterday afternoon." --- **Context source:** Everyday conversation
```

Valen las mismas convenciones de la SPEC 31: un único `____`, respuestas con ` / `, prompt que no adelanta el modelo, contexto en inglés sin español y fuente por defecto `Everyday conversation`.

## Implementation plan

1. Extender `src/domain/verb-tenses.ts`, el parser y el loader con el slug `past` y las formas del pasado, más tests. Verificación: un fixture del pasado carga y una forma ajena falla con archivo, línea y campo.
2. Curar `data/verb-tenses-past.md` con 50 o más ejercicios y los mínimos por forma, en tandas de 10 a 15 verificadas con el parser. Verificación: cada tanda carga y ningún prompt adelanta su modelo.
3. Agregar la tarjeta `Pasado` y la ruta `app/verb-tenses/past/page.tsx` reutilizando el cliente y los estilos existentes. Verificación: la tarjeta navega, el contador coincide y el recorrido gap-fill, contexto y Reveal funciona.
4. Agregar tests de página y carga real; documentar el reparto en `README.md`. Verificación: `npm run lint && npm run typecheck && npm run test && npm run build` en verde.

## Acceptance criteria

- [x] El grupo `Grammar practice` muestra la tarjeta `Pasado` con su contador y enlace a `/verb-tenses/past`.
- [x] `/verb-tenses/past` presenta 50 o más ejercicios con los mínimos por forma: 10 Simple, 10 Progressive, 10 Perfect Simple, 10 Perfect Progressive y 10 Mixed.
- [x] Antes de responder no hay modelo, explicación ni traducción en el DOM; Check acepta las respuestas declaradas y rechaza las ajenas.
- [x] El botón cyan muestra y oculta el contexto estilo libro con fuente visible y sin español.
- [x] Reveal muestra modelo, explicación y traducción; al cambiar de tarjeta la respuesta se oculta y el input se vacía.
- [x] No existe botón ni panel de pista visual en esta página.
- [x] Un ejercicio con forma inválida, sin hueco único, sin respuestas o sin contexto falla con archivo, línea y campo.
- [x] `npm run lint && npm run typecheck && npm run test && npm run build` termina sin errores.

## Decisions

- **Yes:** replicar el esquema del Presente con las cuatro formas del pasado más mixtos. Mantiene simetría pedagógica entre ambas secciones.
- **Yes:** reutilizar formato, parser, loader, cliente y estilos de la SPEC 31 sin cambios. Contenido nuevo sobre infraestructura existente.
- **No:** incluir used to, would ni was-were going to. Quedan en Grammar B1+ y su ausencia no bloquea el contraste central simple, progresivo y perfecto.
- **No:** tocar Futuros o Condicionales. Van en las SPECs 33 y 34.

## Risks

| Risk | Mitigation |
| --- | --- |
| El past perfect y el past simple compiten en la misma oración | Declarar todas las respuestas válidas o cambiar la oración para fijar la anterioridad. |
| El progress interrupted admite simple y progressive | Elegir el foco del prompt: acción en curso o evento que interrumpe. |

## What is **not** in this spec

- Futuros y Condicionales. Van en las SPECs 33 y 34.
- Teoría, fotos, audio, opción múltiple, progreso o persistencia.
- Cambios al formato combinado de la SPEC 31.
