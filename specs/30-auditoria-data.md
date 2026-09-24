# SPEC 30 — Auditoría editorial gradual del contenido

> **Status:** Implementado
> **Depends on:** SPEC 28, SPEC 22, SPEC 24, SPEC 27
> **Date:** 2026-09-23
> **Objective:** Revisar todo el contenido educativo por archivo y corregir errores verificables de lengua, significado y contexto sin sumar material nuevo.

## Why this spec exists

El volumen de tarjetas y temas ya es amplio. Antes de expandirlo conviene comprobar que cada significado corresponde a su ejemplo, que el inglés es natural y que las traducciones y fuentes no contradicen el uso enseñado.

## Scope

**In:**

- Auditar los siete archivos Markdown de vocabulario, `data/word-formation-b1-b2.md` y `data/grammar-part-1.md` a `data/grammar-part-8.md`; revisar texto, ejemplos, traducciones, tags, respuestas de ejercicios y contexto donde corresponda.
- Corregir erratas y desajustes confirmados manteniendo el formato, la intención pedagógica y el número de tarjetas/temas. Investigar, entre otros casos, `Nevo mucho` en `data/connectors-b1-b2.md` y ejemplos cuyo contexto no representa el significado declarado; no hacer correcciones automáticas por sospecha.
- Contrastar citas y atribuciones con la procedencia disponible en `data/context-provenance.json`; si se corrige una cita o atribución, mantener sincronizados Markdown y metadatos de procedencia. Ese JSON sigue siendo metadato, no fuente de contenido para la UI.
- `README.md`: documentar criterios de revisión y una checklist editorial por archivo para futuras ediciones.
- Tests existentes de loaders, parsers y contenido para detectar roturas de formato o estructura después de cada archivo revisado.

**Out of scope (for future specs):**

- Añadir nuevas tarjetas, temas, niveles o fuentes externas de contenido en la UI.
- Reescribir por gusto el estilo de todas las traducciones o cambiar criterios de acento regional sin error demostrado.
- Nuevas funcionalidades de práctica, filtros, cuentas o almacenamiento de contenido fuera de Markdown.

## Data model

No se añaden campos al modelo de contenido. Se mantienen formatos Markdown existentes; `data/context-provenance.json` se actualiza solo si una corrección de contexto/fuente lo exige. El README incorpora una checklist de revisión por archivo y criterios repetibles: correspondencia expresión–acepción–ejemplo, naturalidad, traducción, ortografía, gramática, tag, respuesta aceptada, atribución y formato parseable.

## Review record

Marcar cada archivo después de revisarlo completamente, corregir los hallazgos confirmados y ejecutar sus checks de parseo. Esta lista documenta el avance editorial, no certifica que nunca aparecerán errores nuevos.

- [x] `data/phrasal-verbs-b1-b2-200.md`
- [x] `data/collocations-b1-b2.md`
- [x] `data/fixed-prepositions-b1-b2.md`
- [x] `data/idioms-b1-b2.md`
- [x] `data/irregular-verbs-b1-b2.md`
- [x] `data/everyday-phrases-b1-b2-150.md`
- [x] `data/connectors-b1-b2.md`
- [x] `data/word-formation-b1-b2.md`
- [x] `data/grammar-part-1.md`
- [x] `data/grammar-part-2.md`
- [x] `data/grammar-part-3.md`
- [x] `data/grammar-part-4.md`
- [x] `data/grammar-part-5.md`
- [x] `data/grammar-part-6.md`
- [x] `data/grammar-part-7.md`
- [x] `data/grammar-part-8.md`

## Implementation plan

1. Documentar checklist y criterios de corrección en `README.md`; registrar conteos iniciales por archivo mediante loaders existentes. Verificación: el proyecto carga igual que antes.
2. Revisar los siete archivos de vocabulario, uno por paso, en el orden del Review record; corregir solo errores confirmados y verificar parser, conteo y tests afectados al cerrar cada archivo.
3. Revisar `data/word-formation-b1-b2.md`, incluidas la tabla y las oraciones/variantes curadas de SPEC 28. Verificación: todas las familias y respuestas de ejercicio conservan la cobertura y pasan parser/tests.
4. Revisar `data/grammar-part-1.md` a `data/grammar-part-8.md`, un archivo por paso; contrastar regla, formación, ejemplos, modelo, explicación y traducción del mismo tema. Verificación: conservan los 26 temas y tests de carga.
5. Verificar coherencia de atribuciones/citas corregidas con `data/context-provenance.json`, completar Review record y ejecutar lint, typecheck, tests y build.

## Acceptance criteria

- [x] Están marcados los 16 archivos del Review record solo después de revisar cada entrada del archivo correspondiente.
- [x] Las erratas y contradicciones confirmadas se corrigieron; el caso `Nevo mucho` fue investigado y resuelto.
- [x] Toda corrección editorial preserva conteos de tarjetas, familias y temas y mantiene formatos parseables; no se agregaron entradas nuevas.
- [x] Las citas/atribuciones modificadas coinciden con los metadatos de procedencia; la UI sigue leyendo contenido únicamente de `data/*.md`.
- [x] `README.md` contiene checklist y criterios de revisión para próximas ediciones.
- [x] `npm run lint`, `npm run typecheck`, `npm run test` y `npm run build` terminan sin errores.

## Decisions

- **Yes:** revisión manual gradual por archivo con verificaciones de estructura; la calidad semántica no se infiere solo de un test.
- **Yes:** corregir problemas verificables y conservar el volumen/arquitectura de contenido existentes.
- **No:** aumentar volumen ni asignar nuevos niveles durante esta auditoría.
- **No:** reemplazar Markdown por JSON como fuente educativa; la procedencia JSON es solo metadato existente.

## Risks

| Risk | Mitigation |
| --- | --- |
| Una corrección cambia una respuesta usada por una sesión local | El mecanismo ID + huella de SPEC 30 invalida la sesión afectada. |
| Se interpreta un matiz lingüístico como error objetivo | Exigir contexto y evidencia editorial antes de corregir; dejar intactos los casos no concluyentes. |
| Cambia un fragmento citado sin su atribución | Revisar y sincronizar procedencia cuando se edite una cita o su fuente. |

## What is **not** in this spec

- Tarjetas nuevas, niveles individuales, rediseño de UI o migración del contenido a JSON.
