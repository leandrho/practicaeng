# SPEC 33 — Portada para empezar y retomar prácticas

> **Status:** Implementado
> **Depends on:** SPEC 10, SPEC 30, SPEC 31, SPEC 32
> **Date:** 2026-09-23
> **Objective:** Rediseñar la portada para empezar, retomar y elegir una práctica con una jerarquía clara sin abandonar la identidad visual actual.

## Why this spec exists

La portada actual da el mismo protagonismo a muchas tarjetas de sección, mientras la distribución de contenido ocupa espacio sin ayudar a elegir una acción. Las sesiones aportan una entrada concreta y un estado local que la portada puede mostrar sin convertirse en un panel de estadísticas.

## Scope

**In:**

- `app/page.tsx` y componentes de portada en `app/components/`: nuevo hero con CTA principal `Practice 10 cards` hacia `/mixed`, CTA `Continue` a la última sesión activa válida y acceso directo a repasar dificultades cuando existan. Entrar a `/mixed` retoma su sesión si ya existe, sin reemplazarla silenciosamente.
- Primer uso sin progreso local: CTA principal visible y catálogo accesible de inmediato; sin tutorial ni explicación extensa previa.
- Catálogo reorganizado: tras el hero, una franja `Choose a path` con Mixed, Grammar y Word Formation; luego `Browse vocabulary` con las siete secciones individuales. Grammar permanece claramente separado de las tarjetas de vocabulario.
- Resumen local breve con última sesión y cantidad de ítems pendientes/difíciles, sin rachas, porcentajes de dominio ni resultados históricos.
- Corregir las descripciones de Mixed en la portada para nombrar solo las secciones que realmente incluye; retirar la barra de distribución y el texto repetido del ciclo de aprendizaje.
- `app/globals.css`, tests de portada y accesibilidad: evolución del sistema actual (paleta, tipografía y temas existentes), composición legible en móvil y escritorio, foco visible y carga estable mientras se lee `localStorage`.

**Out of scope (for future specs):**

- Rehacer la identidad global, el header, la interfaz de práctica o las páginas internas.
- Tutorial interactivo, personalización por IA, rachas o panel histórico de estadísticas.
- Alterar composición de Mixed, persistencia o mecánicas definidas en SPEC 30–32.

## Data model

No se introduce almacenamiento nuevo. La portada lee las sesiones por ruta, la última ruta activa y las evaluaciones vigentes del esquema versionado de SPEC 30. `Continue` solo se muestra si la sesión es válida y tiene una ronda en curso o pendientes de repaso; el cómputo de dificultades usa las últimas evaluaciones vigentes, sin sumar intentos repetidos de un mismo ítem.

## Implementation plan

1. Crear un selector de estado de portada a partir del almacenamiento compartido y probar primer uso, última sesión completa, sesión inválida y pendientes de repaso. Verificación: portada actual continúa renderizando del lado del servidor.
2. Integrar CTA de inicio y continuación con una región que reserve espacio mientras se carga el estado local, sin desajustes de hidratación. Verificación: enlaces llevan a la ruta correcta y nunca muestran una sesión invalidada.
3. Reorganizar catálogo y rutas guiadas conservando todos los destinos actuales, con descripciones precisas. Verificación: todas las secciones siguen alcanzables en teclado y móvil.
4. Aplicar composición y jerarquía nuevas solo a la portada y retirar distribución/duplicaciones; comprobar temas claro y oscuro, tamaños 320px y escritorio. Verificación: lint, typecheck, tests y build.

## Acceptance criteria

- [ ] Sin datos locales, `Practice 10 cards` abre `/mixed`; con sesión Mixed previa la retoma sin borrarla. Todas las secciones siguen accesibles sin completar un tutorial.
- [ ] Con una sesión válida interrumpida, `Continue` lleva a la última ruta activa; una sesión inválida o cerrada no genera un enlace roto.
- [ ] El resumen local muestra última sesión y pendientes sin afirmar porcentajes ni rachas; funciona también con almacenamiento deshabilitado.
- [ ] La portada ya no muestra la barra de distribución ni afirma que Mixed contiene Word Formation o Connectors.
- [ ] El orden del DOM y de tabulación es hero → `Choose a path` → `Browse vocabulary`; los tres grupos son navegables con teclado y no hay overflow horizontal a 320px en ambos temas.
- [ ] `npm run lint`, `npm run typecheck`, `npm run test` y `npm run build` terminan sin errores.

## Decisions

- **Yes:** rediseño completo de composición de portada, pero evolución de la identidad actual.
- **Yes:** rutas guiadas más catálogo completo; entrar directamente al mazo es la opción principal del primer uso.
- **Yes:** mostrar únicamente última sesión y dificultades locales útiles para decidir qué practicar.
- **No:** tutorial, dashboard exhaustivo ni eliminación de secciones del catálogo.

## Risks

| Risk | Mitigation |
| --- | --- |
| El servidor no conoce localStorage y renderiza un CTA distinto al cliente | Render inicial estable y región reservada; leer sesiones solo después del montaje. |
| Una sesión de otra sección fue invalidada por cambios editoriales | Validar referencias antes de mostrar `Continue` y ofrecer inicio nuevo si falla. |

## What is **not** in this spec

- Rediseño del resto del sitio, cambios de mazos, tutorial o estadísticas históricas.
