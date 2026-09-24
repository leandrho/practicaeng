# SPEC 31 — Práctica de Presente con gap-fill + Reveal (infra de tiempos verbales)

> **Status:** Implementado
> **Depends on:** SPEC 20, SPEC 21, SPEC 22, SPEC 28
> **Date:** 2026-09-24
> **Objective:** Agregar la sección Presente de práctica de tiempos verbales con 50 o más ejercicios combinados de gap-fill y Reveal, con pista de contexto estilo libro y sin fotos, sobre la infraestructura compartida del grupo Grammar practice y las rutas `/verb-tenses/*`.

## Why this spec exists

Grammar B1+ ya cubre los presentes con teoría y cinco ejercicios por tema. Lo que falta es volumen de práctica pura: una sección sin teoría donde el estudiante complete y produzca oraciones en todos los presentes. Esta spec crea además el modelo, el parser, el loader y el cliente de práctica que reutilizan las tres secciones siguientes. Por eso el reparto por forma y el formato combinado se fijan acá una sola vez.

## Scope

**In:**

- Tercer grupo `Grammar practice` en el inicio, con tarjeta `Presente` que lleva a `/verb-tenses/present` y muestra el contador de ejercicios.
- Ruta `/verb-tenses/present` con práctica solo de ejercicios, sin bloques de Regla, Definición, Usos ni Contrastes.
- Archivo nuevo `data/verb-tenses-present.md` con 50 o más ejercicios y reparto mínimo por forma: `Present Simple` 10 o más, `Present Progressive` 10 o más, `Present Perfect Simple` 10 o más, `Present Perfect Progressive` 10 o más, `Mixed` 10 o más.
- Cada ejercicio combina gap-fill con corrección y producción con Reveal en una sola tarjeta: consigna en inglés, oración con un único hueco `____`, campo de respuesta con Check, botón cyan de contexto estilo libro, y Reveal con modelo, explicación y traducción.
- `src/domain/verb-tenses.ts` con esquemas Zod, `src/infrastructure/verb-tenses-parser.ts` y `src/infrastructure/verb-tenses-loader.ts` con validación estricta y errores que identifican archivo, línea y campo.
- `app/components/VerbTensesPracticeClient.tsx` reutilizable por las secciones futuras, con estilos en `app/globals.css`, navegación Previous/Next, contador y reset de estado al cambiar de tarjeta.
- Pista de contexto estilo libro por ejercicio: fragmento de 2 a 4 oraciones en inglés, clásico adaptado o mini-diálogo cotidiano, con fuente visible y sin español.
- Sin fotos: estas páginas no llevan botón ni panel de pista visual.
- Tests de dominio, parser, loader, cliente y página; documentación del formato en `README.md`.

**Out of scope (for future specs):**

- Secciones Pasado, Futuros y Condicionales, que van en las SPECs 32, 33 y 34 con el mismo formato y la misma infraestructura.
- Teoría de Regla, Definición, Usos o Contrastes en estas páginas.
- Fotos, pista visual, audio, TTS o resaltado sincronizado.
- Corrección gramatical libre, opción múltiple, puntuación, progreso guardado o persistencia.
- Inclusión en Mixed Practice, en filtros de vocabulario o en contadores de vocabulario del inicio.
- Datos en JSON, base de datos, usuarios o autenticación.

## Data model

```ts
type VerbTenseExercise = {
  form: "Present Simple" | "Present Progressive" | "Present Perfect Simple" | "Present Perfect Progressive" | "Mixed";
  promptEn: string; // consigna en inglés, no adelanta el modelo
  sentenceEn: string; // exactamente una aparición de ____
  acceptedAnswers: string[]; // al menos una, sin duplicados tras normalizar
  modelEn: string; // respuesta modelo completa en inglés
  explanationEs: string; // explicación en español, inglés en *cursiva simple*
  translationEs: string; // traducción del modelo al español
  contextEn: string; // 2 a 4 oraciones en inglés, sin español
  contextSource?: string; // clásico con autor o Everyday conversation
};

type VerbTenseSection = {
  slug: "present"; // las SPECs 32 a 34 agregan past, future, conditionals
  title: "Presente";
  exercises: VerbTenseExercise[]; // 50 o más, con los mínimos por forma
};
```

Formato en `data/verb-tenses-present.md`, un bullet por ejercicio en una sola línea con el separador literal ` --- `:

```md
## Presente
- **Form:** Present Simple --- **Prompt (EN):** Complete the routine: she / walk to school every day. --- **Sentence (EN):** She ____ to school every day. --- **Answers:** walks --- **Model (EN):** She walks to school every day. --- **Explanation (ES):** El *present simple* expresa hábitos y la tercera persona lleva -s. --- **Translation (ES):** Ella camina a la escuela todos los días. --- **Context (EN):** "Do you walk to school?" "Yes, I walk there every day with my brother." --- **Context source:** Everyday conversation
```

Convenciones:

- El encabezado `##` es el título de la sección y coincide con el catálogo en código.
- `Form` usa la lista cerrada de arriba; el parser rechaza cualquier otro valor.
- `Sentence (EN)` contiene exactamente una aparición de `____` y ningún otro grupo de guiones bajos; no usa ` --- ` dentro de la oración.
- `Answers` separa variantes con ` / `; cada respuesta debe sonar natural en esa oración concreta; si la oración admite más de una forma, se declaran todas, y si no se puede delimitar el conjunto, se cambia la oración.
- La corrección ignora mayúsculas y espacios extra, pero rechaza cualquier forma ajena a `Answers`.
- El prompt no adelanta el modelo literalmente y no repite modelos de otros ejercicios.
- `Context (EN)` nunca contiene español ni la traducción; no contiene `---`.
- `Context source` es opcional y usa `Everyday conversation` por defecto; cada cita de clásico lleva título y autor y queda registrada en `data/context-provenance.json`.

## Implementation plan

1. Crear `src/domain/verb-tenses.ts` con los esquemas Zod y el catálogo de la sección `present`, más tests de unicidad y mínimos por forma. Verificación: un ejercicio completo pasa y uno sin hueco o sin respuestas falla.
2. Crear `src/infrastructure/verb-tenses-parser.ts` con errores de archivo, línea y campo, más tests de formato, huecos, respuestas, formas inválidas y contexto ausente. Verificación: un fixture válido pasa y cada error conocido falla con ubicación.
3. Crear `src/infrastructure/verb-tenses-loader.ts` de solo servidor y test de carga desde fixtures. Verificación: devuelve la sección tipada sin exponer filesystem al cliente.
4. Curar `data/verb-tenses-present.md` con 50 o más ejercicios y los mínimos por forma, en tandas de 10 a 15 verificadas con el parser. Verificación: cada tanda carga y ningún prompt adelanta su modelo.
5. Agregar el grupo `Grammar practice` y la tarjeta `Presente` en `app/page.tsx`, sin tocar los contadores de vocabulario ni Mixed Practice. Verificación: la tarjeta navega a `/verb-tenses/present` y muestra el conteo de ejercicios.
6. Crear `app/verb-tenses/present/page.tsx` con generación estática y `not-found` para slugs inexistentes, más `app/components/VerbTensesPracticeClient.tsx` con gap-fill, Check, contexto libro, Reveal, Previous/Next, contador y reset al navegar. Verificación: recorrido manual de una tarjeta completa.
7. Sumar estilos en `app/globals.css` para gap-fill, Check, contexto y Reveal, coherentes con el inicio y adaptados a móvil, claro y oscuro y teclado. Verificación: pasada manual en ambos temas y viewport chico.
8. Agregar tests de página, cliente y carga real; documentar el formato en `README.md`. Verificación: `npm run lint && npm run typecheck && npm run test && npm run build` en verde.

## Acceptance criteria

- [x] El inicio muestra el grupo `Grammar practice` con la tarjeta `Presente`, su contador de ejercicios y enlace a `/verb-tenses/present`.
- [x] `/verb-tenses/present` presenta 50 o más ejercicios con los mínimos por forma: 10 Simple, 10 Progressive, 10 Perfect Simple, 10 Perfect Progressive y 10 Mixed.
- [x] Cada tarjeta muestra antes de responder la consigna en inglés y la oración con hueco, sin modelo, explicación ni traducción en el DOM.
- [x] Check acepta todas las respuestas declaradas con normalización de mayúsculas y espacios, y rechaza formas ajenas a `Answers`.
- [x] El botón cyan muestra y oculta el contexto estilo libro, con fuente visible, sin español y sin romper el gap-fill ni el Reveal.
- [x] Reveal muestra modelo, explicación y traducción; al cambiar de tarjeta la respuesta vuelve a ocultarse y el input se vacía.
- [x] No existe botón ni panel de pista visual en estas páginas.
- [x] Un ejercicio sin hueco único, sin respuestas, con forma inválida o sin contexto hace fallar el build con archivo, línea y campo.
- [x] Grammar B1+, Mixed Practice, filtros y contadores de vocabulario no incorporan estos ejercicios.
- [x] `npm run lint && npm run typecheck && npm run test && npm run build` termina sin errores.

## Decisions

- **Yes:** cuatro specs separadas, una por sección. El volumen editorial de 200 o más ejercicios no es revisable en un solo cambio; esta SPEC 31 fija formato e infraestructura y las SPECs 32 a 34 la reutilizan.
- **Yes:** cada ejercicio combina gap-fill con Check y Reveal con modelo. El gap-fill comprueba la forma y el Reveal conserva el flujo Ver → recordar → producir → revelar → comparar.
- **Yes:** archivos nuevos `data/verb-tenses-*.md`. Se descarta ampliar `data/grammar-part-*.md` porque estas secciones son solo práctica y tienen formato propio.
- **Yes:** contexto estilo libro de SPEC 20 y SPEC 21 en cada ejercicio. Se descarta la pista breve sin fuente porque pierde el control editorial de procedencia.
- **Yes:** sin fotos ni pista visual. Decisión del usuario: la imagen no aporta en tiempos verbales.
- **Yes:** solo práctica, sin teoría. Quien necesite la regla la encuentra en Grammar B1+.
- **Yes:** reparto mínimo por forma en vez de solo total. Sin mínimos, una sección podría titularse completa y practicar una sola forma.
- **No:** incluir Pasado, Futuros o Condicionales acá. Van en las SPECs 32, 33 y 34.
- Listas acordadas para esas specs futuras, sin efecto en esta: Pasado replica el esquema del Presente; Futuros cubre will, going to, progresivo de arreglo, simple de horario, future progressive, future perfect, about to y due to, más mixtos; Condicionales cubre zero, 1, 2 y 3, más mixtos.

## Risks

| Risk | Mitigation |
| --- | --- |
| Una oración admite más de una forma natural | Declarar todas las respuestas válidas o cambiar la oración, con el criterio de SPEC 28. |
| El prompt adelanta el modelo y anula el recall | Revisión editorial ejercicio por ejercicio; el prompt da la situación, nunca la forma. |
| El contexto filtra español o la traducción | Revisión no-spoiler por texto antes de cada tanda; veto a palabras del dorso en español. |
| Las respuestas aceptadas viajan al cliente para el Check | Aceptado como en SPEC 28; modelo, explicación y traducción siguen ocultos hasta Reveal. |
| El volumen de 50 ejercicios deja huecos de calidad | Curaduría en tandas de 10 a 15 con parser y revisión en cada tanda. |

## What is **not** in this spec

- Pasado, Futuros y Condicionales. Van en las SPECs 32, 33 y 34.
- Teoría, fotos, audio, opción múltiple, progreso o persistencia.
- Grammar B1+ en Mixed Practice, filtros o métricas de vocabulario.
- Fuente de contenido distinta de `data/*.md`.
