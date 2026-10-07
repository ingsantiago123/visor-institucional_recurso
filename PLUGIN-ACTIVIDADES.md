# Visor de curso U.INCCA — cómo debe armar el plugin la clave `recursos` (actividades)

> Documento para el plugin de Moodle que arma el JSON del `<iframe>` (lo que
> va en `window.name`). Describe **solo** la sección de actividades. El
> resto del contrato (`curso`, `profesor`, `modulos`, `secciones`,
> `diapositivas_extra`, …) está en `README.md`.

---

## 1. Alcance — QUÉ actividades van y cuáles NO

Este visor es la **portada del curso**. La clave `recursos` es **únicamente**
para las actividades que están **sueltas en la página principal del curso**,
es decir:

- Actividades y recursos que viven en la **sección 0** (la sección
  "general" / "cima", la que en el formato Mosaicos se muestra **por
  encima** de los mosaicos), y
- que **NO** son uno de los mosaicos/tiles (esos van en `modulos`), y
- que **NO** pertenecen a una sección que el plugin esté mandando como
  `diapositivas_extra` (secciones personalizadas).

### El plugin NO debe tocar, leer ni incluir:

| Está en… | Va a… | El plugin con `recursos` |
|---|---|---|
| Un **mosaico / tile / semana** (sección 1..N del curso) | `modulos[]` | **NO lo toca.** No entra a la sección, no lista sus mods, no lo incluye. |
| Una **sección personalizada** que el plugin publica como diapositiva | `diapositivas_extra[]` | **NO lo toca.** Todo lo de esa sección lo maneja `diapositivas_extra`. |
| Cualquier actividad **dentro** de un mosaico o de una sección personalizada | (su diapositiva) | **NO lo toca.** |
| Una actividad **suelta en la sección 0**, fuera de todo lo anterior | **`recursos[]`** | **SÍ la incluye acá.** |

Regla simple: **una actividad se incluye en `recursos` solo si no está
representada por ningún `modulo` ni por ninguna `diapositiva_extra`.** Si el
plugin ya "consumió" una sección para `modulos` o `diapositivas_extra`, sus
actividades ya no vuelven a aparecer en `recursos`.

Si no hay actividades sueltas → **no mandes la clave `recursos`** (o mándala
como `[]`). Como el curso sí manda otros datos, el visor entiende "este
curso no tiene actividades sueltas": no dibuja la diapositiva, ni el botón
"Ir a actividades" del hero, ni la píldora de estadística. (El ejemplo de
actividades que se ve al abrir el visor **sin ningún dato** es solo para
previsualizar el diseño — nunca aparece en un curso real.)

---

## 2. Dónde va en el JSON

`recursos` es una clave **de primer nivel** del objeto JSON, un **array**:

```jsonc
{
  "curso": "…",
  "modulos": [ … ],
  "diapositivas_extra": [ … ],
  "recursos": [
    { "tipo": "actividades", "titulo": "…", "items": [ … ] }
  ]
}
```

Cada elemento del array es un **recurso contenedor** de tipo `"actividades"`.
Podés mandar **uno** (todas las actividades juntas en una diapositiva) o
**varios** (cada uno es su propia diapositiva). Ver §5.

---

## 3. El recurso contenedor (`tipo: "actividades"`)

| Campo | Tipo | Obligatorio | Default | Qué hace |
|---|---|---|---|---|
| `tipo` | string | **Sí** | — | Debe ser **exactamente** `"actividades"`. Cualquier otro valor → el recurso entero se descarta en silencio (no rompe nada, pero no aparece). |
| `items` | array | **Sí** (en la práctica) | `[]` | Una entrada por actividad. Ver §4. Con `[]` la diapositiva igual aparece, con el texto "Este recurso todavía no tiene actividades". |
| `id` | string | No | `"recurso-N"` (N = posición 1-based en el array) | Se usa para el `id` HTML de la diapositiva (`actividades-<id>`) y para anclas/navegación. **Poné un `id` explícito y estable** (ej. `"actividades-sueltas"`, `"examen-final"`) — no dependas del autogenerado. |
| `titulo` | string | No | `"Actividades"` | Encabezado de la diapositiva. |
| `visible` | boolean | No | `true` | `false` → la diapositiva no se renderiza, no cuenta en estadísticas y no aparece en la navegación. |
| `orden` | number | No | Posición en el array `recursos` | Solo decide el orden **entre los recursos de actividades**. Como **bloque**, las diapositivas de actividades van **siempre justo antes de "Unidades"** (no se pueden mover a otro lado del mazo). |

---

## 4. Cada actividad — `items[]`

Cada actividad lleva, **como mucho, 5 datos**:

| Campo | Tipo | Obligatorio | Default | Qué hace |
|---|---|---|---|---|
| `nombre` | string | **Sí** | `""` | Encabezado de la fila. Si hay `descripcion`, la fila **abre un modal** con el detalle; si no, es texto estático. |
| `tipo` | string | No | Se **infiere del `link`** (ver abajo) | Uno de: `quiz`, `tarea`, `foro`, `taller`, `entrega`, `examen`. Define **solo** el color, el ícono y la etiqueta de la tarjeta — **no cambia ningún comportamiento**. Un valor no reconocido cae en `tarea`. |
| `link` | string (URL) | No | `""` → sin botón | URL a la actividad en Moodle (la `view.php` del mod). Con valor → botón "ir a la actividad", **siempre visible**, y se repite como botón flotante dentro del modal. |
| `descripcion` | string | No | `""` → fila estática | Texto plano **o** HTML. **Qué es lo decide únicamente `descripcion_html`** — el visor nunca lo adivina mirando el contenido. |
| `descripcion_html` | boolean | No | `false` | Ver §4.2. |

### 4.1 Inferencia de `tipo` desde el `link`

Si no mandás `items[].tipo` (o mandás uno inválido), el visor lo infiere
buscando el módulo de Moodle en el `link`:

| El `link` contiene… | `tipo` resultante |
|---|---|
| `mod/quiz/` | `quiz` |
| `mod/forum/` | `foro` |
| `mod/workshop/` | `taller` |
| `mod/assign/` | `tarea` |
| cualquier otra cosa (o sin link) | `tarea` |

**Recomendación:** mandá `items[].tipo` explícito siempre que puedas. Usá
`entrega` para tareas que son "entregables con nota de corte" y `examen`
para quizzes que son exámenes finales — esos dos no se infieren solos
(un `mod/assign` se infiere como `tarea`, un `mod/quiz` como `quiz`).

### 4.2 `descripcion` + `descripcion_html`

Con `descripcion`, al hacer clic en la actividad se abre el **modal de
pantalla completa** y la descripción se renderiza **recién en ese
momento** (se destruye al cerrar). **No hay acordeón inline** — ni el
texto ni el HTML se muestran dentro de la fila.

- **`descripcion_html: false`** (o ausente) → en el modal, el texto se
  muestra **escapado** (un `<` accidental nunca se interpreta como
  etiqueta) y partido en párrafos por **línea en blanco** (`\n\n`).

- **`descripcion_html: true`** → en el modal, el HTML se inyecta **tal
  cual**.
  - Mandá acá el HTML de la introducción/descripción de la actividad tal
    como lo tiene Moodle (`intro` del mod, ya con `format_text()` aplicado
    si querés).
  - Es contenido **de confianza** (lo arma el plugin/Moodle) — se inyecta
    tal cual, no se sanea.
  - El modal crece con el contenido hasta un tope (`min(86vh, 720px)`) y
    ahí scrollea; tablas/imágenes se acotan al ancho. Conviene HTML
    razonable, pero no descuadra nada del visor.

---

## 5. ¿Un recurso o varios?

Los dos son válidos. Se dibujan distinto:

- **Varias actividades en el mismo recurso** (`items` con 2+) → se dibujan
  como una **"ruta": filas conectadas por una línea de tiempo**, cada una
  con su nodo numerado, su color y su ícono de tipo. Cada fila con
  descripción abre el modal.

- **Un recurso con una sola actividad** (`items` con exactamente 1) → se
  dibuja como una **tarjeta protagonista**: medallón grande, nombre
  grande y dos botones — "Ver la actividad" (abre el modal con la
  descripción) e "Ir a la actividad". Usalo para destacar algo
  (p. ej. el examen final).

**Guía práctica:** una sola diapositiva `recursos` con TODAS las
actividades sueltas es lo normal. Separá en varios recursos solo cuando
tenga sentido que sean diapositivas distintas (p. ej. "Actividades de la
semana" + "Examen final de corte" aparte).

> El **total** que alimenta el badge del CTA del hero y la píldora
> "Actividades" de la ficha del curso es la **suma de los `items` de todos
> los recursos `actividades`** (no la cantidad de recursos). 14 ítems
> repartidos en 2 recursos → dice "14".

---

## 6. Ejemplo completo

Lo que el plugin debe producir (JSON ya decodificado):

```json
{
  "curso": "Investigación I",
  "modulos": [
    { "nombre": "CONECTA", "url": "https://moodle.../course/view.php?id=53&section=1", "sectionid": 101 },
    { "nombre": "Semana 1", "url": "https://moodle.../course/view.php?id=53&section=2", "sectionid": 102 }
  ],
  "recursos": [
    {
      "id": "actividades-sueltas",
      "tipo": "actividades",
      "titulo": "Actividades del curso",
      "orden": 8,
      "items": [
        {
          "nombre": "Cuestionario diagnóstico",
          "tipo": "quiz",
          "link": "https://moodle.../mod/quiz/view.php?id=500",
          "descripcion": "10 preguntas de selección múltiple. 30 minutos.\n\nIntentos: 2, se toma el mejor. Disponible hasta el jueves.",
          "descripcion_html": false
        },
        {
          "nombre": "Foro de presentación",
          "link": "https://moodle.../mod/forum/view.php?id=501",
          "descripcion": "Preséntate ante el grupo y comenta al menos dos aportes de tus compañeros.",
          "descripcion_html": false
        },
        {
          "nombre": "Entrega de primer corte",
          "tipo": "entrega",
          "link": "https://moodle.../mod/assign/view.php?id=503",
          "descripcion": "<table border=\"0\" width=\"100%\"><tr><td><strong>ACTIVIDAD 1 — PRIMER CORTE</strong><br>Instrucciones… Peso: 35%. Fecha límite: domingo 23:59.</td></tr></table>",
          "descripcion_html": true
        },
        {
          "nombre": "Rúbrica de autoevaluación",
          "link": ""
        }
      ]
    },
    {
      "id": "examen-final",
      "tipo": "actividades",
      "titulo": "Examen final de corte",
      "orden": 9,
      "items": [
        {
          "nombre": "Examen integral de metodología",
          "tipo": "examen",
          "link": "https://moodle.../mod/quiz/view.php?id=600",
          "descripcion": "25 preguntas + 2 abiertas.\n\nDuración: 90 min. Un único intento. Peso: 40%.",
          "descripcion_html": false
        }
      ]
    }
  ]
}
```

Qué produce:

- **`actividades-sueltas`** (4 ítems → "ruta"): quiz (morado), foro
  (naranja, inferido de `mod/forum`), entrega (dorado) — las tres abren
  su detalle en el modal al hacer clic (el HTML de la tabla se renderiza
  ahí) — y "Rúbrica…" sin link ni descripción → fila estática.
- **`examen-final`** (1 ítem → tarjeta protagonista): tarjeta grande roja
  con los botones "Ver la actividad" e "Ir a la actividad".
- Va **antes de la diapositiva "Unidades"**.
- Hero: badge del CTA = **5** (4 + 1). Ficha del curso: píldora "5
  Actividades".

---

## 7. Cómo va dentro del `<iframe>` (recordatorio)

El JSON completo va como string en el atributo `name` del `<iframe>`, con
las comillas dobles y `&`, `<`, `>` escapados **de atributo HTML**
(el JSON en sí queda intacto):

```php
<iframe id="incca-hero-section" title="Visor de recurso U.INCCA"
  src="https://ingsantiago123.github.io/recurso_incca_prueba_piloto/"
  name='<?php echo htmlspecialchars(json_encode($datos), ENT_QUOTES); ?>'>
</iframe>
```

`json_encode()` se encarga del escapado JSON (incluidos los `"` dentro del
HTML de `descripcion` y los `\n` de los textos planos). `htmlspecialchars(…,
ENT_QUOTES)` se encarga de que ese string quepa dentro de `name='…'` sin
romper el `<iframe>`. No hay que escapar nada a mano.

---

## 8. Errores comunes — checklist

- [ ] `recursos` es **array de primer nivel**, no va dentro de otra clave.
- [ ] Cada recurso tiene `"tipo": "actividades"` **literal** (sin mayúsculas, sin acento, sin plural distinto).
- [ ] **No** incluir actividades que ya están en un `modulo` o en una `diapositiva_extra`.
- [ ] **No** entrar a leer las secciones que son mosaicos ni las secciones personalizadas para armar `recursos`.
- [ ] `descripcion_html` es **boolean** (`true`/`false`), no el string `"true"`.
- [ ] Si `descripcion` trae HTML → `descripcion_html: true`. Si trae texto con `<`/`>` accidentales → dejalo en `false` (se escapa solo).
- [ ] `link` es la URL de la vista del mod (`.../mod/xxx/view.php?id=NNN`), no un `id` pelado.
- [ ] Poné `id` explícito y estable en cada recurso.
- [ ] Sin actividades sueltas → **no mandes `recursos`** (o `[]`).
