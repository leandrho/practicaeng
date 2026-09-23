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

El contenido de cada sección estará almacenado dentro del directorio:

`data/`

Ejemplo de estructura:

data/
├── phrasal-verbs-b1-b2-200.md
├── collocations-b1-b2.md
├── fixed-prepositions-b1-b2.md
├── idioms-b1-b2.md
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

### Word Formation

`word-formation-b1-b2.md` usa una tabla de ancho fijo. Mantené el encabezado y la línea de guiones existentes, y agregá una fila respetando sus columnas:

```md
  decide         decision        decisive         decisively      decidir / decisión / decisivo / decisivamente
```

Usá `---` cuando no haya una forma común o útil para el nivel. Las líneas que continúan una celda deben empezar con espacios, igual que las filas existentes.

### Antes de terminar

- No renombres ni muevas archivos dentro de `data/`.
- No cambies los encabezados ni los separadores de la tabla de Word Formation.
- Verificá el cambio con `npm run build`; si el formato es inválido, el error indica el archivo y la línea que hay que corregir.

### Grammar B1+

La tarjeta **Grammar B1+** del inicio abre `/grammar`, donde los 26 temas están agrupados en ocho partes. Cada tema tiene teoría en español, ejemplos EN/ES y una práctica de producción guiada: pensá o decí una oración antes de pulsar **Reveal**. Los ejercicios aparecen en el orden del archivo y sus respuestas se ocultan al cambiar de tarjeta. Esta práctica no forma parte de Mixed Practice ni de los filtros de vocabulario.

El contenido se edita en `data/grammar-part-1.md` a `data/grammar-part-8.md`, uno por parte. Cada título `##` debe coincidir exactamente con el tema correspondiente del catálogo en `src/domain/grammar-catalog.ts` y mantenerse en ese orden. Dentro de cada tema, usá los seis encabezados `###` que siguen, con texto no vacío en las tres secciones teóricas, **al menos una formación**, **dos ejemplos** y **cinco ejercicios**:

```md
## Present Simple / Present Progressive
### Regla y forma
El **present simple** se usa para hábitos y agrega **-s/-es** en tercera persona.
### Formación
- **Name (EN):** Present Simple
  - **Afirmativa:** sujeto + verbo base (+ -s/-es en tercera persona)
  - **Negativa:** sujeto + don't/doesn't + verbo base
  - **Interrogativa:** Do/does + sujeto + verbo base?
- **Name (EN):** Present Progressive
  - **Afirmativa:** sujeto + am/is/are + verbo en -ing
  - **Negativa:** sujeto + am/is/are + not + verbo en -ing
  - **Interrogativa:** Am/is/are + sujeto + verbo en -ing?
### Usos
Usalo para describir acciones habituales.
### Contrastes y errores
En tercera persona singular, el verbo lleva -s.
### Ejemplos
- **EN:** She works from home. --- **ES:** Ella trabaja desde casa.
- **EN:** They are working now. --- **ES:** Ellos están trabajando ahora.
### Ejercicios
- **Prompt (EN):** Describe a habit: she / walk to school every day. --- **Model (EN):** She walks to school every day. --- **Explanation (ES):** El *present simple* expresa hábitos y la tercera persona lleva -s. --- **Translation (ES):** Ella camina a la escuela todos los días.
```

Cada formación se escribe como un bullet con `Name (EN)`. Para una estructura simple, agregá `--- **Pattern:** fórmula`; para tiempos verbales, usá sub-bullets con las etiquetas `Afirmativa`, `Negativa` e `Interrogativa`, cada una seguida de su fórmula. Agregá una entrada distinta por construcción (por ejemplo, present perfect simple y present perfect progressive). En `Regla y forma`, encerrá en `**doble asterisco**` los términos clave para resaltarlos. En `Explanation (ES)`, usá `*asteriscos simples*` para mostrar fragmentos en inglés en cursiva. Cada ejercicio usa cuatro campos en una sola línea y el separador literal ` --- `; el prompt no debe adelantar el modelo. No repitas literalmente los modelos de las tarjetas en los ejemplos teóricos. Para comprobar la edición, ejecutá `npm run test` y `npm run build`: los datos incompletos, fuera de orden o mal formados fallan con archivo, tema y línea/campo.

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

## Idioms & Expressions

Esta sección permitirá estudiar expresiones habituales cuyo significado no siempre puede deducirse palabra por palabra.

Ejemplos:

break the ice

piece of cake

under the weather

once in a blue moon

El objetivo será aprender expresiones útiles y relativamente frecuentes, evitando centrarse en idioms demasiado raros o poco utilizados.

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
