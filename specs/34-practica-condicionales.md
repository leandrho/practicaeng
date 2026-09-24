# SPEC 34 — Práctica de Condicionales con gap-fill + Reveal

> **Status:** Implementado
> **Depends on:** SPEC 31
> **Date:** 2026-09-24
> **Objective:** Agregar la sección Condicionales de práctica de tiempos verbales con 50 o más ejercicios combinados de gap-fill y Reveal, con pista de contexto estilo libro y sin fotos, reutilizando la infraestructura de la SPEC 31.

## Why this spec exists

Los cuatro condicionales se confunden entre sí más que cualquier otro bloque de tiempos verbales: el tipo depende de si la condición es real, hipotética o imposible. Esta spec fija un mínimo por tipo para que cada uno se practique aislado y en contraste, sin crear formato ni componentes nuevos.

## Scope

**In:**

- Tarjeta `Condicionales` en el grupo `Grammar practice` del inicio, con contador de ejercicios y enlace a `/verb-tenses/conditionals`.
- Ruta `/verb-tenses/conditionals` con práctica solo de ejercicios, sin teoría, reutilizando `VerbTensesPracticeClient`.
- Archivo nuevo `data/verb-tenses-conditionals.md` con 50 o más ejercicios y reparto mínimo por forma: `Conditional Zero` 10 o más, `Conditional Type 1` 10 o más, `Conditional Type 2` 10 o más, `Conditional Type 3` 10 o más, `Mixed` 10 o más.
- Extensión de `src/domain/verb-tenses.ts` con el slug `conditionals`, el título `Condicionales` y la unión de formas condicionales; extensión de la lista cerrada de `Form` en el parser y el loader.
- Mismo formato combinado de la SPEC 31: consigna en inglés, oración con un único hueco `____`, Check con respuestas cerradas, contexto estilo libro con fuente, y Reveal con modelo, explicación y traducción.
- En condicionales el hueco puede estar en la prótasis o en la apódosis; el resto de la oración fija el tipo y delimita las respuestas válidas.
- Tests de parser, loader, cliente y página para la sección; documentación del reparto en `README.md`.

**Out of scope:**

- Nuevas secciones de tiempos verbales fuera de las cuatro acordadas.
- Mixed conditionals como cubo propio; los casos mixtos van en `Mixed`.
- Wish, if only o unreal past como temas propios, que quedan en Grammar B1+.
- Teoría, fotos, audio, opción múltiple, progreso, persistencia o Mixed Practice.
- Cambios al formato combinado o a la infraestructura de la SPEC 31.

## Data model

Reutiliza `VerbTenseExercise` de la SPEC 31 con esta unión de `form`:

```ts
form: "Conditional Zero" | "Conditional Type 1" | "Conditional Type 2" | "Conditional Type 3" | "Mixed";
```

Formato en `data/verb-tenses-conditionals.md`, un bullet por ejercicio con el separador literal ` --- `:

```md
## Condicionales
- **Form:** Conditional Type 2 --- **Prompt (EN):** Imagine the opposite of now: If I / be you, I would accept. --- **Sentence (EN):** If I ____ you, I would accept. --- **Answers:** were --- **Model (EN):** If I were you, I would accept. --- **Explanation (ES):** El *second conditional* usa pasado simple en la condición para un presente hipotético. --- **Translation (ES):** Si yo fuera vos, aceptaría. --- **Context (EN):** "Should I accept the offer?" "If I were you, I would accept it today." --- **Context source:** Everyday conversation
```

Valen las mismas convenciones de la SPEC 31. Además: la mitad fija de la oración determina un único tipo salvo en `Mixed`; en `Mixed` el prompt describe la situación sin nombrar el tipo.

## Implementation plan

1. Extender `src/domain/verb-tenses.ts`, el parser y el loader con el slug `conditionals` y las formas condicionales, más tests. Verificación: un fixture de condicionales carga y una forma ajena falla con archivo, línea y campo.
2. Curar `data/verb-tenses-conditionals.md` con 50 o más ejercicios y los mínimos por tipo, en tandas de 10 a 15 verificadas con el parser. Verificación: cada tanda carga y ningún prompt adelanta su modelo.
3. Agregar la tarjeta `Condicionales` y la ruta `app/verb-tenses/conditionals/page.tsx` reutilizando el cliente y los estilos existentes. Verificación: la tarjeta navega, el contador coincide y el recorrido gap-fill, contexto y Reveal funciona.
4. Agregar tests de página y carga real; documentar el reparto en `README.md`. Verificación: `npm run lint && npm run typecheck && npm run test && npm run build` en verde.

## Acceptance criteria

- [x] El grupo `Grammar practice` muestra la tarjeta `Condicionales` con su contador y enlace a `/verb-tenses/conditionals`.
- [x] `/verb-tenses/conditionals` presenta 50 o más ejercicios con los mínimos por tipo: 10 Zero, 10 Type 1, 10 Type 2, 10 Type 3 y 10 Mixed.
- [x] Antes de responder no hay modelo, explicación ni traducción en el DOM; Check acepta las respuestas declaradas y rechaza las ajenas.
- [x] El botón cyan muestra y oculta el contexto estilo libro con fuente visible y sin español.
- [x] Reveal muestra modelo, explicación y traducción; al cambiar de tarjeta la respuesta se oculta y el input se vacía.
- [x] No existe botón ni panel de pista visual en esta página.
- [x] Un ejercicio con forma inválida, sin hueco único, sin respuestas o sin contexto falla con archivo, línea y campo.
- [x] `npm run lint && npm run typecheck && npm run test && npm run build` termina sin errores.

## Decisions

- **Yes:** 10 ejercicios mínimos por cada uno de los cuatro tipos más 10 mixtos. Cada tipo se domina aislado antes del contraste.
- **Yes:** los condicionales mixtos van en `Mixed` sin cubo propio. Son casos de contraste avanzado y no justifican un mínimo independiente.
- **Yes:** el hueco puede estar en cualquiera de las dos cláusulas. Practicar ambas posiciones evita que el estudiante solo complete apódosis.
- **No:** incluir wish, if only o unreal past. Quedan en Grammar B1+ y no entran en el reparto de 50.

## Risks

| Risk | Mitigation |
| --- | --- |
| Type 1 y Zero compiten cuando la condición es un hecho general | El prompt fija hecho general o futuro real; si ambas valen, se declaran las dos o se cambia la oración. |
| Was y were compiten en Type 2 | Declarar ambas si el registro las admite, o fijar el registro en el prompt. |

## What is **not** in this spec

- Quintas secciones, wish, if only o unreal past como temas propios.
- Teoría, fotos, audio, opción múltiple, progreso o persistencia.
- Cambios al formato combinado de la SPEC 31.
