# SPEC 24 — Sección Connectors con ~70 conectores B1–B2

> **Status:** Implemented
> **Depends on:** SPEC 01, SPEC 08, SPEC 12
> **Date:** 2026-09-23
> **Objective:** Agregar la sección `Connectors` al inicio con un archivo `data/connectors-b1-b2.md` de al menos 70 conectores agrupados por función y tarjetas de producción con el flujo estándar, sin participar en Mixed Practice.

## Scope

**In:**

- `data/connectors-b1-b2.md` (nuevo): al menos 70 conectores en inglés, agrupados bajo encabezados `##` de función (los nueve grupos de la sección Data model), cada grupo con al menos 5 conectores. Cada conector es un bullet en el formato estándar de tarjetas: expresión, meaning (EN), significado (ES), ejemplo (EN), traducción (ES), contexto (EN) y fuente del contexto.
- `src/domain/card.ts`: suma el tipo `connector` al `CardTypeSchema` y la etiqueta `Connectors` a `CARD_TYPE_LABELS`.
- `src/domain/sections.ts`: suma `connectors` a `SECTIONS`, `SECTION_LABELS` (`Connectors`) y `SECTION_FILES` (`data/connectors-b1-b2.md`).
- `src/infrastructure/content-loader.ts`: `connectors` entra a `CONTENT_SECTIONS` y se parsea con `parseBulletCards` tipo `connector`. Se crea `MIXED_SECTIONS` = `CONTENT_SECTIONS` sin `connectors`, que pasa a usarse en `app/mixed/page.tsx` y para el `mixedCount` de `app/page.tsx`.
- `src/domain/hints.ts`: `resolveHint` suma el case `connector` → `fallback:connector` (mismo SVG animado genérico que los demás fallbacks, sin fotos curadas).
- Tarjeta `Connectors` en `app/page.tsx`: href `/connectors`, unidad `cards`, con su conteo en el total y en la barra de distribución del inicio; `app/globals.css` suma `--accent-connectors` en tema claro y oscuro.
- Ruta `/connectors`: resuelta por el `app/[section]/page.tsx` existente, con el flujo de flashcards y el drawer de filtros (SPEC 08) sin cambios de comportamiento; los filtros de categoría ofrecen los grupos de función del archivo.
- Tests: dominio (tipo y secciones), loader (lectura real ≥70 tarjetas, `MIXED_SECTIONS` sin `connectors`, error con archivo y línea por bullet incompleto), hints (case `connector`), inicio (tarjeta, conteos, mixed excluido) y ruta de sección.
- `README.md`: documenta `data/connectors-b1-b2.md`, su formato bullet y la nueva sección.

**Out of scope (for future specs):**

- Connectors en Mixed Practice.
- Página de teoría tipo Grammar (agrupación con prosa y práctica guiada por función).
- Campo `level` por conector en el bullet; todas las tarjetas quedan `B1-B2` como el resto del material.
- Fotos curadas de pistas para conectores.
- Cambios en las tarjetas o contenido de las secciones existentes, en Grammar o en las métricas de vocabulario.
- Fuente de contenido distinta de `data/*.md` (carpeta `docs/` no existe y no se crea).

## Data model

Encabezados `##` del archivo (lista editorial de grupos; el parser los toma como `category` sin validar un conjunto cerrado, igual que las demás secciones):

| # | Grupo (`##`) | Ejemplos de conectores |
| --- | --- | --- |
| 1 | Adding information | moreover, furthermore, in addition, besides, what's more, not only ... but also |
| 2 | Contrast and concession | however, nevertheless, on the other hand, although, even though, whereas, despite, in spite of |
| 3 | Cause and reason | because, since, due to, owing to, on account of, for this reason |
| 4 | Result and consequence | therefore, thus, consequently, as a result, hence, accordingly |
| 5 | Purpose | so that, in order to, in order that, so as to, with the aim of |
| 6 | Time and sequence | first(ly), finally, meanwhile, afterwards, in the meantime, eventually, by the time |
| 7 | Examples and clarification | for example, for instance, such as, to illustrate, in other words, namely |
| 8 | Opinion and stance | in my opinion, from my point of view, as far as I'm concerned, personally, in fact, above all |
| 9 | Summary and conclusion | in conclusion, to sum up, in short, all in all, overall, to conclude |

Formato fijo por bullet (idéntico a `idioms-b1-b2.md` y las demás secciones bullet):

```md
## Contrast and concession
- **moreover** --- in addition to what has been said --- y además, encima --- *The hotel was cheap; moreover, it was close to the centre.* --- *El hotel era barato; además, estaba cerca del centro.* --- *The course is short. Moreover, it is cheap, so I will sign up tomorrow morning.* --- *Everyday conversation*
```

```ts
type Card = {
  expression: string; // "moreover"
  type: "connector";
  level: "B1-B2"; // default del schema, sin campo en el bullet
  meaningEn: string;
  meaningEs: string;
  exampleEn: string;
  translationEs: string;
  category: string; // encabezado ## vigente
  contextEn: string;
  contextSource?: string; // default "Everyday conversation"
};
```

Convenciones:

- Cada bullet se parsea con `parseBulletCards`; el encabezado `##` más cercano arriba define la `category`.
- Un bullet sin campo, con ejemplo en cursiva sin cerrar o con `---` dentro del contexto falla con archivo y línea.
- La práctica respeta el invariante: el frente muestra expresión + categoría + consigna de recordar el significado y producir una oración; `Reveal` muestra meaning, example, translation y context.

## Implementation plan

1. `src/domain/card.ts`: agregar `"connector"` a `CardTypeSchema` y `"Connectors"` a `CARD_TYPE_LABELS`; actualizar `src/domain/card.test.ts`. Verificación: suite del dominio en verde.
2. Crear `data/connectors-b1-b2.md` con los nueve grupos `##` y al menos 70 bullets completos (cada grupo con 5 o más). Verificación editorial: revisar formato bullet campo por campo contra un bullet de `idioms-b1-b2.md` y confirmar que los ejemplos y traducciones son naturales.
3. `src/domain/sections.ts` y `src/infrastructure/content-loader.ts`: entrada `connectors` en `SECTIONS`/`SECTION_LABELS`/`SECTION_FILES`/`CONTENT_SECTIONS`, case `connectors` → `parseBulletCards` tipo `connector`, y constante nueva `MIXED_SECTIONS` (las secciones de contenido menos `connectors`). Tests: lectura del archivo real devuelve ≥70 tarjetas tipadas `connector` con las nueve categorías; `MIXED_SECTIONS` no contiene `connectors`; bullet incompleto falla con archivo y línea. Verificación: `app/mixed/page.tsx` consume `MIXED_SECTIONS`; la ruta `/connectors` ya responde con tarjetas.
4. `src/domain/hints.ts`: case `connector` → `fallback:connector` en `resolveHint`; test en `hints.test.ts`. Verificación: una tarjeta conector resuelve ese id y `HintGallery` renderiza el fallback sin errores.
5. `app/page.tsx`: entrada `Connectors` en el array `sections` (href, acento, unidad `cards`) y el `mixedCount` deja de contarla; `app/globals.css`: `--accent-connectors` en claro y oscuro; actualizar `app/page.test.tsx` y los tests que afirman cantidades de secciones (`sections.test.ts`, `getSections.test.ts`). Verificación: el inicio muestra la tarjeta, la barra de distribución la incluye y el contador de Mixed no la cuenta.
6. Actualizar `README.md` con la sección Connectors y el formato de `data/connectors-b1-b2.md`. Verificación: `npm run lint && npm run typecheck && npm run test && npm run build` termina sin errores.

Los pasos 1–5 dejan el sistema funcionando en cada punto: el 3 ya sirve la ruta completa y el 5 cierra la visibilidad en el inicio.

## Acceptance criteria

- [ ] El inicio muestra una tarjeta `Connectors` que navega a `/connectors`, con el conteo de tarjetas incluido en el total y en la barra de distribución, en tema claro y oscuro.
- [ ] `data/connectors-b1-b2.md` contiene 70 o más bullets y los nueve grupos `##`, cada uno con al menos 5 conectores.
- [ ] Toda tarjeta parseada tiene `type: "connector"`, `level: "B1-B2"`, `category` igual a uno de los nueve grupos y los siete campos no vacíos.
- [ ] `/connectors` muestra el flujo estándar: frente con expresión, categoría y consigna de producir una oración; el DOM no contiene meaning, example, translation ni context de la tarjeta actual antes de `Reveal`.
- [ ] `Reveal` muestra meaning (EN/ES), example, translation y context; `Next` los vuelve a ocultar.
- [ ] El drawer de filtros de `/connectors` ofrece las categorías de los nueve grupos y filtrar por una de ellas reduce el mazo correctamente.
- [ ] Un bullet incompleto o malformado hace fallar el parser identificando archivo y línea.
- [ ] Mixed Practice no incluye ninguna tarjeta `connector` y el contador de Mixed del inicio no lo cuenta.
- [ ] Las tarjetas de conector resuelven `fallback:connector` y la pista visual se renderiza sin errores.
- [ ] Las secciones existentes no cambian: mismos conteos, mismos filtros, mismo contenido.
- [ ] `README.md` documenta la sección Connectors y el formato del archivo.
- [ ] `npm run lint && npm run typecheck && npm run test && npm run build` termina sin errores.

## Decisions

- **Yes:** archivo en `data/connectors-b1-b2.md`, no en `docs/`. Todo el contenido vive en `data/*.md` y el loader solo lee de ahí; crear `docs/` habría exigido cambiar la fuente de contenido.
- **Yes:** sección estándar de vocabulario (entrada en `SECTIONS` + ruta `[section]`), no página propia tipo Grammar. Reutiliza parser, loader, filtros, flashcards y estilos; una página con teoría por función sería otra spec.
- **Yes:** ~70 conectores agrupados por función. Los 50 esenciales de B1+ dejan cortas concesión, propósito y secuencia; el resto del material es B1–B2 y el exceso de curaduría es de contenido, no de código.
- **Yes:** formato bullet estándar con `##` como categoría de función. Sin campos nuevos en el parser; los filtros de categoría quedan gratis.
- **Yes:** `MIXED_SECTIONS` explícito (contenido menos connectors). Se descartó agregar un flag por sección: con una sola excepción basta una constante nombrada.
- **Yes:** `level` fijo `B1-B2` por default del schema. El bullet no lleva nivel, igual que en las otras siete secciones.
- **Yes:** pistas solo con fallback `fallback:connector`. Las fotos curadas son trabajo por expresión y los conectores son palabras cortas; otra spec si se quiere.
- **No:** incluir connectors en Mixed Practice. Confirmado explícitamente fuera de alcance.
- **No:** carpeta `docs/`. No existe y rompería la única fuente de contenido.
- **No:** campo `level` ni lista cerrada de categorías en el parser. Complejiza el formato sin beneficio medible hoy.

## Risks

| Risk | Mitigation |
| --- | --- |
| `CONTENT_SECTIONS` alimenta Mixed Practice: agregar `connectors` ahí metería los conectores en Mixed por accidente | `MIXED_SECTIONS` explícito, usado en `app/mixed/page.tsx` y en el `mixedCount` del inicio, con test que afirma su ausencia. |
| 70 conectores × 7 campos escritos a mano pueden quedar malformados (cursiva sin cerrar, `---` de más) | Test de loader sobre el archivo real (≥70, nueve categorías) más revisión editorial campo por campo en el paso 2. |
| El accent nuevo queda solo en tema claro y la tarjeta se ve mal en oscuro | `--accent-connectors` definido en ambos bloques de tema y verificación visual en los dos. |
| Tests que afirman el número de secciones (7 u 8) rompen al sumar la octava | El paso 5 actualiza `page.test.tsx`, `sections.test.ts` y `getSections.test.ts` en el mismo cambio. |

## What is **not** in this spec

- Connectors en Mixed Practice o en el contador de Mixed.
- Página de teoría por función al estilo Grammar.
- Campo de nivel por conector, fotos curadas de pistas o i18n.
- Cambios al contenido o las tarjetas de las secciones existentes.
- Carpeta `docs/` o fuente de contenido distinta de `data/*.md`.

Cada uno de esos, si llega, va en su propia spec.
