# SPEC 28 — Ejercicios contextualizados de Word Formation

> **Status:** Implementado
> **Depends on:** SPEC 04, SPEC 07
> **Date:** 2026-09-23
> **Objective:** Reemplazar el hueco ambiguo de Word Formation por un ejercicio curado en contexto y con respuestas aceptadas explícitas para cada familia.

## Why this spec exists

El control actual pide `______ (BASE)` sin oración ni categoría objetivo. Además, compara la respuesta solo con la primera variante del primer campo disponible. Una respuesta correcta puede parecer incorrecta y el ejercicio no comprueba el uso de la palabra.

## Scope

**In:**

- `data/word-formation-b1-b2.md`: añadir una sección `## Ejercicios` con exactamente un ejercicio por familia de la tabla, sin alterar la tabla ni sus contextos existentes.
- Cada ejercicio declara la base, la categoría objetivo (`noun`, `adjective` o `adverb`), una oración inglesa con un único hueco `____` y una lista cerrada de respuestas válidas en ese contexto.
- `src/domain/word-formation.ts`, `src/infrastructure/word-formation-parser.ts` y tests: modelar, analizar y validar ejercicios, vinculados por base; rechazar bases duplicadas/desconocidas, huecos ausentes o múltiples y respuestas vacías con archivo y línea.
- `app/components/WordFormationClient.tsx` y tests: presentar oración y categoría antes de revelar; comprobar cualquiera de las respuestas declaradas, con el mismo criterio de normalización actual (espacios y mayúsculas); conservar la revelación de la familia completa.
- `README.md`: documentar cómo redactar y revisar un ejercicio.

**Out of scope (for future specs):**

- Sesiones cortas, progreso y repaso (SPEC 31).
- Generar huecos automáticamente a partir de las formas o ejemplos existentes.
- Exigir ejercicios separados para todas las formas de una familia.
- Cambiar los datos de Grammar o de las otras secciones.

## Data model

```ts
type WordFormationExercise = {
  target: "noun" | "adjective" | "adverb";
  sentenceEn: string; // exactamente una aparición de ____
  acceptedAnswers: string[]; // al menos una, sin duplicados tras normalizar
};

type WordFamily = {
  // Campos existentes.
  exercise: WordFormationExercise;
};
```

Formato nuevo, debajo de la tabla y de las secciones existentes:

```md
## Ejercicios
- **Base:** act --- **Target:** noun --- **Sentence (EN):** The committee took immediate ____. --- **Answers:** action
```

El parser reconoce la lista de respuestas separadas por ` / `; el separador no forma parte de una respuesta. La categoría objetivo debe existir en la familia y cada respuesta aceptada debe estar entre las variantes declaradas en esa categoría. El único hueco admitido es exactamente `____`.

## Implementation plan

1. Añadir el tipo y la validación del ejercicio con tests de dominio; mantener temporalmente `exercise` opcional mientras se cura el archivo existente. Verificación: carga de todas las familias actuales.
2. Añadir parseo de `## Ejercicios` y vinculación por base, con errores localizados y tests para respuestas múltiples, objetivos inválidos, huecos y duplicados. Verificación: parser anterior sigue funcionando sin la sección nueva.
3. Cambiar la pregunta y la corrección de `WordFormationClient` para usar el ejercicio cuando exista; conservar temporalmente el flujo anterior en familias aún no migradas. Verificación: test de una oración que acepta dos variantes y rechaza una forma de otra categoría.
4. Curar una entrada por cada familia del archivo, en tandas alfabéticas A–F, G–M, N–S y T–Z; verificar por tanda que las entradas migradas cargan y muestran un hueco inequívoco.
5. Requerir `exercise` para toda familia al finalizar la migración y retirar el fallback `______ (BASE)` y la comprobación de la primera variante. Documentar sintaxis y criterio editorial en `README.md`. Verificación: parser y UI rechazan familias sin ejercicio y pasan lint, typecheck, tests y build.

## Acceptance criteria

- [ ] Cada familia del archivo real tiene exactamente un ejercicio y la tabla original sigue siendo legible.
- [ ] Antes de revelar se ve una oración con un hueco y la categoría solicitada, sin respuestas visibles.
- [ ] Se aceptan todas las variantes declaradas para esa oración y ninguna forma ajena a `acceptedAnswers`.
- [ ] La validación rechaza una familia sin ejercicio, bases repetidas/desconocidas, objetivos inexistentes, más o menos de un hueco y respuestas vacías o no presentes en la categoría correspondiente.
- [ ] Los errores editoriales identifican archivo y línea; al revelar siguen apareciendo la familia, ejemplos y pista existentes.
- [ ] `npm run lint`, `npm run typecheck`, `npm run test` y `npm run build` terminan sin errores.

## Decisions

- **Yes:** una oración curada por familia. Da cobertura completa sin multiplicar ejercicios ambiguos.
- **Yes:** sección Markdown separada y respuestas aceptadas por ejercicio. Conserva la tabla y evita inferir que todas sus variantes funcionan en una misma oración.
- **No:** autocorrección gramatical libre o generación automática de oraciones. No permiten una comprobación fiable con los datos actuales.

## Risks

| Risk | Mitigation |
| --- | --- |
| Una oración admite más de una forma natural | Declarar todas las respuestas válidas; cambiar la oración si no se puede delimitar el conjunto. |
| La migración de todas las familias es extensa | Migrar por rangos alfabéticos con parser compatible hasta activar la obligatoriedad final. |

## What is **not** in this spec

- Persistencia, autoevaluación, repaso o sesiones.
- Ejercicios generados automáticamente ni más de uno por familia.
