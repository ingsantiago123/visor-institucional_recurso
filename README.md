# Visor de recurso educativo — U.INCCA

Mazo de diapositivas interactivo (HTML/CSS/JS puro, sin frameworks) para
la Universidad INCCA de Colombia. Es una plantilla **genérica**: no tiene
ningún curso "quemado" en el código — todo el contenido (nombre del
curso, docentes, video, bienvenida, ruta de aprendizaje, tutorías y las
unidades/módulos del mosaico de Moodle) se lo pasa un sistema externo
(hoy, HTML estático de prueba; a futuro, un plugin de Moodle) como un
objeto **JSON**, y la página se pinta sola con esos datos.

Publicado en: **https://ingsantiago123.github.io/recurso_incca_prueba_piloto/**

## Qué es

Todo el contenido llega en un solo objeto JSON leído desde `window.name`
del iframe — **no desde la URL**, así no hay límite de longitud aunque el
curso tenga muchos módulos o actividades. Ver [Cómo embeberlo en
Moodle](#cómo-embeberlo-en-moodle) más abajo para el patrón exacto.

Solo `curso` es obligatorio. Todo lo demás es opcional y, si falta, se
completa **campo por campo** con un placeholder de ejemplo — con el
formato/extensión real que debería tener ese campo, y muchas veces
explicando qué poner ahí (ej. "Ejemplo de resumen: un párrafo breve que
cuenta de qué trata el curso...") — en vez de dejar la sección vacía o
romper el diseño. Siempre están marcados como ejemplo ("(ejemplo)",
"Ejemplo:") para que nunca se puedan confundir con datos reales de un
curso, pero el objetivo es que abrir el visor sin datos todavía se vea
como una plantilla completa, no una pantalla vacía.

## Archivos

```
index.html               ← único punto de entrada
assets/css/styles.css    ← paleta institucional + estilos del deck
assets/js/main.js        ← lee el JSON y pinta todo (comentario de esquema al inicio del archivo)
assets/img/               ← escudo + íconos de pestaña
assets/img-temp/          ← ilustraciones genéricas de módulo (CONECTA/INCCA APOYO/Semana 1-4),
                             usadas como respaldo automático — ver "ilustracion" en Unidades
```

## Cómo embeberlo en Moodle

```php
<iframe id="incca-hero-section" title="Visor de recurso U.INCCA"
  style="width:100%; height:900px; border:0;"
  src="https://ingsantiago123.github.io/recurso_incca_prueba_piloto/"
  name='<?php echo htmlspecialchars(json_encode($datosDelRecurso), ENT_QUOTES); ?>'>
</iframe>
```

El atributo `name` debe estar en el **mismo tag** que `src` desde el
principio (HTML estático generado por PHP, sin JavaScript necesario) —
así el navegador crea el iframe con ese nombre desde el arranque, antes
de cargar la página. `htmlspecialchars(..., ENT_QUOTES)` es importante:
si algún texto trae comillas, sin esto rompería el atributo HTML.

Si en cambio el iframe se arma con JavaScript en la página que lo
embebe, hay que fijar `iframe.contentWindow.name` (**no** `iframe.name`,
que solo es el atributo HTML del tag) **antes** de fijar el `src`:

```js
const iframe = document.getElementById("incca-hero-section");
iframe.contentWindow.name = JSON.stringify(datosDelRecurso);
iframe.src = "https://ingsantiago123.github.io/recurso_incca_prueba_piloto/";
```

### Cómo probarlo localmente

Este repo no trae un archivo de prueba (carpeta mínima, sin archivos de
test). Para probar cambios: crea un `.html` cualquiera fuera del repo con
un iframe apuntando a `index.html` (local, vía Live Server u otro
servidor) y el JSON de prueba en el atributo `name`, exactamente como en
el ejemplo de PHP de arriba pero con datos fijos en vez de
`<?php ... ?>`. Abrir `index.html` directo (sin iframe, sin
`window.name`) también sirve — muestra el modo "sin datos", todo en
placeholders, útil para revisar que el diseño no se rompa vacío.

## El JSON — resumen

Todos los campos son opcionales excepto `curso`:

```json
{
  "curso": "Nombre del curso",
  "resumen": "Párrafo corto debajo del título del hero",
  "insignias": [{ "icono": "fa-brain", "texto": "Teórico · Práctico", "destacada": false }],
  "unidades": 4,
  "horas_trabajo": 96,
  "profesor": {
    "nombre": "...", "foto": "url (opcional)", "rol": "... (opcional)",
    "bio": ["párrafo 1", "párrafo 2"],
    "etiquetas": [{ "icono": "fa-graduation-cap", "texto": "..." }],
    "video": "url de YouTube/Vimeo/Drive (opcional)"
  },
  "profesor_tutor": "mismo formato que profesor (opcional) — ver sección Docente tutor",
  "video": "url de YouTube/Vimeo/Drive — Presentación del curso",
  "video_titulo": "Título junto al video de presentación",
  "video_parrafos": ["párrafo 1", "párrafo 2"],
  "dea_video": "url de YouTube/Vimeo/Drive (opcional) — DEA, diapositiva distinta",
  "dea_imagen": "url de imagen (opcional) — modo alternativo a dea_video, gana si llega",
  "dea_titulo": "Título junto al video/imagen del DEA",
  "dea_parrafos": ["párrafo 1", "párrafo 2"],
  "dea_descarga_url": "url opcional de descarga del material del DEA",
  "bienvenida": { "titulo": "...", "parrafos": ["...", "..."], "frase_destacada": "..." },
  "aprenderas": [{ "icono": "fa-xxx", "titulo": "...", "detalle": "..." }],
  "aprenderas_texto": "opcional — modo alternativo de \"aprenderás\" (texto largo en vez de tarjetas), ver más abajo",
  "aprenderas_imagen": "url de imagen (opcional, solo con aprenderas_texto)",
  "tutorias": { "url_aula_virtual": "...", "horario": [{ "dia": "Jueves", "inicio": "HH:MM", "fin": "HH:MM" }] },
  "modulos": [{ "nombre": "...", "url": "...", "ilustracion": "url (opcional)", "sectionid": "número (opcional)" }],
  "secciones": "opcional — mostrar/ocultar/reordenar las 9 diapositivas fijas, ver más abajo",
  "diapositivas_extra": "opcional — agregar diapositivas nuevas (iframe o HTML), ver más abajo",
  "recursos": "opcional — actividades del curso fuera de los mosaicos, ver más abajo"
}
```

**Nada de contenido va hardcodeado.** Lo único fijo en el HTML son
etiquetas de interfaz que nunca cambian sin importar el curso: textos de
botones ("Ir a las unidades", "INICIAR MÓDULO") y nombres de sección
("Docente", "Tutorías").

## Las diapositivas — sección por sección

El deck es un mazo de diapositivas de pantalla completa (no es una
página con scroll, y no tiene topbar ni "mapa del curso" — solo el
contenido) — se navega con las flechas de los costados, los puntos de
abajo, las flechas del teclado o swipe (táctil).

La lista de diapositivas **no es fija**: por defecto son 8 o 9 (según si
llega `profesor_tutor`), pero el orden, la visibilidad de cada una y hasta
diapositivas nuevas por completo se pueden controlar desde el JSON — ver
["Personalizar el mazo"](#personalizar-el-mazo-mostrarocultar-reordenar-y-diapositivas-custom)
más abajo. Esta tabla es el estado **por defecto**, sin ningún override:

| # | id interno | Diapositiva | ¿Siempre existe? |
|---|---|---|---|
| 1 | `hero` | Inicio | Sí |
| 2 | `presentacion` | Presentación del curso | Sí |
| 3 | `bienvenida` | Bienvenida | Sí |
| 4 | `aprenderas` | Aprenderás | Sí |
| 5 | `dea` | DEA | Sí |
| 6 | `docente` | Docente creador | Sí |
| 6b | `docente_tutor` | Docente tutor | Solo si llega `profesor_tutor` |
| 7 | `tutorias` | Tutorías | Sí |
| 8 | `unidades` | Unidades | Sí |

> **`presentacion` y `dea` son diapositivas independientes**, aunque las
> dos muestren un video: `presentacion` es el video/título/párrafos de
> apertura del curso (campos `video`/`video_titulo`/`video_parrafos`);
> `dea` es el Diseño de Experiencia para el Aprendizaje, con su propio
> video opcional y su propio texto (campos `dea_video`/`dea_titulo`/
> `dea_parrafos`/`dea_descarga_url`). Antes de este cambio compartían un
> solo campo `video` — si tenías un JSON viejo, mové ese contenido a
> `dea_*` si en realidad era el DEA, o dejalo en `video`/`video_titulo`/
> `video_parrafos` si era la presentación.

---

### 1. Inicio (`hero`)

Portada del recurso: título, resumen, insignias y contadores animados.

```json
{
  "curso": "Ingeniería de Alimentos",
  "resumen": "Fundamentos de ciencia y tecnología de alimentos...",
  "insignias": [
    { "icono": "fa-brain", "texto": "Teórico · Práctico" },
    { "icono": "fa-laptop", "texto": "100% Virtual", "destacada": true }
  ],
  "unidades": 5,
  "horas_trabajo": 80
}
```

| Campo | Tipo | Dónde se ve | Si falta |
|---|---|---|---|
| `curso` | texto | Título grande del hero y `<title>` de la pestaña | Se trata como si **todo** el JSON no hubiera llegado — es el único campo verdaderamente obligatorio |
| `resumen` | texto | Párrafo debajo del título | Ejemplo de resumen (formato/extensión real, marcado como ejemplo) |
| `insignias` | `[{icono, texto, destacada}]` | Píldoras junto al título. `icono` es una clase de Font Awesome solid (ej. `fa-brain`); `destacada:true` la pinta en dorado sólido en vez de translúcida | 3 insignias de ejemplo |
| `unidades` | número | Contador **"Unidades"** del hero — es un número informativo, **independiente** de cuántos objetos traiga `modulos` (ver más abajo) | `4` (ejemplo) |
| `horas_trabajo` | número | Contador **"Trabajo directo"** (se muestra con sufijo "h") | `96` (ejemplo) |

Los otros dos contadores del hero ("Tutorías en vivo" y "Módulos") se
calculan solos, contando `tutorias.horario.length` y `modulos.length` —
no son campos aparte.

---

### 2. Presentación del curso (`presentacion`)

Título + video grande, protagonista, centrado — pensado como un
"estreno" antes de entrar al resto del curso. Párrafos opcionales debajo
del título, encima del video.

Diseño "premiere": fondo cinemático en capas (grid de puntos + anillos
concéntricos pulsantes + blobs ambientales + barrido de luz + viñeta),
separador ornamental con ícono de play entre el título y el video, y
marco de video con borde superior dorado y halo de luz debajo. Puramente
visual — no agrega ni cambia campos del JSON.

```json
{
  "video": "https://drive.google.com/file/d/XXXXXXXX/preview",
  "video_titulo": "Presentación del curso",
  "video_parrafos": ["párrafo 1", "párrafo 2"]
}
```

| Campo | Dónde se ve | Si falta |
|---|---|---|
| `video` | Reproductor embebido, grande y centrado (máx. 980px). Acepta enlaces normales de **YouTube**, **Vimeo** o **Google Drive** — se convierten solos a su versión embebible | Video de ejemplo |
| `video_titulo` | Título centrado arriba del video | Título de ejemplo |
| `video_parrafos` | Texto introductorio centrado, arriba del video | 2 párrafos de ejemplo |

> Esta diapositiva es **distinta** de "DEA" (más abajo) aunque las dos
> muestren un video — ver la nota en la tabla de diapositivas al inicio
> de este documento.

---

### 3. Bienvenida (`bienvenida`)

```json
{
  "bienvenida": {
    "titulo": "¡Bienvenidos al curso!",
    "parrafos": ["párrafo 1", "párrafo 2", "párrafo 3"],
    "frase_destacada": "Una cita o lema del curso."
  }
}
```

| Campo | Dónde se ve | Si falta |
|---|---|---|
| `bienvenida.titulo` | Título de la diapositiva | Título de ejemplo |
| `bienvenida.parrafos` | Texto principal (uno o más `<p>`) | 2 párrafos de ejemplo explicando qué poner ahí |
| `bienvenida.frase_destacada` | Cita en la tarjeta oscura junto al texto | Frase de ejemplo (si el JSON manda explícitamente `""`, **esa tarjeta entera se oculta**, no queda un espacio vacío) |

**Sin `frase_destacada` (`""` explícito), la columna derecha no queda
vacía**: en su lugar se muestra una escena de figuras geométricas
(cuadros "cristal"/blancos/azules apilados en diagonal) con parallax de
mouse, pegada al borde derecho de la diapositiva completa (no solo del
alto del texto). El tag/heading quedan fijos arriba y solo el párrafo
scrollea, con su propia scrollbar celeste, si el texto no entra entero.
En pantallas angostas (≤760px) la escena no se apila junto al texto —
queda como fondo muy tenue y difuminado detrás de todo, para no perderla
del todo pero sin competir con la lectura. Es 100% automático según
`frase_destacada`: no hay un campo aparte para activarlo.

---

### 4. Aprenderás (`aprenderas` / `aprenderas_texto`)

Dos diseños posibles, elegidos automáticamente **según qué campo llegue**
— no hay un interruptor aparte que prender en el JSON.

**Modo tarjetas (`aprenderas`, el de siempre):**

```json
{
  "aprenderas": [
    { "icono": "fa-microscope", "titulo": "Microbiología de alimentos", "detalle": "Texto que se ve al tocar la tarjeta." }
  ]
}
```

Arreglo de tarjetas expandibles, cualquier cantidad. `icono` es una clase
de Font Awesome solid. Si ninguno de los dos campos llega, se muestran 3
tarjetas de ejemplo ("Temática 1/2/3") con el detalle explicando qué
poner en cada una. Si en cambio el JSON manda explícitamente un arreglo
vacío `[]` (el curso realmente no tiene ruta de aprendizaje todavía), se
muestra un mensaje en vez de una grilla vacía — esos son dos casos
distintos.

**Modo texto largo + imagen (`aprenderas_texto`):** para cursos que
describen la ruta de aprendizaje como un párrafo extenso en vez de temas
discretos. El texto vive en un panel con fondo degradé y scroll propio
(scrollbar celeste a medida) con una línea central que titila hacia la
imagen; la imagen tiene una animación de flote suave. Sin imagen, el
texto pasa a columna centrada de ancho completo.

```json
{
  "aprenderas_texto": ["párrafo 1", "párrafo 2", "párrafo 3"],
  "aprenderas_imagen": "https://.../foto.jpg"
}
```

| Campo | Dónde se ve | Si falta |
|---|---|---|
| `aprenderas_texto` | Texto principal (uno o más `<p>`) | Si no llega (o llega vacío), se usa el modo tarjetas de arriba en su lugar |
| `aprenderas_imagen` | Imagen fija al costado del texto | Sin imagen, el texto ocupa todo el ancho (columna centrada, más angosta para que se siga leyendo bien) |

Si el JSON manda **ambos** campos (`aprenderas` y `aprenderas_texto`),
gana `aprenderas_texto` — la grilla de tarjetas no se pinta.

---

### 5. DEA (`dea`)

Diapositiva propia, **distinta** de "Presentación del curso" (más
arriba): video **o imagen** (a elección) + texto (típicamente la
explicación del Diseño de Experiencia para el Aprendizaje) + botón
opcional de descarga de material. Mismo layout que tenía antes la
diapositiva de video (texto + media lado a lado), ahora con sus propios
campos independientes.

```json
{
  "dea_video": "https://drive.google.com/file/d/XXXXXXXX/preview",
  "dea_imagen": "https://.../dea.png",
  "dea_titulo": "DEA · Diseño de Experiencia para el Aprendizaje",
  "dea_parrafos": ["párrafo 1", "párrafo 2"],
  "dea_descarga_url": "https://drive.google.com/file/d/YYYYYYYY/view"
}
```

| Campo | Dónde se ve | Si falta |
|---|---|---|
| `dea_video` | Reproductor embebido junto al texto. Acepta enlaces normales de **YouTube**, **Vimeo** o **Google Drive** — se convierten solos a su versión embebible | Video de ejemplo (si el JSON manda explícitamente `""`, se oculta solo el reproductor; título y párrafos siguen visibles) |
| `dea_imagen` | Imagen junto al texto, **en vez de** `dea_video` — sin marco ni fondo detrás, pensada para un PNG con fondo transparente (se ve tal cual, con un drop-shadow sutil, no una caja oscura tapando la transparencia) | Sin este campo, se usa `dea_video` |
| `dea_titulo` | Título junto al video/imagen | Título de ejemplo |
| `dea_parrafos` | Texto descriptivo junto al video/imagen | 2 párrafos de ejemplo |
| `dea_descarga_url` | Botón "Descargar material" junto a "Ir a las unidades" | Botón oculto (este campo no tiene ejemplo — no hay nada instructivo que mostrar en un link de descarga) |

Si el JSON manda **ambos** campos (`dea_video` y `dea_imagen`), gana
`dea_imagen` — mismo criterio que `aprenderas_texto` sobre `aprenderas`:
el campo más específico que llegue elige el diseño, nunca se muestran los
dos a la vez.

---

### 6. Docente creador (`docente`)

El video, si llega, es el elemento protagonista (16:9, columna
izquierda) y el avatar se reduce a una chapa circular superpuesta en su
esquina; sin video, el avatar se muestra solo, centrado y grande.

```json
{
  "profesor": {
    "nombre": "Kevin Santiago Garzón Fauna",
    "foto": "https://.../foto.jpg",
    "rol": "Ingeniero de Sistemas · Especialista en Desarrollo de Software",
    "bio": ["párrafo 1", "párrafo 2"],
    "etiquetas": [{ "icono": "fa-flask", "texto": "Control de calidad" }],
    "video": "https://drive.google.com/file/d/XXXXXXXX/preview"
  }
}
```

| Campo | Dónde se ve | Si falta |
|---|---|---|
| `profesor.nombre` | Nombre en la tarjeta | Nombre de ejemplo |
| `profesor.foto` | Avatar circular/redondeado | Foto de ejemplo (servicio [pravatar.cc](https://pravatar.cc)); si la URL dada no carga, cae a un avatar generado con las iniciales del nombre ([ui-avatars.com](https://ui-avatars.com)) |
| `profesor.rol` | Línea debajo del nombre | Cargo de ejemplo (si el JSON manda explícitamente `""`, se oculta la línea entera) |
| `profesor.bio` | Biografía (uno o más `<p>`) | 2 párrafos de ejemplo |
| `profesor.etiquetas` | Chips debajo de la biografía | 2 etiquetas de ejemplo |
| `profesor.video` | Video 16:9 protagonista de la tarjeta (YouTube/Vimeo/Drive, se convierte solo a su versión embebible) | Video de ejemplo; si el JSON manda explícitamente `""`, no se muestra el bloque y el avatar vuelve a su tamaño completo |

> **Links de Google Drive: deben ser públicos.** Un link de Drive que no
> esté compartido como "Cualquier persona con el enlace" (rol Lector) no
> se puede embeber — el iframe queda en blanco, sin ningún error visible,
> porque Google redirige a su pantalla de login y esa pantalla no se
> puede mostrar dentro de un iframe. Esto pasa aunque el link funcione
> perfecto al abrirlo directo en una pestaña (ahí sí hay una sesión de
> Google activa). Para arreglarlo: en Drive, click derecho al archivo →
> Compartir → Acceso general → "Cualquier persona con el enlace" →
> Lector. Aplica igual a `video` (Presentación), `dea_video` y
> `dea_descarga_url`.

---

### 6b. Docente tutor (`docente_tutor`) — opcional

**Mismo componente exacto que "Docente creador"**, mismo formato de
datos, bajo la clave `profesor_tutor`. La diferencia real es que **esta
diapositiva no siempre existe**: si el curso no tiene un docente tutor
asignado todavía, simplemente no se manda la clave `profesor_tutor` y la
diapositiva desaparece de la navegación entera (puntos, contador, mapa)
— no queda una diapositiva de placeholders genéricos por rellenar.

```json
{
  "profesor_tutor": {
    "nombre": "Jaime Andrés Arredondo",
    "foto": "https://.../foto.jpg",
    "rol": "Docente tutor · Abogado, Esp. en Derecho Procesal",
    "bio": ["párrafo 1", "párrafo 2"],
    "etiquetas": [{ "icono": "fa-gavel", "texto": "Derecho procesal" }]
  }
}
```

Si se manda `profesor_tutor` aunque sea con un solo campo (p. ej. solo
`nombre`), la diapositiva **sí aparece**, y el resto de sus campos se
completa con los mismos placeholders que "Docente creador".

---

### 7. Tutorías (`tutorias`)

```json
{
  "tutorias": {
    "url_aula_virtual": "https://moodle.unincca.edu.co/mod/googlemeet/view.php?id=767113",
    "horario": [
      { "dia": "Jueves", "inicio": "18:00", "fin": "20:30" }
    ]
  }
}
```

Ya no es un acordeón de encuentros con grabación/ICS por sesión — el
curso entrega **un solo link** (típicamente un recurso `mod/googlemeet`
de Moodle: adentro de esa página Moodle decide qué mostrar, si entrar en
vivo o ver la grabación — el visor no gestiona esa lógica, solo enlaza)
más **uno o más bloques horarios recurrentes** que comparten ese mismo
link. Lo normal es un solo bloque semanal, pero puede haber varios (p.
ej. lunes y jueves a horas distintas) — el diseño se adapta solo a
cualquier cantidad (`flex-wrap`, no hay que tocar nada).

| Campo | Formato | Notas |
|---|---|---|
| `url_aula_virtual` | url | El mismo link para todas las semanas/bloques |
| `horario[].dia` | `"Lunes"`…`"Domingo"` (sin distinguir mayúsculas/tildes) | Día de la semana, recurrente |
| `horario[].inicio` / `.fin` | `"HH:MM"` 24h | Hora local del curso |

El aviso bajo el horario ("Próxima sesión: Jueves · 6:00 pm" / "Clase en
vivo ahora") se calcula solo en el navegador a partir de la hora actual
— no es un campo del JSON. Si `tutorias` no llega, se muestra 1 bloque
de ejemplo; si el JSON manda explícitamente `horario: []` (el curso
realmente no tiene tutorías programadas todavía), se muestra un mensaje
en vez de la tarjeta — esos son dos casos distintos, mismo criterio que
el resto de los placeholders de esta guía.

---

### 8. Unidades (`unidades`) — el mosaico real de Moodle

La diapositiva más distinta de todas: ocupa la pantalla completa (de
punta a punta del deck, sin el margen/padding de las demás) con un
acordeón horizontal de paneles — uno por cada módulo del curso.

```json
{
  "modulos": [
    { "nombre": "CONECTA", "url": "https://moodle.../section.php?id=50", "sectionid": 50 },
    { "nombre": "INCCA APOYO", "url": "https://moodle.../section.php?id=51", "sectionid": 51 },
    { "nombre": "Semana 1", "url": "https://moodle.../section.php?id=52", "sectionid": 52, "ilustracion": "https://.../semana1.png" },
    { "nombre": "Semana 2", "url": "https://moodle.../section.php?id=53", "sectionid": 53 },
    { "nombre": "Semana 3", "url": "https://moodle.../section.php?id=54", "sectionid": 54 },
    { "nombre": "Semana 4", "url": "https://moodle.../section.php?id=55", "sectionid": 55 }
  ]
}
```

`modulos` es un arreglo **ya ordenado tal como debe verse** (CONECTA,
INCCA APOYO, Semana 1, Semana 2...) y de **cantidad dinámica** — no hay
un número fijo de semanas, el acordeón se adapta solo a cuantos módulos
lleguen.

| Campo | Tipo | Qué hace | Si falta |
|---|---|---|---|
| `nombre` | texto | Nombre del módulo — se muestra en la chapa (colapsado) y como título (expandido). También se usa para **inferir** el ícono/número del panel, ver abajo | Nombre de ejemplo (si `modulos` no llega, se muestran 4 módulos de ejemplo: CONECTA, INCCA APOYO, Semana 1, Semana 2) |
| `url` | texto | A dónde navega el botón **"INICIAR MÓDULO"** cuando no hay puente con Moodle (ver abajo) — enlace real (`<a target="_blank">`), no ejecuta nada dentro del visor | `#` (no navega a ningún lado) |
| `ilustracion` | url de imagen (opcional) | Imagen mostrada en el panel expandido | Si el `nombre` matchea "conecta"/"apoyo"/"semana 1-4", se infiere automáticamente uno de los PNG genéricos que ya trae el visor (`assets/img-temp/`); si no matchea nada, no se muestra ilustración (el panel se ve bien igual, solo sin imagen) |
| `sectionid` | número (opcional) | Id real de la sección en Moodle — habilita el puente con la página padre (ver abajo) | Sin este campo, "INICIAR MÓDULO" siempre navega a `url` en pestaña nueva |

**El ícono/color de cada panel NO son campos del JSON** — son diseño
fijo, calculado automáticamente:

- **Ícono**: se infiere del propio `nombre` (función `unitVisualMeta()`
  en `main.js`). Si el nombre contiene "conecta" → ícono de foro; si
  contiene "apoyo" → ícono de ayuda; si contiene "semana" seguido de un
  número → se muestra ese número en grande en vez de un ícono; cualquier
  otro nombre cae en un ícono genérico. Esto es intencional: para el
  diseño, todos los módulos son indistinguibles entre sí salvo por su
  nombre — no hay un campo `"tipo"` aparte que decir "esto es un foro".
- **Color**: cada panel recibe un color sólido tomado de un punto del
  degradé institucional (oscuro → claro) según su posición — el primer
  módulo sale más oscuro, el último más claro. Se recalcula solo según
  cuántos módulos lleguen (función `unitColorAt()`).

### Puente con Moodle (opcional, vía `sectionid`)

Pensado para cuando el visor está embebido dentro de la **misma página
de curso** que contiene esos módulos (formato de curso "Mosaicos" /
`format_tiles`, con el plugin `local_visorincca`). En vez de abrir `url`
en pestaña nueva, el botón "INICIAR MÓDULO":

1. Le avisa a la ventana padre por `postMessage`:
   ```js
   { source: "visorincca", type: "abrir-modulo", sectionid: <number> }
   ```
2. Espera hasta 500 ms una confirmación del padre:
   ```js
   { source: "visorincca", type: "modulo-abierto", sectionid: <number> }
   ```
3. Si llega la confirmación a tiempo, no navega a ningún lado — el padre
   ya abrió el mosaico nativo ahí mismo. Si no llega (el visor no está
   embebido, el padre no tiene el plugin, o cualquier otro caso), cae de
   vuelta a `window.open(url, "_blank", "noopener")` — el comportamiento
   de siempre. Un click **nunca** se queda sin efecto.

Sin `sectionid` este puente ni se intenta — el link se comporta como uno
normal. Ver `initUnitCta()` en `assets/js/main.js` para la implementación
completa.

---

## Personalizar el mazo: mostrar/ocultar, reordenar y diapositivas custom

Todo esto es opcional y se administra 100% desde el JSON — no hace falta
tocar código para ocultar una diapositiva, cambiar su posición o agregar
una nueva.

### Mostrar, ocultar y reordenar las 9 diapositivas fijas — `secciones`

Por defecto existen las 9 diapositivas de siempre, en este orden: `hero`,
`presentacion`, `bienvenida`, `aprenderas`, `dea`, `docente`,
`docente_tutor`, `tutorias`, `unidades` (`docente_tutor` además solo
aparece si llegó `profesor_tutor`, como se explicó arriba). El campo
`secciones` deja controlar cada una sin tocar nada más:

```json
{
  "secciones": {
    "aprenderas": { "visible": false },
    "unidades":   { "orden": 0 },
    "docente":    { "orden": 1 }
  }
}
```

Cada clave es el id de una diapositiva fija. Ambos campos son opcionales:

| Campo | Tipo | Default si falta |
|---|---|---|
| `visible` | booleano | `true` para todas, excepto `docente_tutor` (que sigue dependiendo de si llegó `profesor_tutor`, salvo que acá se fuerce explícitamente) |
| `orden` | número | Su posición en la lista de arriba (0 a 8) |

El ejemplo de arriba deja "Unidades" como primera diapositiva **después
de la portada**, "Docente creador" justo después de esa, y saca
"Aprenderás" del mazo por completo (no cuenta en los puntos de abajo ni
en ningún lado).

> **`hero` (la portada) es la única excepción: no se puede ocultar ni
> reordenar.** Cualquier `visible`/`orden` que le manden a `"hero"` en
> `secciones` se ignora — siempre existe, siempre visible, y siempre es
> la primera diapositiva del mazo. Es una regla forzada en código
> (`construirSlides()`), no una convención opcional.

### Agregar diapositivas nuevas — `diapositivas_extra`

Inserta contenido nuevo sin tocar el HTML/JS del visor — un iframe o
HTML/CSS directo (de confianza, se inyecta tal cual — mismo criterio que
los cuadros de "insertar HTML" del propio Moodle):

```json
{
  "diapositivas_extra": [
    {
      "id": "webinar-cierre",
      "tipo": "media",
      "orden": 8,
      "titulo": "Webinar de cierre",
      "descripcion": "Grabación del encuentro de cierre del módulo.",
      "iframe": "https://www.youtube.com/embed/XXXXXXXXXXX"
    },
    {
      "id": "encuesta-satisfaccion",
      "tipo": "pagina",
      "orden": 9,
      "iframe": "https://forms.gle/XXXXXXXXXXX"
    }
  ]
}
```

| Campo | Obligatorio | Qué es |
|---|---|---|
| `id` | Sí | Identificador único de la diapositiva (no puede repetirse ni coincidir con las fijas) |
| `tipo` | No (default `"media"`) | `"media"` o `"pagina"` — ver abajo |
| `orden` | No | Comparte la misma numeración que `secciones` — así se puede intercalar una diapositiva custom entre dos fijas. Sin este campo, se agrega al final |
| `visible` | No (default `true`) | Igual que en `secciones` |
| `titulo` / `descripcion` | No | Solo se usan/muestran en tipo `"media"` |
| `iframe` | No* | URL a embeber. Si llegan `iframe` y `html`, gana `iframe` |
| `html` | No* | HTML/CSS a inyectar directo. *Si no llega ninguno de los dos, se muestra un mensaje de "sin contenido" en vez de una diapositiva rota |

**Los dos tipos:**

- **`"media"`** — diapositiva normal, con márgenes, igual que "Docente":
  título y descripción arriba, y el iframe/html en un marco contenido
  con un botón para abrirlo en un **modal de pantalla completa** (más
  grande, con el mismo título/descripción).
- **`"pagina"`** — a pantalla completa, igual que "Unidades": el iframe/
  html ocupa toda la diapositiva de punta a punta, sin título ni
  descripción. Solo quedan las flechas prev/next (y los puntos de abajo)
  para salir de ahí — pensado para contenido que necesita todo el
  espacio (un formulario largo, un recurso interactivo completo, etc.).

Implementación completa en `construirSlides()`, `renderCustomSlides()` y
`crearSlideCustom()` (`assets/js/main.js`).

### Actividades del curso — `recursos`

Las **actividades que viven fuera de los mosaicos** de las semanas (en la
sección principal de Moodle): quizzes, foros, talleres, entregas, exámenes.
Cada recurso `"actividades"` es su propia diapositiva. Se ordenan entre sí
por `orden` pero como bloque **van siempre justo antes de "Unidades"**. El
total de actividades alimenta el badge del CTA "Ir a actividades" del hero
y una píldora en la ficha del curso.

**La clave `recursos` NO tiene placeholder de ejemplo con datos reales:**
si el curso mandó datos (aunque sea solo el nombre) pero no la clave
`recursos`, eso significa "este curso no tiene actividades sueltas" → no se
muestra ni la diapositiva ni el CTA. El ejemplo de `SIN_DATOS` solo se ve
al abrir `index.html` **completamente sin datos** (preview).

```json
{
  "recursos": [
    {
      "id": "actividades-semana1",
      "tipo": "actividades",
      "titulo": "Actividades de la semana",
      "visible": true,
      "orden": 8,
      "items": [
        {
          "nombre": "Evaluación diagnóstica",
          "tipo": "quiz",
          "link": "https://moodle.../mod/quiz/view.php?id=500",
          "descripcion": "Texto plano.\n\nUna línea en blanco separa los párrafos.",
          "descripcion_html": false
        },
        {
          "nombre": "Entrega de primer corte",
          "tipo": "entrega",
          "link": "https://moodle.../mod/assign/view.php?id=503",
          "descripcion": "<table>...</table>",
          "descripcion_html": true
        },
        { "nombre": "Rúbrica de autoevaluación" }
      ]
    }
  ]
}
```

| Campo | Default | Qué hace |
|---|---|---|
| `id` | `"recurso-N"` | Se usa para el `id` de la diapositiva (`actividades-<id>`) |
| `tipo` | — | **Debe ser** `"actividades"` (otros valores se ignoran por ahora) |
| `titulo` | `"Actividades"` | Encabezado de la diapositiva |
| `visible` / `orden` | `true` / según posición | `orden` solo decide el orden **entre recursos de actividades** — como bloque van antes de "Unidades" |
| `items[].nombre` | `""` | Encabezado de la fila. Con `descripcion` → clic abre el detalle en el modal; sin ella → fila estática |
| `items[].tipo` | inferido del `link` (`mod/quiz`→`quiz`, `mod/forum`→`foro`, `mod/workshop`→`taller`, `mod/assign`→`tarea`), o `tarea` | Uno de `quiz`, `tarea`, `foro`, `taller`, `entrega`, `examen`. Solo color/ícono/etiqueta, no cambia el comportamiento |
| `items[].link` | `""` → sin botón | Botón redondo "ir a la actividad", siempre visible |
| `items[].descripcion` | `""` → fila estática | Texto o HTML, según `descripcion_html`. Al hacer clic en la actividad se abre en el **modal de pantalla completa** — se renderiza recién en ese momento, no hay acordeón inline |
| `items[].descripcion_html` | `false` | `false` → en el modal, texto plano en párrafos (escapado, `\n\n` = párrafo). `true` → en el modal, el HTML tal cual |

**Dos diseños automáticos:** 1 sola actividad → tarjeta protagonista
(medallón grande + botones "Ver la actividad" / "Ir a la actividad"). 2+ →
"ruta" de filas conectadas por una línea de tiempo; cada fila con
descripción abre el modal. `items: []` → mensaje de "todavía no tiene
actividades" (la diapositiva igual aparece).

Implementación en `normalizarRecursos()`, `construirSlides()`,
`crearSlideActividades()` / `actividadCard()` y `initActividades()`
(`assets/js/main.js`).

---

## Publicar / actualizar en GitHub Pages

El repo ya está publicado. Para futuros cambios:

```bash
git add .
git commit -m "mensaje del cambio"
git push
```

GitHub Pages reconstruye solo en cada push a `main` (tarda uno o dos
minutos en verse reflejado; si no ves el cambio, recarga forzado con
`Ctrl+Shift+R`).

Si hace falta publicar esto en un repositorio nuevo desde cero:

1. Crea un repositorio en GitHub.
2. Desde esta carpeta: `git init && git add . && git commit -m "..." && git branch -M main && git remote add origin <url> && git push -u origin main`.
3. En GitHub: **Settings → Pages → Source → Deploy from a branch → `main` / `root`**.
4. El sitio queda en `https://<usuario>.github.io/<repo>/`.

## Paleta y tipografía

Variables CSS definidas al inicio de `assets/css/styles.css` — cambiar
cualquier color institucional es editar un solo valor ahí, se propaga a
todo el sitio (incluida la paleta calculada del acordeón de Unidades):

| Variable | Color | Uso |
|---|---|---|
| `--oxford-blue` | `#040C38` | Fondos oscuros, títulos |
| `--dodger-blue` | `#2B8BFA` | Degradé institucional (portada, DEA) |
| `--royal-blue` | `#0B349D` | Iconos, acentos |
| `--light-cyan` | `#65CBE3` | Hover, estados activos, punta clara del degradé de Unidades |
| `--old-gold` | `#CBB54E` | Destacados, botón primario dorado, costura de Unidades |
| `--bronze` | `#A58540` | Degradado dorado (con `--old-gold`) |
| `--platinum` | `#E2E6E9` | Fondos neutros |

Tipografía: `'Futura Book', Roboto, 'Fira Sans', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif`.
Futura Book es una fuente con licencia — si tienes el archivo, agrégalo
con `@font-face` al inicio de `styles.css`; mientras tanto se usa Roboto
(vía Google Fonts) como respaldo. Iconografía: únicamente Font Awesome
solid (vía CDN) — cualquier campo `"icono"` del JSON espera una clase
tipo `fa-xxx` de ese set.
