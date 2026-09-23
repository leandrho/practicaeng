# SPEC 22 — Grammar B1+ por partes, temas y práctica guiada

> **Status:** Implementado
> **Depends on:** SPEC 01, SPEC 02, SPEC 06, SPEC 08, SPEC 10, SPEC 12
> **Date:** 2026-09-23
> **Objective:** Agregar Grammar B1+ al inicio con un índice de ocho partes y 26 temas, cada uno con teoría bilingüe y al menos cinco flashcards de producción guiada.

## Scope

**In:**

- Tarjeta `Grammar B1+` en `/` con el mismo patrón visual que las secciones existentes; lleva a `/grammar`.
- Índice `/grammar` con ocho grupos titulados `Parte 1` a `Parte 8` y tarjetas clicables por tema, en el orden editorial indicado abajo.
- Página propia `/grammar/parte-N/[topic]` por cada uno de los 26 temas, con enlace de regreso al índice, teoría visible antes de la práctica y tarjetas navegables en orden editorial.
- Teoría por tema en español: regla y forma, usos, contrastes o errores típicos, y al menos dos ejemplos en inglés con traducción al español.
- Al menos cinco tarjetas por tema: frente con contexto y consigna en inglés que pide construir una oración mentalmente o en voz alta; `Reveal` muestra respuesta modelo en inglés, explicación en español y traducción al español. Botones Previous/Next y contador, sin respuesta ni explicación de esa tarjeta en el DOM antes de revelar.
- Ocho fuentes `data/grammar-part-1.md` a `data/grammar-part-8.md`; parsing y validación estricta con Zod y errores que identifican archivo, tema y línea/campo. Contenido editable sin modificar UI.
- Estilos coherentes con el inicio y la práctica actuales, adaptados a móvil, claro/oscuro y teclado; pruebas del parser, las rutas y el comportamiento de Reveal.

**Out of scope (for future specs):**

- Grammar en Mixed Practice, filtros de vocabulario o contador/barra de distribución de tarjetas de vocabulario del inicio.
- Respuestas escritas, corrección automática, puntuación, progreso guardado y ejercicios de opción múltiple.
- Rutas de detalle para las partes; las ocho partes agrupan temas solo en `/grammar`.
- Datos en JSON, base de datos, usuarios o autenticación.
- Cambiar las tarjetas y el contenido de vocabulario existente.

## Data model

Un bullet de la lista original equivale a un tema. El catálogo de navegación tiene estos títulos y slugs, en este orden:

| Parte | Título | Slug |
| --- | --- | --- |
| 1 | Present Simple / Present Progressive | `present-simple-present-progressive` |
| 1 | Stative verbs | `stative-verbs` |
| 1 | Comparisons | `comparisons` |
| 1 | Countable and uncountable nouns | `countable-and-uncountable-nouns` |
| 2 | Past Simple / Past Progressive | `past-simple-past-progressive` |
| 2 | Past Perfect Simple / Past Perfect Progressive | `past-perfect-simple-past-perfect-progressive` |
| 2 | Used to / would / was-were going to | `used-to-would-was-were-going-to` |
| 3 | Present Perfect Simple / Present Perfect Progressive | `present-perfect-simple-present-perfect-progressive` |
| 3 | Defining and Non-Defining Relative Clauses | `defining-and-non-defining-relative-clauses` |
| 3 | Should / ought to / had better | `should-ought-to-had-better` |
| 4 | Future tenses | `future-tenses` |
| 4 | Other future forms | `other-future-forms` |
| 4 | Time clauses | `time-clauses` |
| 4 | Conditional Sentences: Types Zero, 1 and 2 | `conditional-sentences-types-zero-1-and-2` |
| 4 | Must / have to / need | `must-have-to-need` |
| 5 | Infinitives and the -ing form | `infinitives-and-the-ing-form` |
| 5 | Expressing possibility: may / might / would | `expressing-possibility-may-might-would` |
| 5 | Making deductions: must / can’t | `making-deductions-must-cant` |
| 5 | Question tags | `question-tags` |
| 6 | Passive Voice | `passive-voice` |
| 6 | Clauses of concession | `clauses-of-concession` |
| 7 | Reported Speech: statements, special introductory verbs, questions, commands and requests | `reported-speech-statements-special-introductory-verbs-questions-commands-and-requests` |
| 7 | Clauses of result | `clauses-of-result` |
| 8 | Unreal past | `unreal-past` |
| 8 | Conditional Sentences: Type 3 | `conditional-sentences-type-3` |
| 8 | Causative Form | `causative-form` |

`src/domain/grammar.ts` define esquemas Zod y tipos equivalentes a:

```ts
type GrammarExercise = {
  promptEn: string; // contexto + consigna, sin solución
  modelEn: string;
  explanationEs: string;
  translationEs: string;
};

type GrammarTopic = {
  part: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  slug: string;
  title: string;
  ruleEs: string;
  usesEs: string;
  contrastsEs: string;
  examples: { exampleEn: string; translationEs: string }[]; // mínimo 2
  exercises: GrammarExercise[]; // mínimo 5
};
```

`src/domain/grammar-catalog.ts` contiene la lista fija de partes, títulos y slugs de la tabla; los Markdown contienen el contenido educativo, no cadenas de teoría ni soluciones en código. `src/infrastructure/grammar-parser.ts` interpreta cada archivo y `src/infrastructure/grammar-loader.ts` lo lee exclusivamente del servidor. Formato fijo por tema (se repite dentro del archivo de su parte):

```md
## Present Simple / Present Progressive
### Regla y forma
Texto en español.
### Usos
Texto en español.
### Contrastes y errores
Texto en español.
### Ejemplos
- **EN:** She works from home. --- **ES:** Ella trabaja desde casa.
- **EN:** She is working now. --- **ES:** Ella está trabajando ahora.
### Ejercicios
- **Prompt (EN):** Describe a habit: she / work from home. --- **Model (EN):** She works from home. --- **Explanation (ES):** El present simple expresa hábitos. --- **Translation (ES):** Ella trabaja desde casa.
```

El encabezado `##` debe coincidir con uno de los títulos de su parte. Cada sección obligatoria tiene contenido no vacío, hay al menos dos ejemplos y cinco ejercicios completos por tema. El parser rechaza temas duplicados, faltantes, desconocidos o en otra parte, y reporta archivo y línea; el catálogo mantiene el orden aun si se reordenan bloques por error (se rechaza el desorden al validar). Los campos de la respuesta solo se renderizan después de Reveal; la teoría sí es visible de entrada.

## Implementation plan

1. Crear `src/domain/grammar-catalog.ts` con las ocho partes y los 26 títulos/slugs; añadir comprobaciones de unicidad y orden. Verificación: el catálogo contiene 26 slugs únicos y las cantidades 4/3/3/5/4/2/2/3.
2. Crear `src/domain/grammar.ts` y `src/infrastructure/grammar-parser.ts`, con fixtures y tests de secciones obligatorias, mínimos, duplicados y errores con ubicación. Verificación: un tema completo pasa y un tema incompleto falla con archivo, línea y campo.
3. Crear `src/infrastructure/grammar-loader.ts` para leer los ocho Markdown del servidor y validar el catálogo completo cuando se consulta; probar lectura desde un directorio de fixtures completo. Verificación: las lecturas devuelven temas tipados en orden, sin exponer filesystem al cliente.
4. Crear `data/grammar-part-1.md`: los cuatro temas de la Parte 1, cada uno con teoría completa y cinco o más ejercicios. Verificación editorial: revisar cada tema con el parser y comprobar ejemplos y modelos naturales.
5. Crear `data/grammar-part-2.md`: los tres temas de la Parte 2 con la misma cobertura y verificación.
6. Crear `data/grammar-part-3.md`: los tres temas de la Parte 3 con la misma cobertura y verificación.
7. Crear `data/grammar-part-4.md`: los cinco temas de la Parte 4 con la misma cobertura y verificación.
8. Crear `data/grammar-part-5.md`: los cuatro temas de la Parte 5 con la misma cobertura y verificación.
9. Crear `data/grammar-part-6.md`: los dos temas de la Parte 6 con la misma cobertura y verificación.
10. Crear `data/grammar-part-7.md`: los dos temas de la Parte 7 con la misma cobertura y verificación.
11. Crear `data/grammar-part-8.md`: los tres temas de la Parte 8 con la misma cobertura y verificación; comprobar conjunto completo de 26 temas y mínimo 130 ejercicios.
12. Agregar la tarjeta `Grammar B1+` a `app/page.tsx` y la ruta índice `app/grammar/page.tsx`, con ocho grupos y enlaces por tema; sumar estilos de índice en `app/globals.css`. Verificación: cada tarjeta navega a su URL y los contadores de vocabulario del inicio siguen contando solo vocabulario.
13. Crear `app/grammar/[part]/[topic]/page.tsx`: validar parte y slug del catálogo, generar rutas estáticas, cargar teoría y ejercicios, mostrar enlace de vuelta y resolver rutas inválidas con not-found. Verificación: los 26 enlaces abren su tema y una URL inexistente devuelve 404.
14. Crear `app/components/GrammarPracticeClient.tsx` y estilos de teoría/práctica en `app/globals.css`: orden editorial, Reveal, contador, Previous/Next, reset de revelado al navegar y accesibilidad de teclado. Verificación: antes de Reveal no está el modelo en el DOM; al revelar aparece la respuesta completa y al cambiar de tarjeta vuelve a ocultarse.
15. Agregar tests de página/índice, carga real y práctica; documentar el formato en `README.md`. Verificación: `npm run lint && npm run typecheck && npm run test && npm run build` en verde.

Los pasos de contenido 4–11 se ejecutan tema por tema: cada tema es una unidad editorial verificable y no se cablea la ruta pública hasta que estén completos los ocho archivos.

## Acceptance criteria

- [ ] El inicio enlaza a `/grammar`; `/grammar` muestra exactamente ocho partes y 26 tarjetas de tema con los títulos y orden de la tabla.
- [ ] Cada tarjeta abre una URL `/grammar/parte-N/[topic]` estable y válida; partes o slugs inexistentes devuelven 404.
- [ ] Cada uno de los 26 temas presenta regla y forma, usos, contrastes o errores, y dos o más ejemplos EN/ES antes de la práctica.
- [ ] Cada tema incluye cinco o más tarjetas completas: al menos 130 en total.
- [ ] Antes de Reveal se muestra una consigna de producción en inglés y no se renderizan modelo, explicación ni traducción de esa tarjeta; Reveal los muestra solo después del intento.
- [ ] Previous/Next conservan el orden editorial, muestran posición/total y ocultan la respuesta al cambiar de tarjeta.
- [ ] Si falta un tema, un bloque teórico, un ejemplo o un campo de ejercicio, el parser/build falla identificando archivo, tema y línea/campo.
- [ ] El índice y las páginas se pueden usar con teclado y en móvil, en temas claro y oscuro.
- [ ] Mixed Practice, filtros existentes y estadísticas de vocabulario del inicio no incorporan tarjetas de gramática.
- [ ] `npm run lint && npm run typecheck && npm run test && npm run build` termina sin errores.

## Decisions

- **Yes:** ocho grupos en un índice único y URL por tema. Se eligió frente a una página intermedia por parte.
- **Yes:** un bullet original = un tema. Se descartó separar tiempos verbales y subcasos en páginas adicionales.
- **Yes:** teoría extensa visible antes de practicar, con componentes mínimos comunes. Se eligió frente a teoría plegada u otra ruta.
- **Yes:** consigna y navegación en inglés; teoría, explicación y traducción en español. Los ejemplos y modelos son en inglés.
- **Yes:** producción mental o en voz alta con Reveal manual. Se descartó escribir respuestas o evaluarlas automáticamente.
- **Yes:** mínimo de cinco tarjetas por tema y orden editorial. Se descartó una sola tarjeta y la mezcla aleatoria.
- **Yes:** ocho Markdown validados y catálogo de títulos/slugs en código. Mantiene el contenido educativo editable en `data/*.md` y evita slugs inestables al corregir textos.
- **No:** integrar Grammar B1+ en Mixed Practice o en filtros de vocabulario. Son flujos de estudio distintos.

## Risks

| Risk | Mitigation |
| --- | --- |
| Teoría visible reduce el desafío de una tarjeta si contiene su solución literal | Ejemplos teóricos distintos de los modelos de ejercicio; ninguna respuesta del ejercicio se renderiza antes de Reveal. |
| El volumen editorial (26 teorías y al menos 130 ejercicios) deja huecos o ejemplos ambiguos | Validación estricta de estructura más revisión tema por tema de reglas, modelos y traducciones. |
| Cambiar un título rompe enlaces compartidos | Slugs fijos en catálogo, independientes del encabezado renderizado; enlaces generados desde el catálogo. |

## What is **not** in this spec

- Gramática en Mixed Practice, filtros o métricas de vocabulario.
- Corrección automática, campos de respuesta, seguimiento del progreso o persistencia.
- Páginas independientes para cada parte o cada subcaso gramatical.
- Fuente de contenido distinta de `data/*.md`.
