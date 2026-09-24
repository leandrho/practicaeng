# SPEC 29 — Atajos y panel de filtros accesibles

> **Status:** implementado
> **Depends on:** SPEC 06, SPEC 07, SPEC 11, SPEC 22
> **Date:** 2026-09-23
> **Objective:** Evitar que los atajos de práctica intercepten controles y mantener el foco correctamente dentro del panel modal de filtros.

## Scope

**In:**

- `app/components/FlashcardClient.tsx` y `app/components/WordFormationClient.tsx`: aplicar Espacio/Flechas únicamente cuando el foco no está en un control interactivo, editable o diálogo; conservar los botones visibles como alternativa.
- `app/components/GrammarPracticeClient.tsx`: mantener su interacción por botones sin agregar atajos que capturen controles.
- `app/components/FilterDrawerProvider.tsx`: al abrir, enfocar el cierre; contener Tab/Shift+Tab en el panel, impedir interacción con el contenido de fondo, cerrar con Escape y devolver foco al disparador.
- `app/globals.css`: evitar que el scroll del panel propague al documento y asegurar que los controles enfocados sean visibles en pantallas pequeñas.
- Tests de teclado para las tres pantallas de práctica y para el ciclo completo del diálogo.

**Out of scope (for future specs):**

- Cambiar los filtros, su URL o el modo Ordered/Shuffled (SPEC 34).
- Atajos configurables, tutorial de teclado o rediseño del panel.
- Cambiar navegación o respuestas pedagógicas de las tarjetas.

## Data model

Esta mejora no introduce estructuras de datos nuevas; corrige la gestión de eventos y foco existentes.

## Implementation plan

1. Extraer una condición comprobable para ignorar eventos de teclado provenientes de botones, enlaces, inputs, textareas, selects, elementos editables y diálogos abiertos; añadir tests. Verificación: los atajos siguen funcionando con foco en el contenido de la tarjeta.
2. Aplicarla a la flashcard y Word Formation; verificar Espacio sobre Reveal, ES, Check y controles del header, y Flechas dentro de campos. Verificación: solo se activa el control enfocado.
3. Implementar gestión modal de foco y fondo en `FilterDrawerProvider`, con limpieza al cerrar/desmontar y retorno al disparador; añadir tests de Tab, Shift+Tab, Escape y clic en overlay. Verificación: no se alcanza el fondo por teclado mientras el panel está abierto.
4. Ajustar estilos de scroll y visibilidad de foco y hacer una pasada manual en móvil y escritorio. Verificación: lint, typecheck, tests y build.

## Acceptance criteria

- [ ] Espacio sobre un botón enfocado activa ese botón sin revelar otra tarjeta por el atajo global.
- [ ] Flechas/Espacio dentro de campos, enlaces, selects, contenido editable o filtros abiertos no cambian tarjeta ni estado de Word Formation.
- [ ] Con foco no interactivo en la tarjeta, los atajos existentes funcionan; no aparece un atajo nuevo en Grammar.
- [ ] Tab y Shift+Tab no salen del diálogo abierto; Escape y el overlay lo cierran y devuelven foco al disparador.
- [ ] El panel permite desplazarse en viewport pequeño sin desplazar la página de fondo.
- [ ] `npm run lint`, `npm run typecheck`, `npm run test` y `npm run build` terminan sin errores.

## Decisions

- **Yes:** conservar atajos donde ayudan a estudiar, pero no cuando compiten con un control o con un diálogo.
- **Yes:** tratar el panel como un modal real, coherente con su `role="dialog"` y `aria-modal="true"` actuales.
- **No:** eliminar toda interacción por teclado ni agregar preferencias de atajos.

## Risks

| Risk | Mitigation |
| --- | --- |
| El foco vuelve a un disparador que desapareció durante la navegación | Enfocar el disparador solo si sigue conectado; en caso contrario, enfocar el encabezado o contenido principal. |

## What is **not** in this spec

- Cambios en el contenido, la mecánica de práctica o los filtros.
