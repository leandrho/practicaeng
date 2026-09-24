# SPEC 32 — Sesiones y repaso de Grammar

> **Status:** Implementado
> **Depends on:** SPEC 22, SPEC 30
> **Date:** 2026-09-23
> **Objective:** Convertir los ejercicios de cada tema de Grammar en una sesión retomable con autoevaluación y repaso voluntario dentro del mismo tema.

## Scope

**In:**

- `app/components/GrammarPracticeClient.tsx`, `app/grammar/[part]/[topic]/page.tsx` y tests: reutilizar la sesión de SPEC 30 dentro de cada tema, en el orden de ejercicios existente y con un máximo de 10; si hay 5 ejercicios, la sesión tiene 5.
- Guardar una sesión distinta por ruta `/grammar/parte-N/slug`, con respuesta oculta al retomar; validar la huella del prompt, modelo, explicación y traducción.
- Tras `Reveal`, mostrar `I knew it`, `Almost`, `I didn't know` para comparar la oración producida mentalmente o en voz alta con el modelo; `Skip` deja el ejercicio pendiente sin mostrar el modelo.
- Resumen y repaso a pedido de `almost`, `unknown` y `skipped`; teoría siempre disponible por encima de la práctica, sin incluirla en la evaluación.

**Out of scope (for future specs):**

- Comparación automática de frases libres, campo de escritura, puntuación de teoría o mezcla de temas diferentes.
- Cambios a los contenidos gramaticales de `data/grammar-part-*.md`.
- Agregar ejercicios para alcanzar exactamente 10 por tema.

## Data model

Se reutilizan `PracticeSession`, `PracticeRating` y `PracticeItemRef` de SPEC 30. `kind` es `grammar`; `id` combina número de parte, slug de tema y posición del ejercicio en el tema; `fingerprint` incluye prompt, modelo, explicación y traducción. Un cambio del ejercicio invalida la sesión afectada conforme a SPEC 30.

## Implementation plan

1. Crear referencias y selección acotada de ejercicios dentro del tema, con tests de temas con menos de 10 y cambios de contenido. Verificación: la teoría y los enlaces existentes siguen cargando.
2. Integrar persistencia de índice/fase por ruta y reanudación con modelo oculto en `GrammarPracticeClient`. Verificación: refrescar no muestra el modelo antes de Reveal.
3. Añadir Skip, calificaciones posteriores a Reveal y navegación dentro de la ronda; probar que no se registra acierto sin comparar con el modelo.
4. Agregar resumen y repaso voluntario solo del tema actual; verificar teclado, accesibilidad y estados vacíos. Verificación: lint, typecheck, tests y build.

## Acceptance criteria

- [ ] Cada tema conserva su teoría y practica únicamente sus propios ejercicios, en el orden actual y con un máximo de 10.
- [ ] Una sesión de un tema no sobrescribe la de otro; recargar restaura índice, fase y resultados con modelo oculto.
- [ ] Las calificaciones aparecen solo después de Reveal; Skip no revela y queda pendiente.
- [ ] El resumen cuenta conocidos, casi, desconocidos y omitidos; `Review pending` se ofrece solo si corresponde y cada ronda termina en un resumen nuevo.
- [ ] No hay verificación automática de la frase producida mentalmente ni mezcla de ejercicios de temas distintos.
- [ ] `npm run lint`, `npm run typecheck`, `npm run test` y `npm run build` terminan sin errores.

## Decisions

- **Yes:** una sesión por tema y orden pedagógico existente; 10 es un máximo, no una cuota artificial.
- **Yes:** autoevaluación tras leer el modelo; distintas oraciones correctas pueden expresar la misma estructura.
- **No:** corrección automática ni campos de escritura libre en esta fase.

## Risks

| Risk | Mitigation |
| --- | --- |
| Repetir ejercicios del tema puede volver a mostrar el modelo por un estado heredado | Resetear Reveal al mover, iniciar repaso y recuperar sesión. |

## What is **not** in this spec

- Edición de teoría, generación de más ejercicios, escritura libre o sesiones entre temas.
