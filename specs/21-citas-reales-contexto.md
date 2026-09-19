# SPEC 21 — Citas reales de clásicos en la ayuda de contexto

> **Status:** Implementada
> **Depends on:** SPEC 02, SPEC 03, SPEC 04, SPEC 06, SPEC 07, SPEC 14, SPEC 20
> **Date:** 2026-09-19
> **Objective:** Reemplazar los 660 mini-diálogos genéricos de `contextEn` por citas reales verificadas de 14 clásicos en dominio público donde existan, o por diálogos situados entre amigos o en el trabajo donde no, sin cambiar código.

## Why

Los diálogos inventados de SPEC 20 suenan planos y artificiales. Una cita real de un libro que el estudiante puede leer entero es input auténtico y memorable. El límite legal es estricto: solo clásicos en dominio público se pueden citar textual; de libros modernos con copyright no se copia nada.

## Scope

**In:**

- Reescritura de `contextEn` en los 7 archivos de `data/` (`phrasal-verbs-b1-b2-200.md`, `collocations-b1-b2.md`, `fixed-prepositions-b1-b2.md`, `idioms-b1-b2.md`, `irregular-verbs-b1-b2.md`, `everyday-phrases-b1-b2-150.md`, `word-formation-b1-b2.md`): 660 entradas en total.
- Dos clases de contenido: (a) **cita real** verificada palabra por palabra contra el texto de Project Gutenberg, con `contextSource` en formato `Título — Autor`; (b) **diálogo situado** original entre amigos o en el trabajo, con `contextSource` = `Everyday conversation`.
- Corpus fijo de 14 libros: *Alice's Adventures in Wonderland* (Carroll), *Treasure Island* (Stevenson), *Anne of Green Gables* (Montgomery), *Peter Pan* (Barrie), *The Wonderful Wizard of Oz* (Baum), *The Jungle Book* (Kipling), *A Christmas Carol* (Dickens), *The Adventures of Sherlock Holmes* (Doyle), *Tom Sawyer* (Twain), *Huckleberry Finn* (Twain), *Little Women* (Alcott), *The Call of the Wild* (London), *The Time Machine* (Wells), *Frankenstein* (Shelley).
- Reglas de selección por cita: 2–4 oraciones, máximo 400 caracteres totales, preferencia por líneas de diálogo y vocabulario B1, contiene la expresión en forma base o en flexión estándar verificada por humano (ej. *brought back* para *bring back*).
- Archivo de proveniencia `data/context-provenance.json`: una entrada por expresión con `{ kind: "quote" | "dialogue", book?, chapter? }` para auditar que cada cita atribuida existe.
- Actualización de las fixtures espejo en `src/infrastructure/fixtures/content/data/` donde corresponda.
- Script temporal de verificación (no se commitea): expresión presente (base o flexión tabulada), 2–4 oraciones, ≤400 chars, sin caracteres españoles, sin `---`, sin fugas de `meaningEs`/`translationEs`, fuentes solo de los dos formatos válidos.

**Out of scope (for future specs):**

- Libros con copyright vigente: ni una cita, ni siquiera corta.
- Agrandar el corpus más allá de los 14 libros fijados.
- Cambios en `app/**` o `src/**` (schemas, parsers, UI, estilos ya soportan `contextEn`/`contextSource`).
- Traducir las citas al español o agregarles adaptación B1 entre paréntesis.
- Audio, TTS o enlaces a los libros completos.
- Persistir `showContext` o atajo de teclado (sigue en SPEC 20 como out).

## Data model

Sin cambios de esquema. Se reutiliza el modelo de SPEC 20 (`CardSchema` y `WordFamilySchema` con `contextEn` obligatorio y `contextSource` opcional). Lo único nuevo es el archivo de proveniencia:

```json
// data/context-provenance.json (una entrada por expresión)
{
  "bring back": { "kind": "quote", "book": "Treasure Island — Robert Louis Stevenson", "chapter": "Chapter 12" },
  "no worries": { "kind": "dialogue" }
}
```

Convenciones:

- Cita real: `contextSource` exactamente `Título — Autor` (sin año, sin "adapted").
- Diálogo: `contextSource` exactamente `Everyday conversation`.
- La cita puede recortar oraciones vecinas por longitud, pero nunca altera palabras del original.

## Implementation plan

1. Descargar los 14 textos de Project Gutenberg a `/tmp` (no se commitean) y generar candidatas por expresión con búsqueda base + flexiones; guardar proveniencia candidata (libro, capítulo, oración) en working file temporal.
2. Verificación humana 1×1 de cada candidata: descartar falsos positivos (guiones, adyacencias casuales), exigir diálogo u oración corta B1 y ≤400 caracteres; lo que no pasa el filtro se marca `dialogue`.
3. Reescribir `data/phrasal-verbs-b1-b2-200.md` (200) + fixtures; suite verde.
4. Reescribir `data/idioms-b1-b2.md` (35) + fixtures; suite verde.
5. Reescribir `data/collocations-b1-b2.md` (50) + fixtures; suite verde.
6. Reescribir `data/fixed-prepositions-b1-b2.md` (49) + fixtures; suite verde.
7. Reescribir `data/irregular-verbs-b1-b2.md` (100) + fixtures; suite verde.
8. Reescribir `data/everyday-phrases-b1-b2-150.md` (150) + fixtures; suite verde.
9. Reescribir `data/word-formation-b1-b2.md` (76, sin fixture espejo); suite verde.
10. Escribir los diálogos situados (amigos/trabajo) para todas las entradas marcadas `dialogue`, con escenario reconocible dentro del propio texto.
11. Generar `data/context-provenance.json` final y correr verificación completa + `lint`, `typecheck`, `test`, `build`.

## Acceptance criteria

- [x] Las 660 entradas tienen `contextEn` de 2–4 oraciones y ≤400 caracteres (script: 0 fallos).
- [x] Cada `contextEn` contiene su expresión en forma base o flexión estándar (script con tabla de flexiones: 0 fallos).
- [x] Ningún `contextEn` contiene caracteres españoles, `---`, `meaningEs` ni `translationEs` (script: 0 fugas).
- [x] Toda entrada `quote` existe textual en el libro y capítulo declarados en `data/context-provenance.json` (auditable por muestreo).
- [x] Ninguna cita proviene de un libro con copyright vigente (corpus cerrado de 14 títulos).
- [x] Todo `contextSource` es `Título — Autor` o `Everyday conversation`, sin otros valores (script: 0 fallos).
- [x] El diff solo toca `data/**`, fixtures y `specs/21-*`: ningún cambio en `app/**` ni en `src/**` fuera de fixtures (`git diff --name-only`).
- [x] `npm run lint`, `npm run typecheck`, `npm run test` y `npm run build` en verde.
- [x] Conteo informado por sección: cuántas citas reales y cuántos diálogos.

## Decisions

- **Yes:** full 660 de una, sin piloto. El método ya está validado (285 matches exactos + 13 más con flexiones en solo 8 libros).
- **No:** piloto de 50. Retrasa el valor sin reducir el trabajo humano, que es 1×1 de todos modos.
- **Yes:** mezcla cita real + diálogo situado donde no haya cita. Las ~144 everyday phrases modernas no existen en libros de 1800–1910.
- **No:** solo citas reales. Dejaría tarjetas sin ayuda de contexto, rompiendo la invariante de SPEC 20.
- **Yes:** corpus cerrado de 14 libros accesibles y ricos en diálogo. Legibilidad B1 antes que diversidad de autores.
- **No:** ampliar a más libros o a PD tardío (hasta 1930). Más corpus = más ruido y falsos positivos, no mejor nivel.
- **Yes:** pie `Título — Autor` sin año. Corto y legible en el pie de página de libro.
- **No:** año en la atribución. Ruido visual sin valor pedagógico.
- **Yes:** tope de 400 caracteres. Las oraciones victorianas narrativas no entran en la UI ni en el nivel.
- **No:** adaptar o simplificar palabras del original. La cita es textual o no es cita.
- **Yes:** `data/context-provenance.json` commiteado. Hace auditable la afirmación "verificada contra el libro".
- **No:** scripts de búsqueda y verificación commiteados. Son andamiaje temporal en `/tmp`.

## Risks

| Risk                                             | Mitigation                                                                                      |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| Falsos positivos (guiones, adyacencias casuales) | Verificación humana 1×1 obligatoria; el script solo propone candidatas, nunca decide.           |
| Citas demasiado difíciles para B1                | Filtro diálogo/oración corta + vocabulario B1 + tope 400 chars; lo que no pasa va a `dialogue`. |
| Fatiga en 660 verificaciones manuales             | Plan por secciones (pasos 3–9), cada uno commiteable y con suite verde.                         |
| Ediciones distintas de Gutenberg                 | Proveniencia registra libro + capítulo; texto tomado de `cache/epub/*.txt`.                     |
| Expresiones que solo aparecen flexionadas        | Tabla de flexiones en el script de verificación; el humano confirma que la forma es estándar.   |

## What is **not** in this spec

- Citas de libros con copyright vigente.
- Libros fuera de los 14 fijados.
- Cambios de código en `app/**` o `src/**`.
- Traducciones o adaptaciones de las citas.
- Audio, enlaces externos o persistencia de `showContext`.

Cada uno de esos, si llega, va en su propia spec.
