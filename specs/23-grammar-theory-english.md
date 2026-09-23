# SPEC 23 — Grammar theory in English with an ES toggle

> **Status:** Implementada
> **Depends on:** SPEC 12, SPEC 13, SPEC 22
> **Date:** 2026-09-23
> **Objective:** Show the Grammar B1+ theory prose in English by default with a compact ES/EN button that switches it to Spanish, while section titles and the Formation block always stay in English.

## Scope

**In:**

- `data/grammar-part-1.md` a `data/grammar-part-8.md`: las tres secciones de prosa de cada uno de los 26 temas (`### Regla y forma`, `### Usos`, `### Contrastes y errores`) pasan a tener dos bullets, `**EN:**` y `**ES:**`, ambos obligatorios y no vacíos; el texto español actual se conserva en el bullet `ES` y se escribe una versión inglesa equivalente en el bullet `EN`.
- `data/grammar-part-1.md` a `data/grammar-part-8.md`: todo el bloque `### Formación` se reescribe en inglés — nombres de formación, etiquetas (`Affirmative`, `Negative`, `Question`, `Result`, `Condition`, `Main clause`, `Time clause`, `Pattern`) y patterns (`subject + base verb (+ -s/-es in the third person)` en lugar de `sujeto + verbo base…`).
- `src/domain/grammar.ts`: `GrammarTopic` suma `ruleEn`, `usesEn` y `contrastsEn` obligatorios (opcionales solo durante la migración, ver plan paso 12); `ruleEs`, `usesEs` y `contrastsEs` siguen obligatorios.
- `src/infrastructure/grammar-parser.ts`: las tres secciones de prosa se parsean como exactamente dos bullets con etiquetas `EN` y `ES` en ese orden, ambos no vacíos; las etiquetas de formación se validan contra la lista cerrada en inglés; los errores siguen indicando archivo, línea, tema y sección/campo.
- `app/components/GrammarTheoryClient.tsx` (nuevo Client Component): renderiza el `<article className="grammar-theory">` completo con estado local `showEs` (`false` por defecto). Encabezados siempre en inglés: `Theory`, `Formation`, `Rule`, `When to use`, `Watch out for this`, `In context`. La prosa de las tres secciones alterna el texto completo EN ↔ ES. En modo EN el texto español de esas tres secciones no está en el DOM; en modo ES el texto inglés no está. El bloque `Formation` y los ejemplos se renderizan igual en ambos modos.
- Botón compacto `ES`/`EN` a la derecha de la primera fila del encabezado `Theory`, con el mismo patrón visual que el dorso de las tarjetas (SPEC 13): `aria-pressed`, `aria-label` `Show Spanish theory` / `Show English theory` y región `aria-live="polite"`.
- `app/grammar/page.tsx` y el header de `app/grammar/[part]/[topic]/page.tsx`: `Parte {n}` → `Part {n}` (los títulos quedan siempre en inglés).
- Ejemplos `In context`: el par EN + ES sigue visible siempre, en ambos modos, sin alternancia.
- Práctica sin cambios: `promptEn`/`modelEn` en inglés; `explanationEs`/`translationEs` en español y solo después de `Reveal`.
- Reset a EN al navegar a otro tema (el componente se remonta por ruta); sin persistencia.
- Tests: parser (bullets bilingües, legacy, etiquetas inválidas, formación fuera de la lista), componente (EN por defecto, ausencia de ES en el DOM, alternancia, reset, encabezados y formación siempre en inglés en ambos modos), página y carga real.
- `README.md`: documentar el formato bilingüe de las tres secciones de prosa y la formación en inglés, y actualizar la descripción de Grammar B1+.

**Out of scope (for future specs):**

- Botón ES para las tarjetas de práctica (exigiría `explanationEn` en los 26 temas).
- Persistir la preferencia de idioma (localStorage o sesión).
- Atajo de teclado para ES (Espacio/←/→ ya están asignados).
- Alternar la traducción de los ejemplos `In context`.
- Traducción al inglés de los ejercicios (`prompt`, `model`) o de sus traducciones.
- Cambios en Mixed Practice, filtros, estadísticas del inicio o en las tarjetas de vocabulario.
- Fuente de contenido distinta de `data/*.md`.

## Data model

```ts
type GrammarTopic = {
  part: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  slug: string;
  title: string; // siempre en inglés (catálogo, sin cambios)
  ruleEn: string;
  ruleEs: string;
  formations: GrammarFormation[]; // name y patterns siempre en inglés
  usesEn: string;
  usesEs: string;
  contrastsEn: string;
  contrastsEs: string;
  examples: { exampleEn: string; translationEs: string }[]; // mínimo 2, sin cambios
  exercises: GrammarExercise[]; // mínimo 5, sin cambios
};

// Etiquetas permitidas dentro de formations.patterns (lista cerrada)
type FormationLabel =
  | "Affirmative" | "Negative" | "Question" | "Pattern"
  | "Result" | "Condition" | "Main clause" | "Time clause";
```

Formato de las secciones de prosa (se reemplaza el párrafo suelto actual):

```md
### Regla y forma
- **EN:** The **present simple** uses the base verb and adds **-s/-es** in the third person.
- **ES:** El **present simple** usa el verbo base y agrega **-s/-es** en tercera persona.
### Formación
- **Name (EN):** Present Simple
  - **Affirmative:** subject + base verb (+ -s/-es in the third person)
  - **Negative:** subject + don't/doesn't + base verb
  - **Question:** Do/does + subject + base verb?
```

Convenciones:

- Los seis encabezados `###` del Markdown no cambian de nombre (son estructura editorial, no UI).
- En las tres secciones de prosa se espera exactamente un bullet `EN` y un bullet `ES`, en ese orden; un bullet de más, una etiqueta desconocida o un texto vacío fallan con archivo, línea, tema y sección.
- El estado UI es `showEs: boolean` en `GrammarTheoryClient`; `false` es inglés y se resetea al navegar a otro tema.

## Implementation plan

1. `src/domain/grammar.ts`: sumar `ruleEn`, `usesEn`, `contrastsEn` como `nonemptyText.optional()` (temporal, se cierra en el paso 12). `src/infrastructure/grammar-parser.ts`: parsear las tres secciones de prosa como bullets `EN`/`ES`, aceptando todavía el párrafo suelto legacy como solo-ES. Fixtures y tests: bloque bilingüe parsea, legacy parsea, etiqueta desconocida o bullet de más falla con archivo/línea/sección. Verificación: suite en verde con los datos actuales sin tocar.
2. Crear `app/components/GrammarTheoryClient.tsx` con la prosa bilingüe, encabezados en inglés, botón `ES`/`EN` (mismo patrón que `FlashcardClient`) y cablearlo desde `app/grammar/[part]/[topic]/page.tsx` (el server component solo resuelve ruta, catálogo y loader). Tests del componente: EN por defecto y ausencia del texto ES en el DOM; pulsar ES muestra ES y oculta EN; pulsar EN restaura; encabezados y bloque `Formation` en inglés en ambos modos; ejemplos EN+ES siempre visibles; reset al remontar. Verificación: manual — abrir un tema, alternar, navegar a otro tema y ver inglés.
3. `app/grammar/page.tsx` y header del tema: `Parte {n}` → `Part {n}`; actualizar `app/grammar/page.test.tsx` y `app/grammar/[part]/[topic]/page.test.tsx`. Verificación: tests en verde y búsqueda de `Parte` en `app/` sin resultados.
4. Migrar `data/grammar-part-1.md`: sus cuatro temas con bullets `EN`/`ES` en las tres secciones de prosa y `Formación` íntegramente en inglés (etiquetas de la lista cerrada). Verificación: parser y loader sobre el archivo real en verde; revisión editorial de reglas, ejemplos y modelos.
5. Migrar `data/grammar-part-2.md` (tres temas) con la misma verificación.
6. Migrar `data/grammar-part-3.md` (tres temas) con la misma verificación.
7. Migrar `data/grammar-part-4.md` (cinco temas) con la misma verificación.
8. Migrar `data/grammar-part-5.md` (cuatro temas) con la misma verificación.
9. Migrar `data/grammar-part-6.md` (dos temas) con la misma verificación.
10. Migrar `data/grammar-part-7.md` (dos temas) con la misma verificación.
11. Migrar `data/grammar-part-8.md` (tres temas) con la misma verificación; comprobar que los 26 temas tienen ambos idiomas y ninguna etiqueta de formación en español.
12. Cierre: `ruleEn`/`usesEn`/`contrastsEn` pasan a obligatorios en el schema, el parser rechaza prosa legacy o bullet `EN`/`ES` faltante/vacío con archivo, línea, tema y sección, y se elimina el fallback a ES del componente. Fixtures y tests actualizados. Verificación: build en verde solo con los ocho archivos migrados.
13. Actualizar `README.md` (formato de prosa bilingüe, formación en inglés, descripción de la sección Grammar) y correr `npm run lint && npm run typecheck && npm run test && npm run build`. Verificación: todo en verde.

Los pasos 4–11 son editoriales y commiteables de a un archivo; la tolerancia al formato legacy solo existe entre los pasos 1 y 12.

## Acceptance criteria

- [ ] Al abrir cualquiera de los 26 temas, la prosa de `Rule`, `When to use` y `Watch out for this` aparece en inglés y el DOM no contiene `ruleEs`, `usesEs` ni `contrastsEs` en ese modo.
- [ ] Los encabezados `Theory`, `Formation`, `Rule`, `When to use`, `Watch out for this` e `In context` están en inglés con el botón en EN y con el botón en ES.
- [ ] El bloque `Formation` se muestra en inglés en ambos modos: `grep -E "Afirmativa|Negativa|Interrogativa|Resultado|Condición|Oración principal|Cláusula temporal|sujeto" data/grammar-part-*.md` no devuelve resultados dentro de bloques `### Formación`.
- [ ] Pulsar `ES` reemplaza las tres secciones de prosa por el texto español; el texto inglés de esas secciones desaparece del DOM, el botón pasa a mostrar `EN` y `aria-pressed` refleja el estado.
- [ ] Pulsar `EN` restaura la prosa en inglés, sin texto español de esas secciones en el DOM.
- [ ] Navegar a otro tema muestra la prosa en inglés de nuevo (estado reseteado).
- [ ] Los ejemplos `In context` muestran siempre el par EN + ES en ambos modos.
- [ ] Las tarjetas de práctica no cambian: consigna y modelo en inglés, explicación y traducción en español y solo después de `Reveal`.
- [ ] `app/` no contiene `Parte` (índice y header muestran `Part 1` … `Part 8`).
- [ ] El parser falla con archivo, línea, tema y sección si falta un bullet `EN` o `ES`, si sobra un bullet, si una etiqueta de formación no está en la lista cerrada en inglés, o si queda prosa legacy.
- [ ] Los 26 temas tienen prosa en ambos idiomas; `npm run lint && npm run typecheck && npm run test && npm run build` termina sin errores.

## Decisions

- **Yes:** dos bullets `EN`/`ES` dentro de las tres secciones existentes. Se descartó duplicar encabezados `###` (rompería el contrato de seis secciones por tema).
- **Yes:** inglés por defecto con reset por tema y sin persistencia. Espejo exacto de SPEC 13; evita que un idioma quede pegado entre temas.
- **Yes:** el toggle alcanza solo la prosa teórica. Los ejemplos son bilingües por diseño y la práctica ya tiene su propio dorso; alternarla exigiría `explanationEn` (otra spec).
- **Yes:** encabezados de sección siempre en inglés en ambos modos. Son chrome (SPEC 12), no contenido conmutable.
- **Yes:** `Formación` permanentemente en inglés, con etiquetas migradas a `Affirmative/Negative/Question/…` y validadas por lista cerrada en el parser. Los patterns estructurales pertenecen al idioma meta.
- **Yes:** tolerancia temporal al formato legacy solo entre los pasos 1 y 12; el paso 12 la elimina para que ningún tema quede sin inglés.
- **Yes:** `Parte` → `Part` incluido en esta spec. "Los títulos siempre en inglés" cubre ese string.
- **No:** i18n con diccionarios o locales. El contenido bilingüe se cura en `data/*.md`, igual que el resto del MVP.
- **No:** atajo de teclado para ES. Espacio, ← y → ya están ocupados; el botón es focuseable por Tab.

## Risks

| Risk | Mitigation |
| --- | --- |
| 26 temas × 3 secciones de prosa traducidas a mano pueden desincronizarse del texto español | Ambos bullets son obligatorios y se validan juntos; loader sobre los ocho archivos reales y revisión editorial paso a paso (pasos 4–11). |
| El texto español de los patterns no es detectable por el parser | Lista cerrada de etiquetas en inglés en el parser más revisión editorial de los patrones durante la migración. |
| La tolerancia al formato legacy oculta un tema sin migrar | Paso 12 elimina el fallback y vuelve obligatorio `ruleEn/usesEn/contrastsEn`; el build falla con archivo, línea y tema. |
| Cambiar los encabezados rompe tests de página que buscan `Regla` o `Cuándo se usa` | Paso 2 y 3 actualizan `page.test.tsx` y los tests del componente en el mismo cambio. |

## What is **not** in this spec

- Botón ES para las explicaciones de las tarjetas de práctica.
- Persistencia de la preferencia de idioma o atajo de teclado.
- Alternar la traducción de los ejemplos `In context`.
- Cambios en Mixed Practice, filtros, métricas del inicio o en el contenido de vocabulario.
- Fuente de contenido distinta de `data/*.md`.

Cada uno de esos, si llega, va en su propia spec.
