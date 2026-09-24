# SPEC 34 — Filtros útiles y alcance preciso de Mixed

> **Status:** Implementado
> **Depends on:** SPEC 08, SPEC 11, SPEC 30
> **Date:** 2026-09-23
> **Objective:** Retirar el filtro de nivel sin distinciones reales, compartir el modo de orden por URL y describir Mixed Practice según su mazo efectivo.

## Scope

**In:**

- `app/components/FiltersContent.tsx`, `FilterDrawerProvider.tsx`, `SectionPracticeClient.tsx` y `app/word-formation/page.tsx`: ocultar `Level` mientras todos los datos solo permitan `B1-B2`; conservar Category donde exista y Order donde ya esté disponible.
- Mantener el orden elegido en `?order=ordered`; ausencia de `order` equivale a `shuffled`. Los enlaces de categoría preservan el orden y los cambios de orden preservan la categoría.
- Una URL compartida reproduce filtros y modo de orden; el orden concreto de una sesión barajada se restaura desde el almacenamiento de SPEC 30 y no se codifica en la URL. Un `order` inválido vuelve al modo predeterminado.
- Los cambios de selección/reshuffle con sesión activa usan la confirmación de SPEC 30 antes de alterar URL o sesión.
- `app/mixed/page.tsx` y textos asociados: sustituir `All sections shuffled` por una descripción explícita de las seis secciones de vocabulario incluidas; verificar que la portada de SPEC 33 use el mismo alcance. Word Formation, Grammar y Connectors siguen fuera.
- Tests de links, URL inicial, cambios confirmados/cancelados y copy de Mixed.

**Out of scope (for future specs):**

- Clasificar todas las tarjetas como B1 o B2 sin revisión editorial.
- Reemplazar categorías existentes, añadir filtros por tags o búsqueda.
- Incluir Connectors, Word Formation o Grammar en Mixed.
- Cambiar la mecánica de sesiones o la portada fuera de su texto de Mixed.

## Data model

No aparecen datos de contenido nuevos. Se amplía el estado de selección en URL con `order: "ordered" | "shuffled"` (predeterminado `shuffled` si no hay parámetro). La selección guardada por SPEC 30 conserva el modo de orden y el mazo concreto; los parámetros `level` antiguos se ignoran y desaparecen al generar enlaces nuevos.

## Implementation plan

1. Actualizar helpers de URLs y sus tests para conservar `category` y `order`, normalizar valores inválidos y omitir el valor predeterminado. Verificación: enlaces existentes con categoría siguen abriendo la misma sección.
2. Leer/aplicar `order` desde la URL en las rutas con control de orden, manteniendo la permutación de la sesión guardada; verificar refresh y navegación compartida.
3. Vincular cambios de categoría, orden y reshuffle con la confirmación de sesión activa y la actualización de URL solo al confirmar. Verificación: Cancel deja iguales URL, mazo e índice.
4. Retirar control Level de las páginas actuales y adaptar el tratamiento de enlaces viejos con `level`; verificar Category, Order y estado vacío.
5. Ajustar la descripción de la ruta Mixed y verificar la portada para que ambas describan solo seis secciones incluidas. Verificación: lint, typecheck, tests y build.

## Acceptance criteria

- [x] Ninguna sección presenta un filtro Level con una sola opción `B1-B2`; Category y Order conservan sus usos actuales.
- [x] `?order=ordered` muestra orden de archivo y puede compartirse; sin parámetro el modo es shuffled. Un valor inválido no rompe la página.
- [x] Cambiar categoría no borra orden y cambiar orden no borra categoría; los enlaces generados ya no arrastran `level` obsoleto.
- [x] Refresh retoma el mismo orden concreto de una sesión barajada guardada; una visita nueva con el mismo enlace shuffled puede tener otro shuffle.
- [x] Confirmar un cambio inicia otra sesión; Cancel conserva URL, filtros efectivos y sesión anterior.
- [x] Mixed no promete todas las secciones y su mazo no cambia.
- [x] `npm run lint`, `npm run typecheck`, `npm run test` y `npm run build` terminan sin errores.

## Decisions

- **Yes:** ocultar nivel hasta que haya etiquetas B1/B2 fiables por tarjeta, no simular un filtro útil.
- **Yes:** URL para categoría y modo de orden; almacenamiento local para la permutación exacta de cada sesión.
- **No:** sumar secciones incompatibles a Mixed solo para justificar su nombre; corregir el texto es más honesto.

## Risks

| Risk | Mitigation |
| --- | --- |
| URL y sesión guardada difieren tras cancelar una selección | Aplicar navegación y cambios de estado únicamente tras confirmar. |
| Enlaces antiguos incluyen `level` | Ignorar el parámetro sin error y quitarlo en los siguientes enlaces generados. |

## What is **not** in this spec

- Niveles individuales nuevos, nuevos filtros o ampliación del mazo Mixed.
