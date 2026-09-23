# SPEC 25 — Recuadro Definition en la teoría de Grammar

> **Status:** Implementado
> **Depends on:** SPEC 22, SPEC 23
> **Date:** 2026-09-23
> **Objective:** Agregar debajo de `Formation` un recuadro `Definition` con la definición bilingüe del tema (qué es y para qué sirve) en los 26 temas, sin solaparse con `When to use`.

## Scope

**In:**

- `src/domain/grammar.ts`: `GrammarTopic` suma `definitionEn` y `definitionEs` (`nonemptyText`), obligatorios al cierre del plan (paso 12).
- `src/infrastructure/grammar-parser.ts`: registra la sección `### Definición` en `HEADINGS`; se parsea con la misma lógica `prose()` que `Regla y forma` / `Usos` / `Contrastes y errores` (exactamente dos bullets `**EN:**` y `**ES:**`, en ese orden, no vacíos). Opcional mientras dure la migración (pasos 1–11), obligatoria en el paso 12, con error de archivo, línea, tema y sección.
- `data/grammar-part-1.md` a `data/grammar-part-8.md`: cada uno de los 26 temas gana la sección `### Definición` ubicada entre `### Formación` y `### Usos`, con los dos bullets `EN` y `ES`.
- `app/components/GrammarTheoryClient.tsx`: nueva `<section>` con `<h3>Definition</h3>` inmediatamente después de la sección `Formation` y antes de `Rule`. El texto alterna EN ↔ ES con el toggle existente (`pick`), igual que las otras tres secciones de prosa; el encabezado `Definition` queda siempre en inglés. Si el tema aún no tiene definición (entre los pasos 1 y 11) la sección no se renderiza.
- `app/globals.css`: estilo nuevo `.grammar-theory__definition` — caja con borde y radio (misma familia visual que `.grammar-formation`), a ancho completo del `<article>`, con `h3` y párrafos; legible en tema claro y oscuro.
- Tests: parser (sección presente parsea, bullets EN/ES mal ordenados o vacíos fallan con archivo/línea/tema/sección, ausente falla en el cierre), componente (posición en el DOM después de `Formation` y antes de `Rule`, alternancia EN ↔ ES, encabezado siempre en inglés, ausencia de la sección cuando no hay datos, `lang` correcto), carga real de los ocho archivos (26 definiciones presentes) y `README.md`.
- `README.md`: documenta la sección `### Definición` y su formato de dos bullets.

**Out of scope (for future specs):**

- Cambios al contenido de `Rule`, `When to use`, `Watch out for this`, `In context` o de la práctica guiada.
- Cambios en el bloque `Formation` o en la lista cerrada de `FormationLabel`.
- Persistencia o atajos del toggle ES/EN (SPEC 23 ya lo descartó).
- Cambios en Mixed Practice, filtros, métricas del inicio o en las tarjetas de vocabulario.
- Fuente de contenido distinta de `data/*.md`.

## Data model

```ts
type GrammarTopic = {
  part: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  slug: string;
  title: string;
  definitionEn?: string; // obligatorio desde el paso 12
  definitionEs?: string; // obligatorio desde el paso 12
  ruleEn: string;
  ruleEs: string;
  formations: GrammarFormation[];
  usesEn: string;
  usesEs: string;
  contrastsEn: string;
  contrastsEs: string;
  examples: { exampleEn: string; translationEs: string }[];
  exercises: GrammarExercise[];
};
```

Formato en el Markdown (nueva sección entre `### Formación` y `### Usos`):

```md
### Definición
- **EN:** The **present simple** is the base tense for habits, facts and routines; it is the form you build questions and negatives on with do/does.
- **ES:** El **present simple** es el tiempo base para hábitos, hechos y rutinas; es la forma sobre la que se construyen preguntas y negativas con do/does.
```

Convenciones:

- Los siete encabezados `###` del Markdown no cambian de nombre; `Definición` es estructura editorial en español, igual que `Formación` y `Usos`, y su etiqueta de UI en inglés es `Definition` (SPEC 23).
- Regla editorial para no pisarse con `When to use`: la definición dice **qué es y para qué sirve el tema en general** (identidad y propósito); `When to use` sigue siendo **dónde se aplica** (contextos, matices y expresiones clave). Si una frase puede ir en las dos, va en `When to use`.
- El parser espera exactamente un bullet `EN` y un bullet `ES`, en ese orden; un bullet de más, una etiqueta desconocida, un texto vacío o la ausencia de la sección (en el cierre) fallan con archivo, línea, tema y sección.
- El orden de las secciones dentro de un tema no lo valida el parser (sigue siendo una `Record` de secciones); la posición editorial entre `Formación` y `Usos` es de curaduría y la respeta el `grep` de revisión del paso 11.

## Implementation plan

1. `src/domain/grammar.ts`: `definitionEn` y `definitionEs` como `nonemptyText.optional()` (temporal, se cierra en el paso 12). `src/infrastructure/grammar-parser.ts`: `### Definición` entra a `HEADINGS` y se parsea con `prose()` tolerando la ausencia. Verificación: `npm run test` en verde con los datos actuales, sin tocar los archivos `data/`.
2. `app/components/GrammarTheoryClient.tsx`: sección `Definition` después de `Formation`, renderizada solo si `topic.definitionEn` existe, alternando con `pick`. `app/globals.css`: `.grammar-theory__definition` como caja con borde a ancho completo. Tests del componente: posición en el DOM, alternancia EN ↔ ES, encabezado en inglés en ambos modos, ausencia cuando no hay datos. Verificación: render manual de un tema con definición y de uno sin ella.
3. Migrar `data/grammar-part-1.md` (4 temas). Verificación: parser y loader sobre el archivo real en verde y revisión editorial de la no-overlap con `Usos`.
4. Migrar `data/grammar-part-2.md` (3 temas) con la misma verificación.
5. Migrar `data/grammar-part-3.md` (3 temas) con la misma verificación.
6. Migrar `data/grammar-part-4.md` (5 temas) con la misma verificación.
7. Migrar `data/grammar-part-5.md` (4 temas) con la misma verificación.
8. Migrar `data/grammar-part-6.md` (2 temas) con la misma verificación.
9. Migrar `data/grammar-part-7.md` (2 temas) con la misma verificación.
10. Migrar `data/grammar-part-8.md` (3 temas) con la misma verificación; comprobar que los 26 temas tienen ambos bullets.
11. Revisión editorial global: `grep -A2 "^### Definición" data/grammar-part-*.md` cubre 26 secciones y ninguna definición repite contenido de `### Usos`.
12. Cierre: `definitionEn`/`definitionEs` pasan a obligatorios en el schema, el parser falla si la sección falta o viene mal formada (archivo, línea, tema y sección) y el componente renderiza la sección sin condición. Fixtures y tests actualizados. Verificación: build en verde solo con los ocho archivos migrados.
13. Actualizar `README.md` con la sección `### Definición` y correr `npm run lint && npm run typecheck && npm run test && npm run build`. Verificación: todo en verde.

Los pasos 3–10 son editoriales y commiteables de a un archivo; la tolerancia a la ausencia de la sección solo existe entre los pasos 1 y 12.

## Acceptance criteria

- [ ] Al abrir cualquiera de los 26 temas, la teoría muestra el recuadro `Definition` entre `Formation` y `Rule`, a ancho completo y con borde propio en tema claro y oscuro.
- [ ] Con el toggle en EN el recuadro muestra el texto inglés y el DOM no contiene `definitionEs`; con el toggle en ES muestra el texto español y no contiene `definitionEn`.
- [ ] El encabezado `Definition` está en inglés en ambos modos.
- [ ] Cada uno de los 26 temas tiene `### Definición` con dos bullets `**EN:**` y `**ES:**` no vacíos y en ese orden.
- [ ] El DOM de cada tema tiene la sección `Definition` después de `Formation` y antes de `Rule`.
- [ ] El texto de cada definición no repite las frases de su sección `### Usos` (revisión editorial del paso 11).
- [ ] El parser falla con archivo, línea, tema y sección si falta `### Definición`, si sobra un bullet, si los bullets están fuera de orden, si una etiqueta no es `EN`/`ES` o si un texto queda vacío.
- [ ] Las secciones existentes no cambian: misma prosa, misma `Formation`, mismos ejemplos y práctica.
- [ ] `README.md` documenta la sección `### Definición`.
- [ ] `npm run lint && npm run typecheck && npm run test && npm run build` termina sin errores.

## Decisions

- **Yes:** recuadro inmediatamente debajo de `Formation`, a ancho completo. Es el orden pedido y deja la prosa (`Rule` + detalles) como bloque de lectura intacto.
- **Yes:** encabezado fijo `Definition` (elegido por el usuario sobre `What is it?`), en inglés como el resto de los encabezados de la teoría; el heading del Markdown es `### Definición` para mantener los `###` en español.
- **Yes:** sección `### Definición` con dos bullets `EN`/`ES` y validación idéntica a las otras tres secciones de prosa. Reutiliza `prose()`, participa del toggle ES/EN y no agrega un formato nuevo al parser.
- **Yes:** obligatoria en los 26 temas al cierre, con tolerancia opcional solo entre los pasos 1 y 12. Mismo patrón de migración de SPEC 23: ningún tema queda sin recuadro y el build lo garantiza.
- **Yes:** caja con borde propio (familia visual de `.grammar-formation`), distinta de la prosa `Rule`. Se pidió "otro recuadro", no otro párrafo.
- **Yes:** la no-overlap se resuelve por regla editorial, no por validación de parser: definición = qué es y para qué sirve; `When to use` = dónde se aplica. Comparar strings en el parser sería frágil y sin beneficio.
- **No:** validar el orden de las secciones `###` en el parser. Nunca se validó y agregarlo solo para `Definición` es complejidad nueva; la posición editorial se revisa con `grep`.
- **No:** definiciones cortas compartidas entre temas de una misma parte. Cada tema define su objeto; generalizar sería contenido duplicado enmascarado.
- **No:** tocar `Rule` ni `Usos` para "acomodar" la definición. Queda expresamente fuera de alcance.

## Risks

| Risk | Mitigation |
| --- | --- |
| 26 definiciones × 2 idiomas escritas a mano pueden replicar el contenido de `Usos` | Regla editorial explícita en Convenciones más la revisión `grep` del paso 11 como criterio de aceptación. |
| La tolerancia a la sección ausente deja temas sin recuadro si el paso 12 se saltea | Paso 12 vuelve obligatorios los dos campos en el schema; el build falla con archivo, línea y tema. |
| Tests que afirman la lista de encabezados o el orden del artículo rompen al sumar la sección | Paso 2 actualiza `GrammarTheoryClient.test.tsx` (headings y posición en el DOM) en el mismo cambio. |
| La caja nueva se ve mal en tema oscuro o rompe el espaciado de la prosa | Estilo definido en ambos bloques de tema y verificación visual en los dos. |

## What is **not** in this spec

- Cambios al contenido de `Rule`, `When to use`, `Watch out for this`, `In context` o de la práctica.
- Cambios al bloque `Formation` o a `FormationLabel`.
- Persistencia o atajos del toggle ES/EN.
- Cambios en Mixed Practice, filtros, métricas del inicio o tarjetas de vocabulario.
- Fuente de contenido distinta de `data/*.md`.

Cada uno de esos, si llega, va en su propia spec.
