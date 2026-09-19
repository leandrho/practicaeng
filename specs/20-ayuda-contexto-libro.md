# SPEC 20 — Ayuda de contexto estilo página de libro

> **Status:** Implementado
> **Depends on:** SPEC 02, SPEC 03, SPEC 04, SPEC 06, SPEC 07, SPEC 14
> **Date:** 2026-09-19
> **Objective:** Agregar en todas las cards un segundo botón de ayuda (cyan, junto a la pista visual) que muestra un fragmento de clásico fácil en dominio público o un mini-diálogo cotidiano en inglés, con estilo de página de libro y sin revelar la traducción.

## Scope

**In:**

- Nuevo campo obligatorio `contextEn` en `src/domain/card.ts` (`CardSchema`) y en `src/domain/word-formation.ts` (`WordFamilySchema`): fragmento de 2–4 oraciones en inglés que usa la expresión en contexto (clásico fácil en dominio público adaptado a B1-B2, o mini-diálogo cotidiano original), sin `meaningEs` ni `translationEs`. Campo opcional `contextSource` con la atribución (`Pride and Prejudice · J. Austen (adapted)` o `Everyday conversation`), visible como pie de página de libro.
- Nuevos campos en `data/*.md` para las 7 fuentes (`phrasal-verbs-b1-b2-200.md`, `collocations-b1-b2.md`, `fixed-prepositions-b1-b2.md`, `idioms-b1-b2.md`, `irregular-verbs-b1-b2.md`, `everyday-phrases-b1-b2-150.md`, `word-formation-b1-b2.md`), con parsers estrictos que fallan en build si falta (`tarjeta sin Context (EN)`).
- Nuevo icono `app/components/ui/BookIcon.tsx` (libro abierto, cyan) y componente `app/components/ui/ContextBook.tsx` que renderiza el fragmento como página de libro (`<figure class="book-page">`, expresión destacada con `<mark>`, pie con `contextSource`, sin español).
- Botón cyan `btn--context` en el frente de `app/components/FlashcardClient.tsx` y `app/components/WordFormationClient.tsx`, al lado del botón amarillo existente, con estado independiente `showContext`, reset al navegar, fuera del DOM hasta pulsar, `aria-pressed` y `aria-label` en inglés.
- Estilos papel crema + serif en `app/globals.css` para `.book-page` y `.btn--context`, en claro y oscuro, con `prefers-reduced-motion` sin animación.
- Tests: parsers (campo ausente falla, campo presente pasa), `Card` / `WordFamily` schemas, `Flashcard.test.tsx` y `WordFormationClient.test.tsx` (ausencia pre-click, presencia post-click, re-ocultar, reset, convivencia con pista visual, sin respuestas en el DOM).

**Out of scope (for future specs):**

- Persistir `showContext` (localStorage o sesión).
- Atajo de teclado dedicado para el contexto (Espacio sigue siendo Reveal).
- Audio del párrafo, TTS o resaltado sincronizado.
- Libros con copyright vigente; solo clásicos en dominio público (atribución obligatoria) o diálogos cotidianos originales.
- Traducción del párrafo al español o modo ES/EN para el contexto.
- Pistas progresivas por niveles o analytics de uso del contexto.
- Cambios visuales fuera del botón cyan y el panel `.book-page`.

## Data model

```ts
// src/domain/card.ts
CardSchema = z.object({
  // ... campos existentes
  contextEn: z.string().min(1), // 2–4 oraciones en inglés, contiene la expresión, sin español
  contextSource: z.string().min(1).optional(), // ej. "Pride and Prejudice · J. Austen (adapted)" o "Everyday conversation"
});

// src/domain/word-formation.ts
WordFamilySchema = z.object({
  // ... campos existentes
  contextEn: z.string().min(1), // fragmento en inglés con la base, sin español
  contextSource: z.string().min(1).optional(),
});
```

Formatos en `data/*.md` (todos obligatorios, build falla si faltan):

- Phrasals (`phrasal-verbs-b1-b2-200.md`), bajo `Traducción (ES):` (`Context (EN)` obligatorio, `Context source` opcional, por defecto `Everyday conversation`):
```md
- **Context (EN):** "It is a truth universally acknowledged," she read, "that a single man in possession of a good fortune must be in want of a wife."
- **Context source:** Pride and Prejudice · J. Austen (adapted)
```
```md
- **Context (EN):** "Are you ready?" "Give me a minute, I don't want to give up now."
```
- Bullets (`collocations`, `prepositions`, `idioms`, `irregular-verbs`, `everyday-phrases`): sexto bloque `---` en cursiva con el fragmento, sin español; séptimo bloque `---` opcional solo para clásicos (`--- *Pride and Prejudice · J. Austen (adapted)*`):
```md
- **make a decision** --- choose what to do --- tomar una decisión --- *I need to make a decision today.* --- *Necesito tomar una decisión hoy.* --- *"I must make a decision before nightfall," she said, looking at the two roads ahead.* --- *Everyday conversation*
```
- Word-formation (`word-formation-b1-b2.md`): tabla intacta, más bloque `## Contextos` con un bullet por base (resuelto por `family.base` en minúsculas) y fuente opcional tras `—`:
```md
## Contextos
- **act:** "We must act now," he whispered when the lights went out during the school play. — Everyday conversation
```

Convenciones:

- Texto siempre en inglés, 2–4 oraciones, contiene la expresión o la base tal cual.
- Dos fuentes permitidas: fragmento corto de clásico fácil en dominio público (adaptado a B1-B2 si hace falta, atribución obligatoria con título y autor) o mini-diálogo cotidiano original (`Everyday conversation`).
- Nunca contiene `meaningEs` ni `translationEs` ni su traducción literal.
- Sin libros con copyright vigente; la lista de clásicos usados queda documentada en el PR por lote.
- Clave WF = `base` normalizada (`lowercase.trim()`); `Card` usa `expression` tal cual.

## Implementation plan

1. Extender `CardSchema` y `WordFamilySchema` con `contextEn` requerido + `contextSource` opcional y actualizar fixtures mínimos de tests. Verificación: `vitest run` falla en contenido real hasta curar (rojo esperado).
2. Extender `parsePhrasalVerbCards` con `- **Context (EN):**` obligatorio (`tarjeta sin Context (EN)` si falta) + `- **Context source:**` opcional + test de fixture. Verificación: fixture con campo pasa, sin campo lanza error con archivo y línea.
3. Extender `parseBulletCards` y `parseIrregularVerbCards` al sexto bloque `--- *contextEn*` obligatorio + séptimo bloque de fuente opcional (solo clásicos) + tests. Verificación: bullets existentes sin sexto bloque fallan con mensaje claro.
4. Extender `parseWordFamilies` con bloque `## Contextos` obligatorio por base (fuente opcional tras `—`), sin tocar la tabla ni su separador + tests. Verificación: familia sin bullet de contexto falla.
5. Curar contextos lote 1 (phrasals 200 + idioms 35) con revisión no-spoiler y sin español; cada clásico lleva fuente y la lista de obras queda en el PR. Verificación: `getCards("phrasal-verbs")` y `getCards("idioms")` devuelven `contextEn` válido.
6. Curar contextos lote 2 (collocations 50 + prepositions 49 + everyday-phrases 150 + irregulars 100). Verificación: esos `getCards` devuelven `contextEn` válido.
7. Curar contextos lote 3 (word-formation 76, bloque `## Contextos`). Verificación: `getWordFamilies()` devuelve 76 con `contextEn`.
8. Crear `BookIcon.tsx` + `ContextBook.tsx` + estilos `.btn--context` (cyan) y `.book-page` (papel crema + serif, ambos temas) en `app/globals.css`. Verificación: render claro/oscuro sin flash, `prefers-reduced-motion` estático.
9. Cablear botón cyan + panel en el frente de `FlashcardClient.tsx` (estado `showContext` independiente de `showHint`, reset en `goPrev/goNext`, `key={card.expression}`, `aria-label` `Show context hint` / `Hide context hint`, `title="Ver contexto"`). Verificación: click manual muestra/oculta sin romper Reveal.
10. Replicar el patrón en `WordFormationClient.tsx` (resuelto por `family.contextEn`). Verificación: click manual muestra/oculta sin romper gap-fill ni Reveal.
11. Extender `Flashcard.test.tsx`, `WordFormationClient.test.tsx`, tests de schemas y parsers (ausencia pre-click, presencia post-click, re-ocultar, reset al navegar, convivencia visual+contexto, sin `meaningEs/translationEs` en el DOM del frente). Verificación: `vitest run` en verde.
12. Corrida global `npm run lint && npm run typecheck && npm run test && npm run build`. Verificación: todo en verde sin `.env` ni requests de red.

## Acceptance criteria

- [ ] Cada tarjeta de las 7 fuentes tiene `contextEn` en inglés de 2–4 oraciones con la expresión, sin español, como fragmento de clásico en dominio público o mini-diálogo cotidiano.
- [ ] Cada contexto de clásico muestra su fuente (título y autor); cada diálogo muestra `Everyday conversation`.
- [ ] Falta de `Context (EN)` / sexto bloque / bullet `## Contextos` hace fallar el build con archivo y línea.
- [ ] Antes de pulsar el botón cyan, el DOM del frente no contiene el párrafo ni `meaningEs / exampleEn / translationEs`.
- [ ] El botón cyan está al lado del botón amarillo existente, con icono de libro y `aria-label` `Show context hint` / `Hide context hint`.
- [ ] Pulsar el botón cyan muestra el panel estilo página de libro; pulsarlo de nuevo lo oculta (`aria-pressed` refleja el estado).
- [ ] Pista visual y contexto son independientes: ambos pueden estar abiertos a la vez.
- [ ] Cambiar de tarjeta/familia resetea el contexto a oculto.
- [ ] El panel usa fondo papel crema + serif en claro y variante legible en oscuro.
- [ ] Recorrido solo-teclado: Tab alcanza el botón cyan y Espacio sigue siendo Reveal sin colisión.
- [ ] `npm run lint && npm run typecheck && npm run test && npm run build` en verde.

## Decisions

- **Yes:** nuevo campo en `data/*.md` obligatorio. Mantiene el MVP (solo `data/*.md` como contenido) y hace el contexto parte del contenido, no de presentación como las fotos.
- **No:** plantilla generada desde `exampleEn` ni registro curado en código. El usuario eligió campo en `data/*.md` para control editorial total.
- **Yes:** solo inglés, sin traducción. Preserva el invariante Ver → recordar → producir → revelar; traducir spoilearía.
- **Yes:** botones independientes. El usuario lo pidió; permite combinar ayuda visual + contexto sin fricción.
- **Yes:** todas las secciones incluida word-formation. Cobertura total desde el día uno.
- **Yes:** tabla WF intacta + bloque `## Contextos`. Evita romper el parser de ancho fijo elegido en SPEC 04.
- **Yes:** papel crema + serif con primera letra capital. Comunica "página de libro" sin assets externos ni requests de red.
- **Yes:** icono libro abierto cyan con labels en inglés (`Show context hint` / `Hide context hint`). Consistente con `Show visual hint` existente y con UI en inglés de SPEC 12.
- **Yes:** fragmentos cortos de clásicos fáciles en dominio público (adaptados a B1-B2, con título y autor) o mini-diálogos cotidianos originales. Pedido del usuario; la fuente se muestra como pie de página de libro.
- **No:** libros con copyright vigente. Solo dominio público o diálogo original.
- **No:** citas largas ni capítulos enteros. Tope de 2–4 oraciones por contexto para no-spoiler y legibilidad B1-B2.
- **No:** campo opcional + fallback genérico. Se descartó por decisión del usuario aunque habría permitido migración gradual con build siempre verde.
- **No:** persistencia de `showContext`, atajo dedicado, audio/TTS o traducción del párrafo. Van en specs futuras si se necesitan.

## Risks

| Risk | Mitigation |
| ---- | ---------- |
| Curar 600+ párrafos bloquea el build (campo obligatorio deja la rama en rojo hasta el último lote) | Lotes por sección en orden 200+35, 50+49+150+100, 76; no mergear hasta el paso 12 en verde |
| Un párrafo filtra la traducción o incluye español accidental | Revisión no-spoiler por texto: buscar `meaningEs/translationEs` y veto a cualquier palabra del dorso en español |
| Un clásico elegido sigue con copyright vigente | Solo dominio público verificable (ej. Gutenberg); ante duda se usa diálogo original y la lista de obras queda en el PR |
| Un fragmento literal resulta difícil para B1-B2 | Adaptación simplificada marcada con `(adapted)`; el original queda citado en la fuente |
| El sexto bloque `---` rompe bullets largos con `---` internos | El párrafo de contexto no puede contener `---`; el parser lo rechaza con error de formato |
| El bloque `## Contextos` se desincroniza de la tabla WF | El parser exige un bullet por cada `base` y falla si falta o sobra uno |
| Dos botones de ayuda saturan el `flashcard__head` en móvil | Contenedor `.flashcard__hint-actions` flex con gap, botones de 3rem fijos, sin texto |

## What is **not** in this spec

- Persistencia de `showContext`, atajo de teclado o analytics.
- Audio, TTS o resaltado sincronizado del párrafo.
- Libros con copyright vigente o citas largas fuera del tope de 2–4 oraciones.
- Traducción del contexto al español.
- Cambios en fotos, `resolveHint`, `curated.ts` o `gallery.tsx`.
- Cambios visuales fuera del botón cyan y el panel `.book-page`.
