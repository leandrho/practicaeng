# SPEC 26 — Tags gramaticales en Phrasal Verbs y Prepositions

> **Status:** Implementado
> **Depends on:** SPEC 02, SPEC 03, SPEC 24
> **Date:** 2026-09-23
> **Objective:** Unificar las etiquetas de las tarjetas en `Card.tags` y sumar tags gramaticales a Phrasal Verbs y Prepositions, conservando las categorías y mostrando los tags solo después de `Reveal`.

## Why this spec exists

Connectors ya muestra tags de registro y uso, pero están almacenados en campos propios (`register` y `channel`). Phrasal Verbs y Prepositions necesitan etiquetas gramaticales distintas. Un campo común con valores controlados por sección permite reutilizar la interfaz sin mezclar categorías ni mostrar información antes de `Reveal`.

## Scope

**In:**

- `src/domain/card.ts`: reemplazar `register` y `channel` por `tags: CardTag[]`, con lista cerrada y validación dependiente de `card.type`. Las tarjetas sin tags reciben `[]`.
- `src/infrastructure/markdown-parser.ts`: leer tags desde la sintaxis existente de Connectors y desde formatos opcionales para bullets y Phrasal Verbs. Un tag desconocido para la sección falla con archivo y línea.
- `data/connectors-b1-b2.md`: migrar los 70 conectores al campo común `Tags`, conservando en inglés sus dos etiquetas de registro y uso.
- `data/phrasal-verbs-b1-b2-200.md`: incorporar, cuando el sentido de la tarjeta lo permita, `Transitive`, `Intransitive`, `Separable` e `Inseparable`.
- `data/fixed-prepositions-b1-b2.md`: incorporar, cuando aporte información útil, `+ noun phrase`, `+ -ing` y `+ clause`.
- `app/components/FlashcardClient.tsx` y `app/globals.css`: mostrar los valores de `card.tags` como chips simples en inglés, solo en el reverso revelado.
- Tests de dominio, parsers, loader y flashcard: validar allowlists por sección, combinaciones gramaticales válidas y ausencia de tags antes de `Reveal`.
- `README.md`: documentar la sintaxis editorial y los valores permitidos.

**Out of scope (for future specs):**

- Tags de registro, cortesía o ámbito para Idioms, Everyday Phrases y Collocations (SPEC 27).
- Tags para Grammar, Irregular Verbs o Word Formation.
- Cambiar o reemplazar `category`, los filtros existentes, el contenido de ejemplos o la cantidad de tarjetas.
- Filtrar, buscar o generar sesiones por tags.
- Separar tarjetas existentes en sentidos nuevos. Los tags describen el sentido que presenta el ejemplo actual.

## Data model

```ts
type CardTag =
  | "Formal"
  | "Neutral"
  | "Informal"
  | "Spoken"
  | "Written"
  | "Spoken & written"
  | "Transitive"
  | "Intransitive"
  | "Separable"
  | "Inseparable"
  | "+ noun phrase"
  | "+ -ing"
  | "+ clause";

type Card = {
  // Campos existentes
  tags: CardTag[]; // default: []
};
```

Valores permitidos por tipo:

- `connector`: `Formal`, `Neutral`, `Informal`, `Spoken`, `Written`, `Spoken & written`. Cada conector conserva exactamente un valor de registro y uno de uso.
- `phrasal-verb`: `Transitive`, `Intransitive`, `Separable`, `Inseparable`. Una tarjeta describe el sentido demostrado por su ejemplo; la separabilidad solo se etiqueta para sentidos transitivos. No se asignan valores contradictorios a un mismo sentido.
- `preposition`: `+ noun phrase`, `+ -ing`, `+ clause`. Una tarjeta puede tener más de uno cuando el patrón admite esas formas.
- Los otros tipos aceptan `tags: []` hasta que otra spec habilite su vocabulario.

Formato de autoría:

```md
<!-- Bullet cards, incluidos Connectors y Prepositions -->
... --- *Everyday conversation* --- *Tags: Neutral, Spoken & written*

<!-- Phrasal Verbs -->
- **Tags:** Transitive, Separable
```

El campo de tags se omite cuando no aporta información o el dato no se puede determinar con confianza. En Prepositions, los encabezados existentes (`Adjective + preposition`, `Verb + preposition`, `Noun + preposition`) siguen siendo `category`; no se repiten como tags.

## Implementation plan

1. `src/domain/card.ts`: agregar `CardTagSchema`, `tags` con default `[]` y allowlists por `CardType`. Mantener temporalmente compatibilidad de lectura con `register`/`channel` para que el contenido actual siga cargando. Añadir tests de schema. Verificación: suite de dominio en verde.
2. `src/infrastructure/markdown-parser.ts`: convertir los campos actuales `Register`/`Channel` de Connectors a `tags`; agregar parseo opcional del campo común para bullet cards y Phrasal Verbs. Añadir tests de sintaxis válida, tag desconocido, campo ausente y valores predeterminados. Verificación: parsers y loader actuales en verde.
3. `app/components/FlashcardClient.tsx` y `app/globals.css`: renderizar `card.tags` como chips en inglés, sin prefijos y solo después de `Reveal`. Retirar el fallback de UI a `register`/`channel` cuando todos los conectores ya produzcan `tags`. Verificación: test DOM antes y después de revelar.
4. `data/connectors-b1-b2.md`: migrar sus nueve grupos de función al campo `Tags`; remover la sintaxis antigua del parser y los campos antiguos del schema. Verificación: el loader comprueba que los 70 conectores conservan exactamente un tag de registro y uno de uso.
5. `data/fixed-prepositions-b1-b2.md`: revisar y migrar los grupos `Adjective + preposition`, `Verb + preposition` y `Noun + preposition`. Verificación: revisar tags múltiples para patrones con más de un complemento y mantener intactas las categorías.
6. `data/phrasal-verbs-b1-b2-200.md`: etiquetar los sentidos demostrados por el ejemplo en cuatro tandas independientes: tarjetas 1–50, 51–100, 101–150 y 151–200. En cada tanda, validar el formato y revisar que `Separable`/`Inseparable` no aparezcan en tarjetas `Intransitive`.
7. `README.md`: documentar el campo `Tags` común, las allowlists por sección y que las etiquetas se revelan con la respuesta. Verificación: `npm run lint`, `npm run typecheck`, `npm run test` y `npm run build`.

## Acceptance criteria

- [x] `Card` expone `tags: CardTag[]`; una tarjeta sin tags obtiene `[]`.
- [x] El schema/parser rechaza tags desconocidos para el tipo de tarjeta con archivo y línea en errores de contenido.
- [x] Los 70 conectores conservan un tag de registro y uno de uso: `Formal`/`Neutral`/`Informal` y `Spoken`/`Written`/`Spoken & written`.
- [x] Las 200 tarjetas de Phrasal Verbs y las tarjetas de Prepositions fueron revisadas; cada tag incluido está sustentado por el sentido/patrón de la tarjeta y lo no aplicable queda sin tag.
- [x] `Intransitive` no se combina con `Separable` ni `Inseparable`; una tarjeta no tiene simultáneamente `Transitive` e `Intransitive` para el mismo sentido.
- [x] Tags de Prepositions no duplican su `category` y pueden indicar más de una forma de complemento.
- [x] Los chips muestran solamente el valor en inglés, sin prefijo, y no están en el DOM antes de `Reveal`.
- [x] `category`, encabezados de categoría, filtros existentes y Mixed Practice conservan su comportamiento.
- [x] `README.md` documenta el formato y vocabulario de tags.
- [x] `npm run lint`, `npm run typecheck`, `npm run test` y `npm run build` terminan sin errores.

## Decisions

- **Yes:** un campo común `tags` con vocabularios permitidos por `CardType`. Evita campos opcionales específicos por sección y deja que la UI use un solo renderer.
- **Yes:** valores de tags en inglés, sin prefijos visibles y solo en el reverso revelado, siguiendo la decisión de Connectors.
- **Yes:** conservar `category`. Las categorías agrupan tarjetas; los tags agregan características complementarias.
- **Yes:** tags opcionales cuando aporten una distinción fiable; no forzar valores neutros o por defecto.
- **Yes:** describir el sentido demostrado por el ejemplo actual de Phrasal Verbs; no crear tarjetas ni dividir sentidos como parte de esta spec.
- **Yes:** usar tags de Prepositions para forma del complemento, no para repetir el tipo de encabezado que ya es `category`.
- **No:** filtros por tags. Añadirían controles de UI y comportamiento de búsqueda que no se pidieron.
- **No:** habilitar vocabularios de tags en Grammar, Irregular Verbs o Word Formation; no se identificó una distinción que aporte valor en esta fase.

## Risks

| Risk | Mitigation |
| --- | --- |
| Algunas tarjetas de Phrasal Verbs contienen más de un significado y pueden tener comportamientos distintos | Basar el tag en el sentido demostrado por el ejemplo actual; omitirlo si no se puede determinar sin ambigüedad. |
| La separabilidad se puede etiquetar incorrectamente en usos intransitivos | Validar la combinación de tags y revisar los ejemplos durante la migración por tandas. |
| Tags y categorías pueden terminar repitiendo información | Mantener las allowlists complementarias y revisar expresamente que los encabezados de Prepositions sigan siendo categorías, no tags. |

## What is **not** in this spec

- Registro, cortesía y dominio para Idioms, Everyday Phrases y Collocations; se especifican en SPEC 27.
- Tags para Grammar, Irregular Verbs o Word Formation.
- Filtros, búsqueda o mezcla de tarjetas basados en tags.
- Cambio de categorías, ejemplos, traducciones o número de tarjetas.

Cada una de esas ampliaciones, si se decide, va en su propia spec.
