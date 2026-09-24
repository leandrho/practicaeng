# SPEC 31 — Sesiones y repaso de Word Formation

> **Status:** Implementado
> **Depends on:** SPEC 28, SPEC 30
> **Date:** 2026-09-23
> **Objective:** Integrar los ejercicios contextualizados de Word Formation en sesiones retomables con repaso automático de errores y omisiones.

## Scope

**In:**

- `app/components/WordFormationClient.tsx`, `app/word-formation/page.tsx` y tests: sustituir el recorrido completo por una sesión de hasta 10 familias según filtros, usando el ejercicio de SPEC 28.
- Reutilizar almacenamiento, resumen y rondas voluntarias de SPEC 30 para la ruta `/word-formation`; conservar índice, orden y resultados al recargar, con respuesta oculta al retomar.
- Una comprobación correcta sin fallos anteriores marca `known`; cualquier intento incorrecto marca el ítem `unknown` para repaso incluso si luego se acierta. `Reveal family` sin acierto también lo marca `unknown` y `Skip` antes de revelar lo deja `skipped`.
- Mantener la familia completa y los ejemplos disponibles tras Reveal; mostrar un resultado claro de la comprobación y permitir volver a intentar antes de avanzar.

**Out of scope (for future specs):**

- Autoevaluación adicional después de Check; las calificaciones derivan de los intentos.
- Agregar más ejercicios por familia o cambiar sus respuestas curadas (SPEC 28).
- Integración de Grammar (SPEC 32) y cambios a Mixed Practice.

## Data model

Se reutilizan `PracticeSession`, `PracticeRating` y `PracticeItemRef` de SPEC 30. Para esta ruta, `kind` es `word-formation`, `id` es la base normalizada y `fingerprint` incluye oración, objetivo y respuestas aceptadas. La sesión agrega `attempts: Record<string, { hadIncorrectAttempt: boolean }>` para conservar por ítem la dificultad aunque se recargue antes de avanzar. La evaluación se decide al concluir el ejercicio.

## Implementation plan

1. Extender referencias y validación de sesiones a familias con tests para ejercicio modificado, familia retirada y filtro vigente. Verificación: sesiones de vocabulario siguen cargando.
2. Adaptar la selección de hasta 10 familias y el guardado de índice/intentos a `/word-formation`; conservar el frente sin revelar al volver. Verificación: recarga mantiene el estado y no muestra respuestas.
3. Registrar primer acierto, error previo, Reveal sin acierto y Skip con tests de transición; mantener la corrección con respuestas curadas. Verificación: fallar y luego acertar conserva `unknown`.
4. Conectar resumen y ronda voluntaria de pendientes con la UI compartida; revisar estados sin familias y navegación por teclado. Verificación: lint, typecheck, tests y build.

## Acceptance criteria

- [x] Word Formation practica hasta 10 familias por sesión y mantiene filtro, índice, orden y estado en recarga; la respuesta reaparece oculta.
- [x] Primer acierto sin fallos se clasifica `known`; fallar y luego acertar se clasifica `unknown`.
- [x] Reveal sin acierto se clasifica `unknown`; Skip sin revelar se clasifica `skipped` y no muestra la solución.
- [x] Solo los ejercicios `unknown` y `skipped` vuelven en el repaso; tras cada ronda aparece un nuevo resumen.
- [x] Cambiar filtros con una sesión activa pide confirmación y Cancel conserva la sesión actual.
- [x] `npm run lint`, `npm run typecheck`, `npm run test` y `npm run build` terminan sin errores.

## Decisions

- **Yes:** evaluación automática a partir de intentos, sin pedir otra nota a quien ya resolvió el hueco.
- **Yes:** un error inicial cuenta como dificultad aunque después se corrija; la repetición sirve para consolidar.
- **No:** mezclar familias con vocabulario en `/mixed`; requieren un frente y comprobación diferentes.

## Risks

| Risk | Mitigation |
| --- | --- |
| Un intento fallido se pierde al refrescar | Persistir `hadIncorrectAttempt` en la sesión validada. |

## What is **not** in this spec

- Nuevos ejercicios, autoevaluación redundante, Grammar o mezcla con otras secciones.
