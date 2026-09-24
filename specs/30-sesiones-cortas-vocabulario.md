# SPEC 30 — Sesiones cortas y repaso de vocabulario

> **Status:** Implementado
> **Depends on:** SPEC 05, SPEC 06, SPEC 08, SPEC 29
> **Date:** 2026-09-23
> **Objective:** Convertir las tarjetas de vocabulario en sesiones retomables de hasta 10 ítems con autoevaluación y repaso voluntario de las dificultades.

## Why this spec exists

Reveal y Next permiten recorrer un mazo, pero no registran qué costó ni ofrecen una conclusión útil. La sesión corta reemplaza el recorrido completo como modo principal y crea una base reutilizable para Word Formation y Grammar.

## Scope

**In:**

- `src/application/session.ts` o módulos vecinos: seleccionar hasta 10 tarjetas del mazo filtrado, mantener orden fijo durante la sesión y representar fase inicial, repaso y resumen.
- `src/infrastructure/ui/` y tests: guardar una sesión por ruta y las evaluaciones por tarjeta en `localStorage` versionado; si no está disponible, practicar en memoria sin interrumpir la experiencia.
- Identificar tarjetas por referencia estable en su sección y huella de contenido. Descartar una sesión si cualquiera de sus referencias ya no existe o cambió; invalidar solo las evaluaciones de ítems afectados.
- `app/components/FlashcardClient.tsx`, `SectionPracticeClient.tsx`, `FilterDrawerProvider.tsx`, `FiltersContent.tsx` y estilos: solicitar Reveal antes de autoevaluar con `I knew it`, `Almost`, `I didn't know`; ofrecer `Skip` sin revelar, resumen al terminar y `Review pending` para `Almost`, `I didn't know` y omitidas.
- `Previous` permite volver a un ítem anterior del mismo tramo; al volver se oculta su respuesta y, si se cambia su evaluación, se conserva el último resultado. Cada ronda requiere acción explícita para comenzar; después de cada ronda se muestra un nuevo resumen y se puede repetir.
- Confirmar `Start new session` antes de reemplazar la sesión activa al cambiar filtros u orden. Cancelar mantiene ruta, selección y estado previos. El resumen permite empezar otra sesión, sin confirmación destructiva.
- Las rutas de vocabulario `/phrasal-verbs`, `/collocations`, `/prepositions`, `/idioms`, `/irregular-verbs`, `/everyday-phrases`, `/connectors` y `/mixed`; Word Formation y Grammar se integran en SPEC 31 y 32.

**Out of scope (for future specs):**

- Integrar Word Formation y Grammar en esta implementación (SPEC 31 y 32).
- Repetición espaciada por días, cuentas, servidor, estadísticas históricas y escritura/corrección automática de ejemplos.
- Cambiar el contenido o la composición de Mixed Practice.
- Rediseñar la portada (SPEC 33) o cambiar el query param del orden (SPEC 34).

## Data model

```ts
type PracticeRating = "known" | "almost" | "unknown" | "skipped";
type PracticeItemRef = {
  kind: "vocabulary" | "word-formation" | "grammar";
  id: string;          // vocabulario: archivo + categoría + expresión + ocurrencia homónima
  fingerprint: string; // huella de pregunta, respuesta, ejemplo y traducción actuales
};
type PracticeSession = {
  route: string;
  items: PracticeItemRef[]; // hasta 10 en ronda inicial; referencias fijas
  reviewItems: PracticeItemRef[];
  index: number;
  phase: "initial" | "review" | "summary";
  ratings: Record<string, PracticeRating>;      // última evaluación por ítem
  roundRatings: Record<string, PracticeRating>; // avance de la ronda actual
  selection: { level?: string; category?: string; order: "ordered" | "shuffled" };
  updatedAt: number;
};
```

Una clave versionada `practicaeng:practice:v1` contiene sesiones por ruta, última ruta activa y evaluaciones por `kind:id` con su huella. Para vocabulario, `id` combina archivo, categoría, expresión normalizada y ordinal solo entre homónimos de esa combinación; insertar una tarjeta diferente no modifica los IDs previos. Nunca usa la posición después del shuffle. `roundRatings` se vacía al iniciar cada repaso; `ratings` conserva el último resultado para el resumen. La lectura valida forma y referencias contra el contenido vigente; una sesión con una referencia ausente o una huella distinta se descarta, mientras las demás sesiones/evaluaciones válidas permanecen. La tarjeta restaurada siempre aparece sin respuesta, incluso si antes se había revelado.

## Implementation plan

1. Crear selección pura de hasta 10 referencias y transiciones de fase/resultado, con tests de mazos vacíos, cortos, omitidos y rondas sucesivas. Verificación: flujos existentes continúan cargando.
2. Añadir identificadores y huellas estables para tarjetas de vocabulario, sin modificar el Markdown; probar edición, inserción de una tarjeta distinta y cambio de orden barajado. Verificación: las referencias no afectadas resuelven el mismo contenido.
3. Añadir lectura/escritura versionada con validación y fallback en memoria; probar storage ausente, corrupto y contenido cambiado. Verificación: sin efectos en render de servidor.
4. Integrar selección inicial, reanudación oculta y progreso de sesión en `SectionPracticeClient`/`FlashcardClient`. Verificación: una sección con más de 10 muestra 10 y recarga en el mismo índice.
5. Añadir Reveal, autoevaluación y Skip; mantener Previous/Next dentro de la ronda. Verificación: no se puede marcar conocida una respuesta aún oculta; Skip entra en pendientes.
6. Añadir resumen y una ronda de repaso iniciada a pedido; tras la ronda volver al resumen y permitir otra con los resultados actualizados. Verificación: solo regresan `almost`, `unknown` y `skipped`.
7. Agregar confirmación para filtros y orden mientras haya sesión activa; Cancel no modifica URL ni almacenamiento. Verificación: cambio confirmado inicia sesión nueva con la selección pedida.
8. Revisar teclado, lector de pantalla y estados sin tarjetas/almacenamiento. Verificación: lint, typecheck, tests y build.

## Acceptance criteria

- [ ] Entrar a una ruta de vocabulario inicia o retoma una sesión de `min(10, tarjetas disponibles)`; `/mixed` conserva su conjunto actual.
- [ ] La respuesta no está visible antes de Reveal; solo entonces aparecen las tres calificaciones. Skip no revela la respuesta y queda pendiente.
- [ ] El orden del mazo no cambia durante la sesión; Previous oculta de nuevo la respuesta y la última evaluación de cada tarjeta es la vigente.
- [ ] Al acabar se ven cantidades por resultado; `Review pending` aparece cuando hay pendientes y comienza una ronda solo al pulsarlo.
- [ ] Al finalizar cada repaso reaparece el resumen; se puede iniciar otra ronda de pendientes, sin bucle automático.
- [ ] Recargar conserva ruta, orden, filtros, índice, fase y resultados; la tarjeta restaurada queda oculta.
- [ ] Hay una sesión independiente por ruta; si una referencia cambió, se descarta solo la sesión afectada y la evaluación obsoleta.
- [ ] Cambiar filtros u orden pide confirmación; Cancel conserva sesión y URL; el navegador sin localStorage permite terminar la sesión en memoria.
- [ ] `npm run lint`, `npm run typecheck`, `npm run test` y `npm run build` terminan sin errores.

## Decisions

- **Yes:** 10 tarjetas como máximo y una sesión por ruta, con la última como candidata a `Continue` en la portada.
- **Yes:** `localStorage` versionado, ID más huella y fallback en memoria. No requiere cuentas ni base de datos.
- **Yes:** autoevaluación después de Reveal y omisión explícita. Se repasa a pedido, una ronda por clic.
- **No:** recorrido completo paralelo, SRS temporal ni puntuación automática de una oración inventada.
- **No:** persistir el contenido completo anterior si se edita el Markdown; la sesión afectada se invalida.

## Risks

| Risk | Mitigation |
| --- | --- |
| Un cambio de filtros borra progreso accidentalmente | Confirmación con Cancel antes de sustituir el mazo y actualizar la URL. |
| Datos locales obsoletos o no disponibles | Validar esquema y huellas; reiniciar solo lo inválido y seguir en memoria. |

## What is **not** in this spec

- Integración de familias de palabras, ejercicios de Grammar, portada, niveles nuevos o SRS.
