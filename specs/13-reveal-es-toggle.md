# SPEC 13 — Alternador ES/EN en el dorso

> **Status:** Implementado
> **Depends on:** SPEC 12
> **Date:** 2026-09-18
> **Objective:** El dorso muestra significado y ejemplo en inglés por defecto, con un botón compacto ES/EN por tarjeta para alternar toda la explicación al español.

## Scope

**In:**

- `data/phrasal-verbs-b1-b2-200.md`: cada tarjeta incorpora `Meaning (EN)`, `Significado (ES)`, `Example (EN)` y `Traducción (ES)`.
- `data/collocations-b1-b2.md`, `data/fixed-prepositions-b1-b2.md` y `data/idioms-b1-b2.md`: cada bullet migra al orden `**expression** --- meaningEn --- meaningEs --- *exampleEn* --- *translationEs*`.
- `data/word-formation-b1-b2.md`: la tabla incorpora la columna `Hint (EN)` además del actual significado español. Los ejemplos, Noun, Adjective y Adverb permanecen en inglés.
- `src/domain/card.ts` y `src/domain/word-formation.ts`: `Card` suma `meaningEn` obligatorio y hace obligatorio `translationEs`; `WordFamily` suma `meaningHintEn` obligatorio. Se conservan los campos españoles existentes con sus nombres actuales.
- `src/infrastructure/markdown-parser.ts` y `src/infrastructure/word-formation-parser.ts`: parsean y validan las nuevas gramáticas; los errores indican el campo bilingüe faltante y su archivo/línea.
- `app/components/FlashcardClient.tsx`: el dorso muestra por defecto `meaningEn` + `exampleEn`. Un botón compacto al lado derecho de la primera fila, con texto ES, cambia la explicación completa a `meaningEs` + `translationEs`; entonces muestra EN para volver al inglés. Usa `aria-pressed`, `aria-label` "Show Spanish translation" / "Show English explanation" y una región `aria-live="polite"`.
- `app/components/WordFormationClient.tsx`: el mismo alternador cambia solo Hint entre `meaningHintEn` y `meaningHint`; Noun/Adjective/Adverb y ejemplos siguen siempre visibles en inglés.
- Estado local por tarjeta: al cambiar de tarjeta/familia (Anterior/Siguiente o atajos) vuelve a inglés. Sin persistencia.
- Tests de dominio, parser, loader y componentes cubren ambos idiomas, las nuevas gramáticas, alternancia, accesibilidad y reset al navegar.

**Out of scope (for future specs):**

- Persistir la preferencia de idioma (localStorage o sesión).
- Atajo de teclado dedicado para ES (Espacio ya es Reveal; evitar colisiones).
- Toggle por palabra individual o granularidad menor a tarjeta.
- Traducción automática o servicios externos: los textos bilingües se curan directamente en `data/*.md`.
- Cambios visuales fuera de la ubicación compacta del botón de idioma.

## Data model

```ts
type Card = {
  expression: string;
  meaningEn: string;
  meaningEs: string;
  exampleEn: string;
  translationEs: string;
  // campos existentes
};

type WordFamily = {
  meaningHintEn: string;
  meaningHint: string;
  // formas y ejemplos existentes
};
```

El estado UI local es `showEs: boolean` en ambos Client Components; `false` representa inglés y se resetea al cambiar de tarjeta o familia.

## Implementation plan

1. Extender schemas, fixtures y tests de dominio con `meaningEn`, `translationEs` obligatorio y `meaningHintEn`. Verificación: tests de dominio en verde.
2. Actualizar ambos parsers y sus tests para las gramáticas bilingües, incluidos errores de archivo/línea por cualquier campo faltante. Verificación: tests de parser y loader en verde.
3. Migrar todas las tarjetas de los cinco archivos `data/*.md` con contenido inglés y español curado; ejecutar loaders sobre datos reales. Verificación: conteos existentes conservados y sin errores de parseo.
4. Reemplazar el comportamiento actual de los Client Components por el alternador ES/EN: inglés por defecto, español completo al pulsar ES, inglés al pulsar EN, botón compacto a la derecha y reset en navegación. Verificación: manual en ambas vistas.
5. Actualizar tests de componentes para inglés inicial, cambio a español, retorno a inglés, `aria-pressed`, etiquetas accesibles y reset. Verificación: tests en verde.
6. Corrida global `npm run lint && npm run typecheck && npm run test && npm run build`. Verificación: todo en verde.

## Acceptance criteria

- [x] Tras Reveal, el DOM contiene `meaningEn` y `exampleEn`, y no contiene `meaningEs` ni `translationEs`.
- [x] Pulsar ES reemplaza toda la explicación por `meaningEs` y `translationEs`; el control pasa a mostrar EN y `aria-pressed` refleja el estado.
- [x] Pulsar EN restaura la explicación en inglés, sin contenido español en el DOM.
- [x] Cambiar de tarjeta o familia restaura el modo inglés.
- [x] Todas las tarjetas reales contienen los cuatro campos bilingües; los loaders conservan sus conteos y validan sin errores.
- [x] En Word Formation, Hint alterna entre inglés y español; Noun/Adjective/Adverb/examples permanecen visibles en inglés.
- [x] `npm run lint && npm run typecheck && npm run test && npm run build` en verde.

## Decisions

- **Yes:** inglés completo por defecto. Permite comprobar significado y contexto en el idioma objetivo antes de recurrir al español.
- **Yes:** ES/EN alterna la explicación completa, no solo una fila. Evita mezclar idiomas en el dorso.
- **Yes:** español ausente del DOM en modo inglés y viceversa. Impide la respuesta adelantada por lector de pantalla o inspector.
- **Yes:** reset por tarjeta sin persistencia. Simple, predecible y evita que un idioma quede "pegado" entre tarjetas.
- **Yes:** sin atajo de teclado. Espacio/←/→ ya están asignados; el botón es focuseable por Tab.
- **No:** traducción automática. La calidad pedagógica del contenido exige textos curados en Markdown.

## Risks

| Risk | Mitigation |
| ---- | ---------- |
| Migrar el contenido bilingüe altera los conteos o deja una tarjeta incompleta | Parsers estrictos, tests por campo y loaders sobre todos los datos reales |
| El estado `showEs` sobrevive al cambiar de tarjeta | Reset ligado a la identidad de la tarjeta + test de reset |
| Tests viejos esperan español visible tras Reveal | Se actualizan en el paso 5 a esperar inglés inicial y alternancia |

## What is **not** in this spec

- Persistencia de la preferencia de idioma.
- Atajo de teclado para ES.
- Traducción automática, proveedores externos o generación en tiempo de ejecución.
