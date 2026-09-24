# English Practice Web

Aplicación web para practicar vocabulario y estructuras frecuentes del inglés mediante un sistema interactivo de tarjetas.

El objetivo principal es ayudar a estudiantes de nivel **B1 en adelante** a incorporar vocabulario de forma activa, evitando limitarse únicamente a leer listas o memorizar traducciones.

La aplicación presentará una palabra, expresión o estructura y permitirá que el usuario intente recordar su significado, pensar cómo utilizarla en contexto y generar un ejemplo propio.

Luego, mediante la opción **Reveal**, se mostrará la respuesta completa para que el usuario pueda comparar lo que sabía con la información correcta.

## Secciones

La aplicación estará dividida en diferentes áreas de práctica:

- Phrasal Verbs
- Collocations
- Prepositions
- Idioms & Expressions
- Word Formation
- Connectors

El contenido de cada sección estará almacenado dentro del directorio:

`data/`

Ejemplo de estructura:

data/
├── phrasal-verbs-b1-b2-200.md
├── collocations-b1-b2.md
├── fixed-prepositions-b1-b2.md
├── idioms-b1-b2.md
├── connectors-b1-b2.md
└── word-formation-b1-b2.md

Estos archivos contienen la información utilizada por la aplicación, como significado, ejemplos, traducciones, categorías y nivel de dificultad.

## Cómo editar `data/`

El contenido se edita directamente en los archivos Markdown de `data/`. No hace falta tocar el código para corregir o sumar tarjetas, pero hay que respetar el formato de cada archivo.

### Tarjetas con bullets

`collocations-b1-b2.md`, `fixed-prepositions-b1-b2.md` e `idioms-b1-b2.md` usan una tarjeta por bullet. Los encabezados `##` definen la categoría de las tarjetas que siguen.

```md
## MAKE

- **make a decision** --- tomar una decisión --- *I need to make a decision today.*
```

- Usá exactamente tres bloques: expresión en `**negrita**`, significado en español y ejemplo en inglés en `*cursiva*`, separados por `---`.
- Podés partir un ejemplo largo en la línea siguiente si esa continuación empieza con espacios.
- Para crear una categoría, agregá un encabezado como `## TRAVEL` antes de sus tarjetas.

`phrasal-verbs-b1-b2-200.md` usa el formato propio de título y campos:

```md
### 201. look after
- **Significado:** cuidar de alguien o algo
- **Ejemplo:** She looks after her younger brother.
```

### Tags de tarjetas

Los tags son opcionales y se escriben en inglés. En las tarjetas con bullets, agregá un campo final separado por `---`; en Phrasal Verbs, agregá un campo `Tags` dentro de la tarjeta:

```md
- **interested in** --- wanting to know more about --- interesado en --- *I'm interested in technology.* --- *Me interesa la tecnología.* --- *I'm interested in it.* --- *Everyday conversation* --- *Tags: + noun phrase, + -ing*

### 1. ask out
- **Tags:** Transitive, Separable
```

Los valores permitidos dependen de la sección:

- **Connectors:** un tag de registro (`Formal`, `Neutral`, `Informal`) y uno de uso (`Spoken`, `Written`, `Spoken & written`).
- **Phrasal Verbs:** `Transitive`, `Intransitive`, `Separable`, `Inseparable`. No combines `Transitive` con `Intransitive`; `Separable` e `Inseparable` solo se usan con sentidos `Transitive` y no se combinan entre sí.
- **Prepositions:** `+ noun phrase`, `+ -ing`, `+ clause`. Podés incluir más de una forma cuando el patrón lo admita. Los encabezados `Adjective + preposition`, `Verb + preposition` y `Noun + preposition` siguen siendo categorías y no se repiten como tags.
- **Idioms:** registro y canal (`Formal`, `Neutral`, `Informal`, `Spoken`, `Written`, `Spoken & written`) solo cuando distingan el uso de la expresión. Ante la duda, se omite.
- **Everyday Phrases:** los mismos tags de registro/canal y `Polite` cuando la cortesía ayude a escoger la frase. `Polite` no se asigna por el mero hecho de que la frase sea una pregunta (por ejemplo, `How much is it?` no lleva tags).
- **Collocations:** registro/canal cuando aporten una diferencia real y ámbito (`Work`, `Academic`, `Daily life`) solo cuando el dominio sea claro y útil. Nunca llevan `Polite`.

Omití el campo cuando no agregue información útil o no puedas determinar el tag con confianza; no uses `Neutral` ni `Spoken & written` para completar. Las tarjetas sin distinción conservan `tags: []`. Los chips muestran el valor en inglés, sin prefijo, y aparecen solo después de **Reveal** (nunca en el frente). `category` y sus encabezados `##` conservan su función de agrupamiento y no se reemplazan ni duplican con tags.

### Connectors

`connectors-b1-b2.md` usa el mismo formato de bullet que `idioms-b1-b2.md`: expresión en `**negrita**`, meaning en inglés, significado en español, ejemplo en inglés en `*cursiva*`, traducción al español en `*cursiva*`, contexto en inglés en `*cursiva*`, fuente del contexto opcional (si se omite, se usa `Everyday conversation`) y un campo final obligatorio `Tags`:

```md
## Contrast and concession

- **however** --- used to introduce an opposite idea --- sin embargo, pero --- *The food was good; however, the service was slow.* --- *La comida estaba bien; sin embargo, el servicio fue lento.* --- *The course is short. However, it is affordable, so I will sign up tomorrow morning.* --- *Everyday conversation* --- *Tags: Neutral, Spoken & written*
```

- El campo final lleva exactamente un tag de registro y uno de uso, tomados de los allowlists de Connectors indicados arriba. Son orientaciones de uso, no restricciones gramaticales.
- Los tags aparecen únicamente al pulsar **Reveal**, para no adelantar información durante el recuerdo activo.
- Los encabezados `##` son los nueve grupos de función (Adding information, Contrast and concession, Cause and reason, Result and consequence, Purpose, Time and sequence, Examples and clarification, Opinion and stance, Summary and conclusion) y se usan como categoría en los filtros.
- El archivo tiene 70 conectores, con cinco o más por grupo.
- Un bullet incompleto, sin etiquetas válidas o con `---` dentro del contexto hace fallar el build con archivo y línea.
- El contexto sigue la convención de SPEC 21: cita real de uno de los 14 clásicos en dominio público donde existe (fuente `Título — Autor`, registrada en `data/context-provenance.json`), o diálogo situado con fuente `Everyday conversation` cuando el conector no aparece en el corpus.
- Los conectores **no** forman parte de Mixed Practice.

### Word Formation

`word-formation-b1-b2.md` usa una tabla de ancho fijo. Mantené el encabezado y la línea de guiones existentes, y agregá una fila respetando sus columnas:

```md
  decide         decision        decisive         decisively      decidir / decisión / decisivo / decisivamente
```

Usá `---` cuando no haya una forma común o útil para el nivel. Las líneas que continúan una celda deben empezar con espacios, igual que las filas existentes.

Cada familia tiene exactamente un ejercicio curado en contexto en la sección `## Ejercicios`, debajo de la tabla y de las secciones existentes. Sintaxis (una línea por familia, campos separados por ` --- `):

```md
- **Base:** act --- **Target:** noun --- **Sentence (EN):** The committee took immediate ____. --- **Answers:** action
```

Criterio editorial para redactar y revisar un ejercicio:

- `Base` debe existir en la tabla (en minúsculas); no repitas bases.
- `Target` es `noun`, `adjective` o `adverb`, y esa categoría debe existir en la familia (no elijas una columna con `---`).
- `Sentence (EN)` es una oración inglesa con exactamente una aparición de `____` (cuatro guiones bajos, ni más ni menos, sin otros grupos de guiones bajos). No uses ` --- ` dentro de la oración porque es el separador de campos.
- `Answers` tiene al menos una respuesta, separadas por ` / ` cuando hay varias. Cada respuesta debe estar entre las variantes declaradas en la columna del `Target` (por ejemplo, `amazed` solo vale si la celda dice `amazing / amazed`). No declares duplicados tras normalizar (mayúsculas y espacios no distinguen).
- Elegí una oración donde solo las respuestas declaradas suenen naturales; si la oración admite más de una forma, declaralas todas con ` / `, y si no se puede delimitar el conjunto, cambiá la oración.
- La corrección ignora mayúsculas y espacios extra, pero rechaza cualquier forma ajena a `Answers`, aunque sea de la misma familia en otra categoría.

### Antes de terminar

- No renombres ni muevas archivos dentro de `data/`.
- No cambies los encabezados ni los separadores de la tabla de Word Formation.
- Verificá el cambio con `npm run build`; si el formato es inválido, el error indica el archivo y la línea que hay que corregir.

### Grammar B1+

La tarjeta **Grammar B1+** del inicio abre `/grammar`, donde los 26 temas están agrupados en ocho partes. Cada tema muestra la teoría **en inglés por defecto**, con un botón `ES`/`EN` que alterna las cuatro secciones de prosa (Definition, Rule, When to use, Watch out for this) al español; los encabezados y el bloque Formation quedan siempre en inglés. Además hay ejemplos EN/ES siempre visibles y una práctica de producción guiada: pensá o decí una oración antes de pulsar **Reveal**. Los ejercicios aparecen en el orden del archivo y sus respuestas se ocultan al cambiar de tarjeta. Esta práctica no forma parte de Mixed Practice ni de los filtros de vocabulario.

El contenido se edita en `data/grammar-part-1.md` a `data/grammar-part-8.md`, uno por parte. Cada título `##` debe coincidir exactamente con el tema correspondiente del catálogo en `src/domain/grammar-catalog.ts` y mantenerse en ese orden. Dentro de cada tema, usá los siete encabezados `###` que siguen (son estructura editorial y no cambian de nombre), con **dos bullets `EN` y `ES` obligatorios y no vacíos** en cada una de las cuatro secciones teóricas, **al menos una formación**, **dos ejemplos** y **cinco ejercicios**:

```md
## Present Simple / Present Progressive
### Regla y forma
- **EN:** The **present simple** uses the base verb and adds **-s/-es** in the third person.
- **ES:** El **present simple** usa el verbo base y agrega **-s/-es** en tercera persona.
### Formación
- **Name (EN):** Present Simple
  - **Affirmative:** subject + base verb (+ -s/-es in the third person)
  - **Negative:** subject + don't/doesn't + base verb
  - **Question:** Do/does + subject + base verb?
- **Name (EN):** Present Progressive
  - **Affirmative:** subject + am/is/are + -ing form
  - **Negative:** subject + am/is/are + not + -ing form
  - **Question:** Am/is/are + subject + -ing form?
### Definición
- **EN:** The **present simple** is the base tense for habits, facts and routines; it is the form you build questions and negatives on with do/does.
- **ES:** El **present simple** es el tiempo base para hábitos, hechos y rutinas; es la forma sobre la que se construyen preguntas y negativas con do/does.
### Usos
- **EN:** Use it for habits and general facts.
- **ES:** Usalo para hábitos y hechos generales.
### Contrastes y errores
- **EN:** In the third person singular, the verb takes -s.
- **ES:** En tercera persona singular, el verbo lleva -s.
### Ejemplos
- **EN:** She works from home. --- **ES:** Ella trabaja desde casa.
- **EN:** They are working now. --- **ES:** Ellos están trabajando ahora.
### Ejercicios
- **Prompt (EN):** Describe a habit: she / walk to school every day. --- **Model (EN):** She walks to school every day. --- **Explanation (ES):** El *present simple* expresa hábitos y la tercera persona lleva -s. --- **Translation (ES):** Ella camina a la escuela todos los días.
```

En cada sección teórica (`Definición`, `Regla y forma`, `Usos`, `Contrastes y errores`) se espera exactamente un bullet `**EN:**` y un bullet `**ES:**`, en ese orden; un bullet de más, una etiqueta distinta o un texto vacío fallan con archivo, línea, tema y sección. La `### Definición` va entre `### Formación` y `### Usos` y dice **qué es y para qué sirve el tema en general** (identidad y propósito); `### Usos` sigue siendo **dónde se aplica** (contextos, matices y expresiones clave). Si una frase puede ir en las dos, va en `Usos`. El texto español de `ES` es el que ya existía; el `EN` es su versión inglesa equivalente y debe mantenerse sincronizado.

El bloque `### Formación` se escribe **íntegramente en inglés**: los `Name (EN)`, las etiquetas y los patterns. Cada formación es un bullet con `Name (EN)`. Para una estructura simple, agregá `--- **Pattern:** fórmula`; para tiempos verbales, usá sub-bullets con las etiquetas de la lista cerrada `Affirmative`, `Negative` y `Question` (las demás opciones son `Pattern`, `Result`, `Condition`, `Main clause` y `Time clause`), cada una seguida de su fórmula en inglés (`subject + base verb`, nunca `sujeto + verbo base`). El parser rechaza cualquier etiqueta fuera de esa lista. Agregá una entrada distinta por construcción (por ejemplo, present perfect simple y present perfect progressive). En `Regla y forma`, encerrá en `**doble asterisco**` los términos clave para resaltarlos — tanto en el bullet `EN` como en el `ES`. En `Explanation (ES)`, usá `*asteriscos simples*` para mostrar fragmentos en inglés en cursiva. Cada ejercicio usa cuatro campos en una sola línea y el separador literal ` --- `; el prompt no debe adelantar el modelo. No repitas literalmente los modelos de las tarjetas en los ejemplos teóricos. Para comprobar la edición, ejecutá `npm run test` y `npm run build`: los datos incompletos, fuera de orden o mal formados fallan con archivo, tema y línea/campo.

## Funcionamiento

La forma principal de estudio será mediante tarjetas.

Por ejemplo, una tarjeta podría mostrar:

GIVE UP

¿Qué significa?

Pensá un ejemplo utilizando este phrasal verb.

[ Reveal ]

El usuario deberá intentar recordar el significado antes de revelar la respuesta.

Luego de presionar **Reveal**, la tarjeta podrá mostrar:

GIVE UP

Meaning:
Rendirse / dejar de intentar algo.

Example:
Don't give up. You're almost there.

Translation:
No te rindas. Ya casi llegás.

El usuario podrá avanzar y retroceder entre las tarjetas y, eventualmente, indicar si conocía o no la respuesta.

## Método de aprendizaje

La aplicación está pensada principalmente para trabajar con **active recall**.

En lugar de mostrar inmediatamente la respuesta, se obliga al estudiante a intentar recuperar la información desde la memoria.

El flujo principal de aprendizaje será:

**Ver → recordar → producir → revelar → comparar → repetir**

La intención es evitar aprender únicamente asociaciones simples como:

give up = rendirse

y pasar a aprender vocabulario dentro de estructuras reales:

Don't give up. You're almost there.

De esta forma, el estudiante no solo reconoce una expresión cuando la encuentra, sino que aprende a utilizarla al hablar o escribir.

## Objetivos

Los principales objetivos de la aplicación son:

- Mejorar el vocabulario activo.
- Practicar estructuras frecuentes del inglés.
- Aprender expresiones dentro de contexto.
- Practicar la creación de ejemplos propios.
- Reforzar contenidos mediante repetición.
- Detectar vocabulario que todavía genera dificultad.
- Preparar progresivamente al estudiante para niveles B1, B2 y superiores.
- Mejorar tanto comprensión como producción oral y escrita.

## Phrasal Verbs

Esta sección permitirá practicar phrasal verbs frecuentes del inglés.

Cada tarjeta podrá contener:

- Phrasal verb.
- Nivel.
- Significado.
- Ejemplo.
- Traducción.
- Categoría.
- Tags gramaticales opcionales.

Ejemplo:

Phrasal Verb:
give up

Meaning:
rendirse / dejar de intentar

Example:
She didn't give up despite the difficulties.

Translation:
Ella no se rindió a pesar de las dificultades.

## Collocations

Esta sección estará orientada a combinaciones de palabras que aparecen juntas de forma natural en inglés.

Ejemplos:

make a decision

do homework

take a break

pay attention

La intención es evitar traducciones literales y ayudar al estudiante a utilizar combinaciones naturales del idioma.

## Prepositions

Sección para practicar combinaciones frecuentes entre palabras y preposiciones.

Ejemplos:

interested in

depend on

afraid of

good at

responsible for

Estas estructuras suelen ser difíciles de deducir mediante traducción directa, por lo que la práctica repetida resulta especialmente útil.
Las tarjetas pueden llevar tags opcionales de forma de complemento (`+ noun phrase`, `+ -ing` y `+ clause`); la categoría sigue siendo el encabezado del grupo.

## Idioms & Expressions

Esta sección permitirá estudiar expresiones habituales cuyo significado no siempre puede deducirse palabra por palabra.

Ejemplos:

break the ice

piece of cake

under the weather

once in a blue moon

El objetivo será aprender expresiones útiles y relativamente frecuentes, evitando centrarse en idioms demasiado raros o poco utilizados.

## Connectors

Sección para practicar conectores frecuentes del inglés (B1-B2): palabras y frases que unen ideas dentro de una oración o un texto.

Están agrupados por función en `data/connectors-b1-b2.md` (nueve grupos: Adding information, Contrast and concession, Cause and reason, Result and consequence, Purpose, Time and sequence, Examples and clarification, Opinion and stance, Summary and conclusion). Ejemplos:

however

therefore

for example

in my opinion

La tarjeta muestra la expresión y su grupo de función; al pulsar **Reveal** se compara el meaning, el ejemplo, la traducción y el contexto. Esta sección **no** participa de Mixed Practice.

## Word Formation

Esta sección estará orientada a familias de palabras y formación de vocabulario.

Ejemplo:

decide

decision

decisive

indecisive

Otro ejemplo:

succeed

success

successful

successfully

Esta sección permitirá trabajar sustantivos, verbos, adjetivos y adverbios relacionados.

También podrá utilizar ejercicios de completar espacios.

Ejemplo:

She made an important ______ yesterday.

Respuesta:

decision

## Modos de práctica

Inicialmente, la aplicación podrá utilizar un modo simple de tarjetas.

En el futuro podrán incorporarse diferentes formas de practicar:

### Flashcards

Mostrar una expresión y revelar posteriormente su significado y ejemplos.

### English → Spanish

Mostrar la expresión en inglés y pedir al usuario que recuerde su significado.

### Spanish → English

Mostrar el significado en español y pedir al usuario que recuerde la expresión inglesa.

### Complete the sentence

Mostrar una oración incompleta.

Ejemplo:

Don't ______. You're almost finished.

Respuesta:

give up

### Multiple Choice

Mostrar diferentes respuestas posibles.

Ejemplo:

What does "give up" mean?

- continuar
- rendirse
- buscar
- descubrir

### Create an example

Pedir al usuario que escriba una oración utilizando la expresión.

Ejemplo:

Create a sentence using:

give up

El usuario podría escribir:

I never give up when something is difficult.

## Progreso

En versiones posteriores se podrá registrar el progreso del usuario.

Cada tarjeta podría tener estados como:

- New
- Learning
- Known
- Difficult

También podrían existir botones como:

- I knew it
- I wasn't sure
- I didn't know it

Esto permitiría determinar qué tarjetas deben aparecer con mayor frecuencia.

## Repetición espaciada

Una evolución importante del proyecto será implementar un sistema de repetición espaciada.

Las expresiones que el usuario recuerda correctamente aparecerán cada vez con menor frecuencia.

Las expresiones que generan dificultad aparecerán más seguido.

Por ejemplo:

Nueva tarjeta:

1 día → 3 días → 7 días → 15 días → 30 días

Si el usuario falla una tarjeta, esta volverá a aparecer antes.

Esto permitirá utilizar la aplicación como una herramienta de estudio continua en lugar de simplemente recorrer una lista de vocabulario.

## Filtros

La aplicación podrá permitir filtrar el contenido por diferentes criterios.

Por ejemplo:

Nivel:

- B1
- B2
- C1

Tipo:

- Phrasal Verbs
- Collocations
- Prepositions
- Idioms
- Word Formation

Estado:

- New
- Learning
- Known
- Difficult
- Favorites

Categoría:

- Work
- Travel
- Daily life
- Relationships
- Education
- Technology
- Emotions
- Communication
- Movement
- Business

## Estadísticas

En versiones posteriores se podrán mostrar estadísticas como:

- Tarjetas estudiadas.
- Tarjetas aprendidas.
- Tarjetas difíciles.
- Porcentaje de respuestas correctas.
- Número de sesiones.
- Racha de estudio.
- Tiempo total de práctica.
- Progreso por categoría.
- Progreso por nivel.

## Favoritos

El usuario podrá marcar determinadas expresiones como favoritas para repasarlas posteriormente.

Esto permitirá crear sesiones de estudio específicas basadas en vocabulario que el usuario considere especialmente útil.

## Random Practice

Se podrá incluir un modo aleatorio que mezcle contenidos de diferentes categorías.

Por ejemplo:

Phrasal Verb → Collocation → Idiom → Preposition → Word Formation.

Esto permitirá simular situaciones donde el usuario no sabe qué tipo de estructura aparecerá a continuación.

## Daily Practice

La aplicación también podrá generar pequeñas sesiones diarias.

Por ejemplo:

Today's Practice

- 5 Phrasal Verbs
- 5 Collocations
- 3 Prepositions
- 2 Idioms
- 5 Word Formation exercises

Total:

20 ejercicios.

La intención será permitir sesiones cortas pero frecuentes.

## Fuente de datos

Todo el contenido educativo estará separado de la interfaz de usuario.

Los archivos se almacenarán dentro de:

`data/`

Esto permitirá modificar, ampliar o corregir el contenido sin necesidad de cambiar la lógica principal de la aplicación.

También permitirá eventualmente transformar los archivos Markdown a otros formatos como JSON.

Por ejemplo:

data/
├── phrasal-verbs-b1-b2-200.md
├── collocations-b1-b2.md
├── fixed-prepositions-b1-b2.md
├── idioms-b1-b2.md
└── word-formation-b1-b2.md

La aplicación podrá leer estos archivos durante el proceso de build o transformarlos previamente en una estructura de datos interna.

## Posible evolución de los datos

En una versión futura, el contenido podría convertirse a JSON para facilitar búsquedas, filtros y estadísticas.

Por ejemplo:

{
  "expression": "give up",
  "type": "phrasal-verb",
  "level": "B1",
  "meaning": "rendirse / dejar de intentar",
  "example": "Don't give up. You're almost there.",
  "translation": "No te rindas. Ya casi llegás.",
  "category": "motivation"
}

Sin embargo, inicialmente los archivos Markdown dentro de `data/` funcionarán como fuente principal del contenido.

## Principios del proyecto

La aplicación no pretende funcionar como un simple diccionario.

La idea es que el usuario tenga que recuperar activamente la información.

El proceso central será:

**Ver**

↓  

**Intentar recordar**

↓  

**Pensar un ejemplo**

↓  

**Reveal**

↓  

**Comparar**

↓  

**Evaluar si lo sabía**

↓  

**Repetir en el futuro**

El objetivo final es transformar vocabulario pasivo en vocabulario activo.

No solamente:

"I know what this expression means."

Sino:

"I can actually use this expression when I speak or write."

# Stack

-   Next.js 16
-   Prisma
-   Zod
-   Typescript
-   Postgresql
-   JWT
-   Docker

# Arquitectura
-   Se debe seguir una Arquictura hexagonal (domain, application, infrastructure)

# MVP
-   Solo usa los archivos que estan en data/ para cada seccion, no utiliza db ni tampoco maneja usuarios.
