# SPEC 27 — Tags de registro y uso social en Idioms, Everyday Phrases y Collocations

> **Status:** Implementado
> **Depends on:** SPEC 26
> **Date:** 2026-09-23
> **Objective:** Extender `Card.tags` a Idioms, Everyday Phrases y Collocations con etiquetas de registro, canal, cortesía y ámbito cuando aporten información útil.

## Why this spec exists

Estas secciones tienen matices de uso social y de contexto que ayudan a elegir una expresión apropiada. Los tags deben ser selectivos: no todas las expresiones necesitan una etiqueta y las categorías actuales continúan cumpliendo su función de agrupamiento.

## Scope

**In:**

- `src/domain/card.ts`: extender la allowlist de tags por tipo para `idiom`, `everyday-phrase` y `collocation`, reusando `Card.tags` de SPEC 26.
- `src/infrastructure/markdown-parser.ts`: validar los tags permitidos según el tipo de tarjeta; mantener el campo opcional cuando un tag no aporte valor.
- `data/idioms-b1-b2.md`: curar tags de registro y canal cuando ayuden a elegir o producir la expresión.
- `data/everyday-phrases-b1-b2-150.md`: curar tags de registro/canal y `Polite` cuando la cortesía sea una propiedad útil de la frase.
- `data/collocations-b1-b2.md`: curar tags de registro/canal y de ámbito (`Work`, `Academic`, `Daily life`) cuando sean claros y distintivos.
- Tests de dominio, parser y loader para vocabularios por sección, tags opcionales y todos los datos reales migrados.
- `README.md`: documentar los valores y los criterios editoriales de estas tres secciones.

**Out of scope (for future specs):**

- Cambiar la representación común, el renderer de chips o las secciones Phrasal Verbs, Prepositions y Connectors (SPEC 26).
- Tags para Grammar, Irregular Verbs o Word Formation.
- Reemplazar categorías existentes o cambiar los grupos de Everyday Phrases y Collocations.
- Tags de situación libres, nuevos dominios fuera de la lista cerrada o filtros/búsqueda por tags.
- Cambios en significados, ejemplos, traducciones o cantidad de tarjetas.

## Data model

Se reutiliza `Card.tags: CardTag[]` de SPEC 26; no se agrega otra estructura. Se extiende `CardTag` y la allowlist por sección con:

```ts
type AdditionalCardTag =
  | "Polite"
  | "Work"
  | "Academic"
  | "Daily life";
```

`CardTag` de SPEC 26 incorpora estos cuatro valores adicionales; `Card.tags` no cambia de forma.

Allowlist editorial:

- `idiom`: registro y canal. Usar `Formal`, `Neutral`, `Informal`, `Spoken`, `Written` o `Spoken & written` únicamente cuando distingan el uso de la expresión.
- `everyday-phrase`: los mismos tags de registro/canal y `Polite` cuando la cortesía ayude a escoger la frase. `Polite` no se asigna por el mero hecho de que la frase sea una pregunta.
- `collocation`: registro/canal cuando aporten una diferencia real; `Work`, `Academic` o `Daily life` cuando el ámbito sea claro y útil.

La autoría reutiliza el campo común introducido en SPEC 26:

```md
- **...** --- ... --- *...* --- *Tags: Informal, Spoken*
- **...** --- ... --- *Tags: Polite*
- **...** --- ... --- *Tags: Academic*
```

El campo se omite si no hay una etiqueta útil. Los valores se guardan y muestran en inglés, como chips sin prefijo al revelar la tarjeta. `category` y sus encabezados permanecen intactos.

## Implementation plan

1. `src/domain/card.ts` y `src/domain/card.test.ts`: extender `CardTag` y las allowlists para `idiom`, `everyday-phrase` y `collocation`; probar tags válidos, no permitidos y vacío. Verificación: contenido actual todavía carga sin tags.
2. `data/idioms-b1-b2.md`: revisar sus 35 expresiones e incluir únicamente registro/canal que ayude a usarlas; mantener sin cambios significado, ejemplo, traducción y contexto. Verificación: parser y loader del archivo real en verde.
3. `data/everyday-phrases-b1-b2-150.md`: revisar y migrar una categoría existente por paso, manteniendo sus 25 tarjetas: `Greetings & socializing`, `Courtesy & requests`, `Home & daily routine`, `Shopping, food & services`, `Travel & directions`, `Work, plans & problems`. Aplicar `Polite` solo cuando la cortesía sea una característica distintiva. Verificación por paso: conteo de la categoría, parseo y revisión de tags.
4. `data/collocations-b1-b2.md`: revisar y migrar los encabezados `MAKE`, `DO`, `HAVE / TAKE / GET`, `ADJECTIVE + NOUN` y `ADVERB + ADJECTIVE`. Usar `Work`, `Academic` o `Daily life` solo si el dominio aporta una distinción útil; conservar encabezados y conteos. Verificación por paso: parser, loader y conteo por encabezado.
5. `README.md`: documentar la allowlist por sección, el criterio para omitir tags y su visualización en inglés al revelar. Verificación: `npm run lint`, `npm run typecheck`, `npm run test` y `npm run build`.

## Acceptance criteria

- [ ] `Card.tags` y el renderer común de SPEC 26 se reutilizan sin agregar campos por sección.
- [ ] Idioms solo reciben tags de registro/canal cuando aclaran el uso de la expresión.
- [ ] Everyday Phrases recibe tags de registro/canal cuando aporten y `Polite` solo cuando la cortesía sea relevante.
- [ ] Collocations usa únicamente los ámbitos permitidos `Work`, `Academic` y `Daily life`, y solo cuando el dominio sea claro.
- [ ] Las tarjetas sin distinción útil conservan `tags: []`; no se asignan valores por defecto como `Neutral` o `Spoken & written` para completar el campo.
- [ ] Se revisaron las 35 tarjetas de Idioms, las 150 de Everyday Phrases y las 50 de Collocations; sus cantidades, categorías y encabezados se mantienen.
- [ ] El parser rechaza tags fuera de la allowlist de cada tipo con archivo y línea.
- [ ] Los tags se muestran en inglés, sin prefijos y solo después de `Reveal`; no aparecen en el frente.
- [ ] No se reemplaza ni se duplica `category` con tags.
- [ ] `README.md` documenta las etiquetas y el criterio editorial.
- [ ] `npm run lint`, `npm run typecheck`, `npm run test` y `npm run build` terminan sin errores.

## Decisions

- **Yes:** SPEC 27 depende de SPEC 26 y amplía el mismo `Card.tags`; no crea un mecanismo paralelo.
- **Yes:** tags de registro y canal se aplican solo si añaden una distinción de uso, sin forzar `Neutral` o `Spoken & written` como valores predeterminados.
- **Yes:** `Polite` es el único tag adicional de cortesía y se limita a Everyday Phrases cuando describe una propiedad útil.
- **Yes:** los dominios de Collocations son una lista corta y cerrada: `Work`, `Academic`, `Daily life`.
- **Yes:** conservar categorías existentes; los tags son metadatos complementarios.
- **No:** tags libres de situación o un vocabulario de dominios ampliable en esta spec. Evita que los datos se vuelvan inconsistentes y duplicados.
- **No:** etiquetas gramaticales de Phrasal Verbs o Prepositions; corresponden a SPEC 26.

## Risks

| Risk | Mitigation |
| --- | --- |
| El juicio sobre formalidad, cortesía o ámbito puede variar | Documentar el criterio por sección y omitir el tag ante duda, en vez de forzar una clasificación. |
| Los tags pueden repetir las categorías actuales | Revisar encabezados y filtros durante la migración; `category` conserva su función de agrupamiento. |
| Aplicar tags en masa puede alterar accidentalmente contenido editorial | La migración se hace por sección/categoría y verifica conteos, ejemplos y traducciones en cada paso. |

## What is **not** in this spec

- Cambios al modelo o UI común de tags, a Phrasal Verbs, Prepositions o Connectors.
- Tags para Grammar, Irregular Verbs o Word Formation.
- Tags libres, filtros o búsqueda por tags.
- Cambios a categorías, significados, ejemplos, traducciones o conteos.

Cada una de esas ampliaciones, si se decide, va en su propia spec.
