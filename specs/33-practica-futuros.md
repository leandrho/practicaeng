# SPEC 33 — Práctica de Futuros con gap-fill + Reveal

> **Status:** Implementado
> **Depends on:** SPEC 31
> **Date:** 2026-09-24
> **Objective:** Agregar la sección Futuros de práctica de tiempos verbales con 50 o más ejercicios combinados de gap-fill y Reveal, con pista de contexto estilo libro y sin fotos, reutilizando la infraestructura de la SPEC 31.

## Why this spec exists

El futuro en inglés reparte el significado entre más formas que el presente y el pasado: will, going to, progresivo de arreglo, simple de horario, future progressive, future perfect y about to o due to. Esta spec fija el reparto mínimo por forma para que la práctica cubra cada perspectiva sin crear formato ni componentes nuevos.

## Scope

**In:**

- Tarjeta `Futuros` en el grupo `Grammar practice` del inicio, con contador de ejercicios y enlace a `/verb-tenses/future`.
- Ruta `/verb-tenses/future` con práctica solo de ejercicios, sin teoría, reutilizando `VerbTensesPracticeClient`.
- Archivo nuevo `data/verb-tenses-future.md` con 50 o más ejercicios y reparto mínimo por forma: `Will` 6 o más, `Be going to` 6 o más, `Present Progressive (future arrangement)` 6 o más, `Present Simple (timetable)` 6 o más, `Future Progressive` 6 o más, `Future Perfect Simple` 6 o más, `Be about to / Be due to` 6 o más, `Mixed` 8 o más.
- Extensión de `src/domain/verb-tenses.ts` con el slug `future`, el título `Futuros` y la unión de formas del futuro; extensión de la lista cerrada de `Form` en el parser y el loader.
- Mismo formato combinado de la SPEC 31: consigna en inglés, oración con un único hueco `____`, Check con respuestas cerradas, contexto estilo libro con fuente, y Reveal con modelo, explicación y traducción.
- Tests de parser, loader, cliente y página para la sección; documentación del reparto en `README.md`.

**Out of scope (for future specs):**

- Sección Condicionales, que va en la SPEC 34.
- Time clauses como tema propio, que quedan en Grammar B1+.
- Teoría, fotos, audio, opción múltiple, progreso, persistencia o Mixed Practice.
- Cambios al formato combinado o a la infraestructura de la SPEC 31.

## Data model

Reutiliza `VerbTenseExercise` de la SPEC 31 con esta unión de `form`:

```ts
form: "Will" | "Be going to" | "Present Progressive (future arrangement)" | "Present Simple (timetable)" | "Future Progressive" | "Future Perfect Simple" | "Be about to / Be due to" | "Mixed";
```

Formato en `data/verb-tenses-future.md`, un bullet por ejercicio con el separador literal ` --- `:

```md
## Futuros
- **Form:** Be going to --- **Prompt (EN):** State your prior plan: I / make soup tonight. --- **Sentence (EN):** I ____ make soup tonight. --- **Answers:** am going to --- **Model (EN):** I am going to make soup tonight. --- **Explanation (ES):** *Be going to* expresa una intención formada antes de hablar. --- **Translation (ES):** Voy a preparar sopa esta noche. --- **Context (EN):** "What is for dinner?" "I bought vegetables, so I am going to make soup tonight." --- **Context source:** Everyday conversation
```

Valen las mismas convenciones de la SPEC 31. Además: el progresivo de arreglo incluye referencia temporal futura en la oración; el simple de horario presenta un horario fijado por un tercero; about to y due to llevan verbo base sin -ing.

## Implementation plan

1. Extender `src/domain/verb-tenses.ts`, el parser y el loader con el slug `future` y las formas del futuro, más tests. Verificación: un fixture del futuro carga y una forma ajena falla con archivo, línea y campo.
2. Curar `data/verb-tenses-future.md` con 50 o más ejercicios y los mínimos por forma, en tandas de 10 a 15 verificadas con el parser. Verificación: cada tanda carga y ningún prompt adelanta su modelo.
3. Agregar la tarjeta `Futuros` y la ruta `app/verb-tenses/future/page.tsx` reutilizando el cliente y los estilos existentes. Verificación: la tarjeta navega, el contador coincide y el recorrido gap-fill, contexto y Reveal funciona.
4. Agregar tests de página y carga real; documentar el reparto en `README.md`. Verificación: `npm run lint && npm run typecheck && npm run test && npm run build` en verde.

## Acceptance criteria

- [x] El grupo `Grammar practice` muestra la tarjeta `Futuros` con su contador y enlace a `/verb-tenses/future`.
- [x] `/verb-tenses/future` presenta 50 o más ejercicios con los mínimos por forma: 6 Will, 6 Be going to, 6 progresivo de arreglo, 6 simple de horario, 6 Future Progressive, 6 Future Perfect Simple, 6 about to o due to, y 8 Mixed.
- [x] Antes de responder no hay modelo, explicación ni traducción en el DOM; Check acepta las respuestas declaradas y rechaza las ajenas.
- [x] El botón cyan muestra y oculta el contexto estilo libro con fuente visible y sin español.
- [x] Reveal muestra modelo, explicación y traducción; al cambiar de tarjeta la respuesta se oculta y el input se vacía.
- [x] No existe botón ni panel de pista visual en esta página.
- [x] Un ejercicio con forma inválida, sin hueco único, sin respuestas o sin contexto falla con archivo, línea y campo.
- [x] `npm run lint && npm run typecheck && npm run test && npm run build` termina sin errores.

## Decisions

- **Yes:** siete formas más mixtos con mínimos de 6 y 8. El futuro necesita más cubos que el presente, y el mínimo menor por cubo mantiene el total en 50.
- **Yes:** about to y due to comparten cubo. Ambas expresan inminencia o previsión con la misma estructura y no justifican 10 ejercicios cada una.
- **Yes:** el simple de horario y el progresivo de arreglo son cubos propios. Son el contraste que más errores produce y no pueden diluirse en mixtos.
- **No:** incluir time clauses como cubo. Quedan en Grammar B1+; acá solo aparecen como contexto dentro de oraciones futuras.
- **No:** tocar Condicionales. Van en la SPEC 34.

## Risks

| Risk | Mitigation |
| --- | --- |
| Will y going to compiten en la misma oración | El prompt fija decisión espontánea o intención previa; si ambas valen, se declaran las dos o se cambia la oración. |
| El progresivo de arreglo sin referencia temporal admite lectura de presente | Exigir marcador futuro en la oración del progresivo de arreglo. |

## What is **not** in this spec

- Condicionales. Van en la SPEC 34.
- Teoría, fotos, audio, opción múltiple, progreso o persistencia.
- Cambios al formato combinado de la SPEC 31.
