/*!
 * U.INCCA · Mazo de diapositivas interactivo — vanilla JS, sin frameworks.
 * Única dependencia externa: Font Awesome (iconos), vía CDN en index.html.
 * ---------------------------------------------------------------------
 * TODO el contenido (curso, docente, bienvenida, aprenderás, tutorías,
 * video, unidades/módulos) llega como UN SOLO objeto JSON leído desde
 * `window.name` — no desde la URL. Esto evita el límite de longitud de
 * URL (error 414) cuando el curso tiene muchos módulos.
 *
 * FORMA RECOMENDADA (la que usa Moodle): HTML estático, sin JavaScript,
 * generado en PHP con json_encode() e impreso dentro del atributo name:
 *
 *   <iframe id="incca-hero-section" title="Visor de recurso U.INCCA"
 *     src="https://TU-USUARIO.github.io/TU-REPO/"
 *     name='{"curso":"...", "profesor":{...}, "modulos":[...]}'>
 *   </iframe>
 *
 * ALTERNATIVA (si el padre arma el iframe por JavaScript en vez de HTML
 * estático): hay que fijar contentWindow.name — NO iframe.name, que solo
 * es el atributo HTML del tag — ANTES de fijar el src:
 *
 *   const iframe = document.getElementById("incca-hero-section");
 *   iframe.contentWindow.name = JSON.stringify(datosDelRecurso);
 *   iframe.src = "https://TU-USUARIO.github.io/TU-REPO/";
 *
 * Ver test-iframe.html en la raíz del repo para un ejemplo completo y
 * funcional del patrón estático (el que se usa en producción).
 *
 * Estructura esperada del JSON (todos los campos son opcionales excepto
 * "curso"; lo que falte se completa con el recurso de ejemplo):
 *
 * {
 *   "curso": "Nombre del curso",
 *   "resumen": "Párrafo corto debajo del título del hero",
 *   "insignias": [{ "icono": "fa-brain", "texto": "Teórico · Práctico",
 *                    "destacada": false }],
 *   "unidades": 4,
 *   "horas_trabajo": 96,
 *   "profesor": {
 *     "nombre": "...", "foto": "url (opcional)",
 *     "rol": "... (opcional)",
 *     "bio": ["párrafo 1", "párrafo 2"],
 *     "etiquetas": [{ "icono": "fa-graduation-cap", "texto": "..." }],
 *     "video": "url de YouTube/Vimeo/Drive (opcional; video del docente)"
 *   },
 *   "profesor_tutor": mismo formato que "profesor" (opcional). Si esta
 *     clave no llega, la diapositiva "Docente tutor" ni se muestra — no
 *     todo curso tiene ese rol asignado, así que no hay diapositiva
 *     genérica de relleno para él.
 *   "video": "url de YouTube/Vimeo/Drive — Presentación del curso",
 *   "video_titulo": "Título junto al video de presentación",
 *   "video_parrafos": ["párrafo 1", "párrafo 2"],
 *   "dea_video": "url de YouTube/Vimeo/Drive (opcional) — DEA, diapositiva
 *     DISTINTA de 'Presentación del curso': antes ambas compartían un solo
 *     campo 'video' (una mezclaba las dos cosas); ahora son dos
 *     diapositivas separadas, cada una con su propio video/texto",
 *   "dea_imagen": "url de imagen (opcional) — MODO ALTERNATIVO al video del
 *     DEA: en vez de 'dea_video', una imagen estática (pensada para un PNG
 *     con fondo transparente — se muestra tal cual, sin marco ni fondo
 *     oscuro detrás, para que se note la transparencia). Si 'dea_imagen'
 *     llega, GANA sobre 'dea_video' (se ignora el video) — mismo criterio
 *     que 'aprenderas_texto' sobre 'aprenderas': el propio JSON, con el
 *     campo que traiga, elige el diseño.",
 *   "dea_titulo": "Título junto al video/imagen del DEA",
 *   "dea_parrafos": ["párrafo 1", "párrafo 2"],
 *   "dea_descarga_url": "url opcional de descarga del material del DEA",
 *   "bienvenida": {
 *     "titulo": "...", "parrafos": ["...", "..."], "frase_destacada": "..."
 *   },
 *   "aprenderas": [{ "icono": "fa-xxx", "titulo": "...", "detalle": "..." }],
 *   "aprenderas_texto": ["párrafo 1", "párrafo 2"] — MODO ALTERNATIVO de
 *     "¿Qué aprenderás?": en vez de la grilla de tarjetas ("aprenderas"),
 *     un bloque de texto largo (para cursos que describen la ruta de
 *     aprendizaje como un párrafo extenso en vez de temas discretos) junto
 *     a una imagen opcional ("aprenderas_imagen"). Si "aprenderas_texto"
 *     llega con al menos un párrafo, GANA sobre "aprenderas" (se ignora la
 *     grilla de tarjetas) — el propio JSON, con el campo que traiga, elige
 *     el diseño; no hay un interruptor aparte que prender.
 *   "aprenderas_imagen": "url de imagen (opcional, solo con aprenderas_texto)
 *     — si falta, el bloque de texto ocupa el ancho completo",
 *   "tutorias": {
 *     "url_aula_virtual": "url del recurso de videollamada en Moodle
 *       (p. ej. mod/googlemeet/view.php?id=NNN) — SIEMPRE el mismo link,
 *       semana a semana; el recurso de Moodle es el que muestra ahí
 *       adentro a qué grabación/sesión entrar, el visor no lo sabe ni
 *       lo gestiona",
 *     "horario": [{ "dia": "Lunes|Martes|Miércoles|Jueves|Viernes|Sábado|
 *       Domingo", "inicio": "HH:MM", "fin": "HH:MM" }] — uno o más bloques
 *       semanales recurrentes (normalmente uno solo, pero puede haber
 *       varios, p. ej. lunes Y jueves) — todos comparten el mismo
 *       "url_aula_virtual" de arriba
 *   },
 *   "modulos": [{ "nombre": "...", "url": "...", "ilustracion": "url (opcional)",
 *                 "sectionid": "número opcional — ver 'Puente con Moodle' abajo" }],
 *   "secciones": "opcional — ver 'Secciones: mostrar/ocultar/reordenar' abajo",
 *   "diapositivas_extra": "opcional — ver 'Diapositivas custom' abajo"
 * }
 *
 * "modulos" es el mosaico real del curso en Moodle — un arreglo YA
 * ORDENADO tal como debe verse (p. ej. CONECTA, INCCA APOYO, Semana 1,
 * Semana 2...). La cantidad es dinámica (no hay un número fijo de
 * semanas). El ícono/número grande de cada panel NO es un campo del JSON:
 * se infiere del propio "nombre" (ver unitVisualMeta) reconociendo los
 * patrones reales del mosaico — "CONECTA" → ícono de foro, "APOYO" →
 * ícono de ayuda, "Semana N" → el número N en grande; cualquier otro
 * nombre cae en un ícono genérico. "ilustracion" sí es un campo de datos
 * (url de imagen, opcional) que se muestra en el panel expandido; si
 * falta, simplemente no se muestra ilustración. Al pulsar su CTA
 * "INICIAR MÓDULO" normalmente es un enlace real (target="_blank") a la
 * URL de esa sección en Moodle — el visor no reemplaza esa página, solo
 * la referencia (ver excepción del puente con Moodle, justo abajo).
 *
 * PUENTE CON MOODLE (opcional, vía "sectionid"): si el visor está
 * embebido dentro de la MISMA página de curso que contiene esos módulos
 * (típicamente formato de curso "Mosaicos"/format_tiles + el plugin
 * local_visorincca), en vez de abrir "url" en pestaña nueva le avisa a la
 * ventana padre por postMessage para que abra el mosaico nativo ahí
 * mismo. Ver initUnitCta() más abajo para el contrato exacto del mensaje
 * y el fallback (si no hay "sectionid", o no hay confirmación del padre
 * en 500ms, o el visor no está embebido — se abre "url" en pestaña nueva,
 * igual que siempre). "sectionid" es el id real de esa sección en Moodle;
 * sin él, el puente no puede identificar qué módulo abrir y el link se
 * comporta exactamente como si el campo no existiera.
 *
 * SECCIONES: mostrar/ocultar/reordenar (opcional, vía "secciones"). Por
 * defecto existen 9 diapositivas fijas, en este orden: hero, presentacion,
 * bienvenida, aprenderas, dea, docente, docente_tutor, tutorias, unidades
 * ("docente_tutor" además solo aparece si llegó "profesor_tutor", como
 * siempre). "secciones" deja controlar cada una desde el JSON, sin tocar
 * código:
 *
 *   "secciones": {
 *     "aprenderas": { "visible": false },
 *     "unidades":   { "orden": 0 },
 *     "docente":    { "orden": 1 }
 *   }
 *
 * Cada clave es el id de la diapositiva (ver la lista de arriba); ambos
 * campos son opcionales — "visible" (default true, o el default de
 * "docente_tutor" si no se especifica) y "orden" (default: su posición
 * en la lista de arriba, 0 a 7). "orden" comparte la misma numeración
 * con "diapositivas_extra" (ver abajo): el orden final de TODO el mazo
 * es el resultado de mezclar ambas listas y ordenar por "orden" — así se
 * puede intercalar una diapositiva custom entre dos fijas.
 *
 * EXCEPCIÓN — "hero" (la portada) es la única diapositiva que NO se
 * puede tocar desde "secciones": siempre existe, siempre visible, y
 * siempre es la primera, sin importar qué "visible"/"orden" le manden.
 * Es una decisión de diseño (siempre tiene que haber una portada, y sea
 * cual sea el resto del orden tiene que abrir el mazo) forzada en código
 * — no una convención que dependa de que el plugin "se porte bien".
 *
 * DIAPOSITIVAS CUSTOM (opcional, vía "diapositivas_extra"): agrega
 * diapositivas nuevas sin tocar el HTML/JS, insertando HTML/CSS directo
 * o un iframe:
 *
 *   "diapositivas_extra": [{
 *     "id": "webinar-cierre",        // único, obligatorio
 *     "tipo": "media",               // "media" o "pagina" (default: "media")
 *     "orden": 8,                    // opcional, ver arriba
 *     "visible": true,               // opcional, default true
 *     "titulo": "Webinar de cierre", // solo se usa/muestra en tipo "media"
 *     "descripcion": "...",          // solo se usa/muestra en tipo "media"
 *     "iframe": "https://...",       // el contenido: iframe (si llegan los dos, gana "iframe")
 *     "html": "<div>...</div>"       // o HTML/CSS de confianza, inyectado tal cual (mismo criterio que Moodle)
 *   }]
 *
 * Dos tipos:
 *   - "media": diapositiva normal (con márgenes, como "Docente" o
 *     "Tutorías") — muestra título + descripción + el iframe/html en un
 *     marco contenido, con un botón para abrirlo en un modal de pantalla
 *     completa.
 *   - "pagina": a pantalla completa, igual que "Unidades" — el iframe/
 *     html ocupa toda la diapositiva, sin título/descripción; solo
 *     quedan las flechas prev/next (y los puntos de abajo) para navegar.
 *
 * Ver construirSlides(), renderCustomSlides() y crearSlideCustom() más
 * abajo para la implementación completa.
 *
 * Todo lo que varía según la materia va en el JSON. Lo único que queda
 * fijo en el HTML son etiquetas de interfaz que nunca cambian (textos de
 * botones, nombre de secciones como "Unidades" o "Docente").
 * ------------------------------------------------------------------- */
(function () {
  "use strict";

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  /* ---------------------------------------------------------------------
   * 1. Estructura de diapositivas — combina las 8 fijas (diseño: existen
   *    en el HTML, con visibilidad/orden por defecto) con las diapositivas
   *    extra que traiga el JSON (datos.diapositivas_extra) y con los
   *    overrides de datos.secciones. Se recalcula una vez, con los datos
   *    ya cargados, antes de armar el resto del chrome (ver
   *    DOMContentLoaded al final del archivo). Contrato completo de
   *    "secciones" y "diapositivas_extra" documentado en el comentario de
   *    esquema al inicio del archivo.
   * ------------------------------------------------------------------- */
  // El ícono es puramente de diseño (para la barra flotante de abajo) —
  // no afecta el contenido ni se puede sobreescribir desde el JSON.
  const SLIDES_FIJAS = [
    { id: "hero", label: "Inicio", icon: "fa-house" },
    { id: "presentacion", label: "Presentación", icon: "fa-clapperboard" },
    { id: "bienvenida", label: "Bienvenida", icon: "fa-hand-holding-heart" },
    { id: "aprenderas", label: "Aprenderás", icon: "fa-route" },
    { id: "dea", label: "DEA", icon: "fa-compass" },
    { id: "docente", label: "Docente creador", icon: "fa-chalkboard-user" },
    { id: "docente_tutor", label: "Docente tutor", icon: "fa-user-tie" },
    { id: "tutorias", label: "Tutorías", icon: "fa-calendar-days" },
    { id: "unidades", label: "Unidades", icon: "fa-layer-group" }
  ];

  function construirSlides(datos) {
    const config = datos.secciones;

    const fijas = SLIDES_FIJAS.map((s, i) => {
      // "hero" es la portada: SIEMPRE existe y SIEMPRE es la primera —
      // no se puede ocultar ni reordenar desde "secciones", pase lo que
      // pase en el JSON. -Infinity garantiza que ningún "orden" (por
      // grande o negativo que sea) pueda colarse antes.
      if (s.id === "hero") {
        return { id: s.id, label: s.label, icon: s.icon, custom: null, visible: true, orden: -Infinity };
      }
      const override = config[s.id] || {};
      // "docente_tutor" es la única fija cuya visibilidad por defecto NO
      // es "siempre visible": sin override explícito, depende de si
      // llegó profesor_tutor (mismo comportamiento de siempre). Un
      // override explícito (true/false) en "secciones" manda por encima
      // de esa inferencia.
      const visibleDefault = s.id === "docente_tutor" ? Boolean(datos.profesor_tutor) : true;
      return {
        id: s.id,
        label: s.label,
        icon: s.icon,
        custom: null,
        visible: typeof override.visible === "boolean" ? override.visible : visibleDefault,
        orden: Number.isFinite(override.orden) ? override.orden : i
      };
    });

    const extra = datos.diapositivas_extra
      .filter((d) => d && d.id)
      .map((d, i) => ({
        id: `custom-${d.id}`,
        label: d.titulo || String(d.id),
        icon: d.tipo === "pagina" ? "fa-window-maximize" : "fa-photo-film",
        custom: d,
        visible: d.visible !== false,
        orden: Number.isFinite(d.orden) ? d.orden : SLIDES_FIJAS.length + i
      }));

    // Cada recurso "actividades" es una diapositiva más. Se ordenan entre
    // sí por "orden" (default: su posición en el array), pero como bloque
    // SIEMPRE van justo antes de "Unidades" — ver el splice de abajo.
    const acts = datos.recursos
      .filter((r) => r && r.tipo === "actividades")
      .map((r, i) => ({
        id: `actividades-${r.id}`,
        label: r.titulo,
        icon: "fa-list-check",
        custom: null,
        actividades: r,
        visible: r.visible !== false,
        orden: Number.isFinite(r.orden) ? r.orden : i
      }));

    let lista = fijas.concat(extra)
      .filter((s) => s.visible)
      .sort((a, b) => a.orden - b.orden);

    // Las actividades SIEMPRE van antes de "Unidades" (es "pon en práctica
    // lo aprendido" justo antes de entrar a los mosaicos). Si "unidades"
    // está oculta, van al final.
    const actsVisibles = acts.filter((s) => s.visible).sort((a, b) => a.orden - b.orden);
    if (actsVisibles.length) {
      const idxUnidades = lista.findIndex((s) => s.id === "unidades");
      lista.splice(idxUnidades === -1 ? lista.length : idxUnidades, 0, ...actsVisibles);
    }
    return lista;
  }
  let SLIDES = [];

  /* ---------------------------------------------------------------------
   * 2. Placeholders — SOLO se usan campo por campo cuando ese campo en
   *    particular no llegó en el JSON. A diferencia de la primera versión
   *    de este patrón (una etiqueta genérica tipo "Nombre del curso"),
   *    estos placeholders son EJEMPLOS con el formato/extensión real que
   *    debería tener cada campo — y varios funcionan además como
   *    instrucción de qué poner ahí — para que quien arma el JSON (o
   *    quien prueba el visor sin datos todavía) vea de una cómo se ve
   *    cada sección llena, no una pantalla vacía. Siguen siendo
   *    OBVIAMENTE de ejemplo (marcados "(ejemplo)"/"Ejemplo:" a propósito)
   *    para que nunca se puedan confundir con datos reales de un curso.
   * ------------------------------------------------------------------- */
  const SIN_DATOS = {
    curso: "Nombre del curso (ejemplo: Ingeniería de Sistemas)",
    resumen: "Ejemplo de resumen: un párrafo breve (2-3 líneas) que cuenta de qué trata el curso, a quién está dirigido y qué lo hace valioso — la idea es que alguien lo lea en 10 segundos y entienda si le sirve.",
    insignias: [
      { icono: "fa-clock", texto: "Duración: 8 semanas (ejemplo)" },
      { icono: "fa-laptop", texto: "100% virtual (ejemplo)" },
      { icono: "fa-certificate", texto: "Con certificado (ejemplo)", destacada: true }
    ],
    unidades: 4,
    horas_trabajo: 96,
    profesor: {
      nombre: "Nombre del docente (ejemplo: María Fernanda Gómez)",
      foto: "https://i.pravatar.cc/300?img=12",
      rol: "Cargo/título profesional del docente (ejemplo: Magíster en Educación)",
      bio: [
        "Ejemplo de biografía: profesional con trayectoria en el área del curso, docente universitario/a y especialista en el tema.",
        "Un segundo párrafo puede sumar experiencia relevante, publicaciones o proyectos destacados — no hace falta que sea largo."
      ],
      etiquetas: [
        { icono: "fa-graduation-cap", texto: "Ejemplo: Magíster en..." },
        { icono: "fa-briefcase", texto: "Ejemplo: 10 años de experiencia" }
      ],
      video: "https://www.youtube.com/watch?v=aqz-KE-bpKQ"
    },
    video: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
    video_titulo: "Título del video (ejemplo: Presentación del curso)",
    video_parrafos: [
      "Ejemplo: un párrafo breve presentando el video — de qué trata y qué va a entender el estudiante al verlo.",
      "Un segundo párrafo puede sumar contexto, como la duración o los temas cubiertos."
    ],
    dea_video: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
    dea_titulo: "Título del DEA (ejemplo: DEA · Diseño de Experiencia para el Aprendizaje)",
    dea_parrafos: [
      "Ejemplo de párrafo del DEA: explica en qué consiste el Diseño de Experiencia para el Aprendizaje de este curso — el mapa que guía cada paso del recorrido.",
      "Un segundo párrafo puede sumar qué va a encontrar el estudiante ahí (herramientas, recursos, estrategias)."
    ],
    dea_descarga_url: "",
    bienvenida: {
      titulo: "¡Bienvenido/a al curso! (ejemplo de título)",
      parrafos: [
        "Ejemplo de bienvenida: este espacio es para saludar a tus estudiantes y contarles, en 2-3 párrafos cortos, qué encontrarán en el curso.",
        "Puede incluir cómo está organizado, qué se espera de su participación, y un cierre motivador antes de empezar."
      ],
      frase_destacada: "Una frase inspiradora que resuma el espíritu del curso (ejemplo)."
    },
    aprenderas: [
      { icono: "fa-star", titulo: "Temática 1 (ejemplo)", detalle: "Acá van los detalles de esta temática: qué conceptos se cubren y qué va a saber hacer el estudiante al dominarla." },
      { icono: "fa-star", titulo: "Temática 2 (ejemplo)", detalle: "Ejemplo de detalle: describe en un par de líneas el contenido de este bloque temático." },
      { icono: "fa-star", titulo: "Temática 3 (ejemplo)", detalle: "Podés agregar tantas temáticas como el curso necesite — no hay un número fijo." }
    ],
    tutorias: {
      url_aula_virtual: "#",
      horario: [
        { dia: "Lunes", inicio: "05:00", fin: "06:00" }
      ]
    },
    modulos: [
      { nombre: "CONECTA (ejemplo)", url: "#" },
      { nombre: "INCCA APOYO (ejemplo)", url: "#" },
      { nombre: "Semana 1 (ejemplo)", url: "#" },
      { nombre: "Semana 2 (ejemplo)", url: "#" }
    ],
    // "recursos" — actividades del curso que viven FUERA de los mosaicos
    // (sección principal de Moodle). Cada entrada { tipo:"actividades",
    // items:[...] } se dibuja como su propia diapositiva. El ejemplo trae
    // dos: una con varias actividades (diseño de "ruta") y una con una
    // sola (diseño ampliado). Todo marcado "(ejemplo)".
    recursos: [
      {
        id: "curso",
        tipo: "actividades",
        titulo: "Actividades del curso (ejemplo)",
        orden: 8,
        items: [
          {
            nombre: "Cuestionario diagnóstico (ejemplo)",
            tipo: "quiz",
            link: "#",
            descripcion: "Ejemplo de descripción en texto plano: 10 preguntas de opción múltiple, 20 minutos, 2 intentos.\n\nUna línea en blanco separa los párrafos.",
            descripcion_html: false
          },
          {
            nombre: "Foro de presentación (ejemplo)",
            tipo: "foro",
            link: "#",
            descripcion: "Ejemplo: preséntate ante el grupo y comenta al menos dos aportes de tus compañeros antes del cierre de la semana.",
            descripcion_html: false
          },
          {
            nombre: "Entrega con instrucciones en HTML (ejemplo)",
            tipo: "entrega",
            link: "#",
            descripcion: "<p>Ejemplo de descripción en <strong>HTML</strong>: se renderiza embebida en un marco propio, con scroll y alto acotado.</p><ul><li>Formato de entrega: PDF</li><li>Peso en la nota: 20%</li></ul>",
            descripcion_html: true
          },
          {
            nombre: "Rúbrica de autoevaluación (ejemplo, sin descripción ni enlace)",
            tipo: "tarea"
          }
        ]
      },
      {
        id: "examen",
        tipo: "actividades",
        titulo: "Examen final (ejemplo)",
        orden: 9,
        items: [
          {
            nombre: "Examen integral del curso (ejemplo)",
            tipo: "examen",
            link: "#",
            descripcion: "Ejemplo del diseño de UNA sola actividad: la tarjeta arranca abierta, el número pasa a medallón y aparece el botón grande \"Ir a la actividad\".\n\n25 preguntas, 90 minutos, un único intento.",
            descripcion_html: false
          }
        ]
      }
    ]
  };
  // Placeholder por-campo para cada módulo del mosaico (CONECTA, INCCA
  // APOYO, Semana N...) — se aplica ítem a ítem, igual que el resto del
  // patrón, para que un módulo sin url siga viéndose sin romper el panel.
  const SIN_DATOS_MODULO = { nombre: "Nombre del módulo (ejemplo)", url: "#", ilustracion: "", sectionid: null };

  /* ---------------------------------------------------------------------
   * 2b. ACTIVIDADES (datos.recursos) — actividades del curso que viven
   *     FUERA de los mosaicos. Cada recurso { tipo:"actividades", items }
   *     es su propia diapositiva (ver construirSlides/crearSlideActividades).
   *     El "tipo" de cada actividad (quiz/tarea/foro/taller/entrega/examen)
   *     define color + ícono + etiqueta, nada del comportamiento: si no
   *     llega o no es válido, se infiere del módulo de Moodle en el link y,
   *     si tampoco, cae en "tarea".
   * ------------------------------------------------------------------- */
  const ACT_TYPES = ["quiz", "tarea", "foro", "taller", "entrega", "examen"];
  const ACT_TYPE_META = {
    quiz:    { label: "Quiz",    icon: "fa-circle-question" },
    tarea:   { label: "Tarea",   icon: "fa-file-pen" },
    foro:    { label: "Foro",    icon: "fa-comments" },
    taller:  { label: "Taller",  icon: "fa-screwdriver-wrench" },
    entrega: { label: "Entrega", icon: "fa-cloud-arrow-up" },
    examen:  { label: "Examen",  icon: "fa-file-circle-check" }
  };
  function inferActType(tipo, link) {
    if (ACT_TYPES.indexOf(tipo) !== -1) return tipo;
    const l = String(link || "").toLowerCase();
    if (l.indexOf("mod/quiz/") !== -1) return "quiz";
    if (l.indexOf("mod/forum/") !== -1) return "foro";
    if (l.indexOf("mod/workshop/") !== -1) return "taller";
    if (l.indexOf("mod/assign/") !== -1) return "tarea";
    return "tarea";
  }
  // Escapa una descripción SOLO cuando el JSON dice explícitamente que es
  // texto plano (descripcion_html !== true) — así un "<" accidental nunca
  // se interpreta como marcado.
  function escaparHtml(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  // Normaliza cada recurso "actividades" campo a campo. Un recurso sin
  // tipo "actividades" (u otro tipo que este visor todavía no dibuja) se
  // descarta en silencio — nunca rompe el mazo.
  function normalizarRecursos(arr) {
    return (Array.isArray(arr) ? arr : []).map((r, i) => {
      if (!r || r.tipo !== "actividades") return null;
      return {
        id: (r.id && String(r.id)) || `recurso-${i + 1}`,
        tipo: "actividades",
        titulo: r.titulo || "Actividades",
        visible: r.visible !== false,
        orden: Number.isFinite(r.orden) ? r.orden : null,
        items: (Array.isArray(r.items) ? r.items : []).map((it) => ({
          nombre: (it && it.nombre) || "",
          link: (it && it.link) || "",
          descripcion: (it && it.descripcion) || "",
          descripcionHtml: !!(it && it.descripcion_html),
          tipoActividad: inferActType(it && it.tipo, it && it.link)
        }))
      };
    }).filter(Boolean);
  }

  /* ---------------------------------------------------------------------
   * 3. Lectura de datos desde window.name (JSON) — con try/catch de rescate
   * ------------------------------------------------------------------- */
  function leerDatosDesdeWindowName() {
    try {
      if (!window.name) return null;
      const recibidos = JSON.parse(window.name);
      if (!recibidos || typeof recibidos !== "object") return null;
      return recibidos;
    } catch (e) {
      return null;
    }
  }

  // "tutorias" necesita una regla propia dentro del patrón de placeholders:
  // no alcanza con "¿vino o no vino el campo?", porque un curso real puede
  // no tener tutorías programadas todavía (horario explícitamente vacío) —
  // eso debe verse como "sin tutorías", no como el ejemplo ilustrativo. Si
  // la clave ni siquiera llegó, sí se usa el ejemplo (mismo criterio que el
  // resto del patrón).
  function normalizarTutorias(recibidos) {
    if (recibidos.tutorias === undefined) return SIN_DATOS.tutorias;
    const t = (recibidos.tutorias && typeof recibidos.tutorias === "object" && !Array.isArray(recibidos.tutorias))
      ? recibidos.tutorias
      : {};
    const horario = Array.isArray(t.horario)
      ? t.horario.filter((h) => h && h.dia && h.inicio && h.fin)
      : [];
    return { url_aula_virtual: t.url_aula_virtual || "#", horario };
  }

  // Completa, CAMPO POR CAMPO, lo que no haya llegado en el JSON con el
  // placeholder correspondiente — así datos parciales muestran lo real
  // que sí llegó y dejan a la vista, sin confundir, lo que todavía falta.
  function obtenerDatos() {
    const recibidosRaw = leerDatosDesdeWindowName();
    const recibidos = recibidosRaw || {};
    // "sin ningún dato" = el visor se abrió suelto para previsualizar (no
    // hay window.name, o vino vacío/corrupto). Solo en ESE caso las
    // actividades caen al ejemplo de SIN_DATOS. Si el curso mandó datos
    // reales (aunque sea solo el nombre) pero no la clave "recursos", eso
    // significa "este curso no tiene actividades sueltas" → no se muestran
    // (ni diapositiva, ni CTA, ni stat). Mismo criterio que normalizarTutorias.
    const sinNingunDato = !recibidosRaw || Object.keys(recibidosRaw).length === 0;
    return {
      curso: recibidos.curso || SIN_DATOS.curso,
      resumen: recibidos.resumen || SIN_DATOS.resumen,
      insignias: Array.isArray(recibidos.insignias) ? recibidos.insignias : SIN_DATOS.insignias,
      unidades: Number.isFinite(recibidos.unidades) ? recibidos.unidades : SIN_DATOS.unidades,
      horas_trabajo: Number.isFinite(recibidos.horas_trabajo) ? recibidos.horas_trabajo : SIN_DATOS.horas_trabajo,
      profesor: Object.assign({}, SIN_DATOS.profesor, recibidos.profesor || {}),
      // A diferencia de "profesor" (siempre existe, con placeholders si
      // falta), "profesor_tutor" es null cuando el JSON no trae esa clave
      // — el curso puede no tener ese rol asignado todavía — y eso es lo
      // que decide si la diapositiva "Docente tutor" existe o no. Si SÍ
      // llega la clave (aunque venga casi vacía), se completa campo a
      // campo igual que el resto del patrón.
      profesor_tutor: (recibidos.profesor_tutor && typeof recibidos.profesor_tutor === "object")
        ? Object.assign({}, SIN_DATOS.profesor, recibidos.profesor_tutor)
        : null,
      video: recibidos.video || SIN_DATOS.video,
      video_titulo: recibidos.video_titulo || SIN_DATOS.video_titulo,
      video_parrafos: Array.isArray(recibidos.video_parrafos) ? recibidos.video_parrafos : SIN_DATOS.video_parrafos,
      dea_video: recibidos.dea_video || SIN_DATOS.dea_video,
      dea_imagen: recibidos.dea_imagen || "",
      dea_titulo: recibidos.dea_titulo || SIN_DATOS.dea_titulo,
      dea_parrafos: Array.isArray(recibidos.dea_parrafos) ? recibidos.dea_parrafos : SIN_DATOS.dea_parrafos,
      dea_descarga_url: recibidos.dea_descarga_url || SIN_DATOS.dea_descarga_url,
      bienvenida: Object.assign({}, SIN_DATOS.bienvenida, recibidos.bienvenida || {}),
      aprenderas: Array.isArray(recibidos.aprenderas) ? recibidos.aprenderas : SIN_DATOS.aprenderas,
      // Modo alternativo de "aprenderás" (texto largo + imagen opcional) —
      // sin placeholder propio a propósito: su ausencia simplemente
      // significa "usar el modo de tarjetas de siempre" (que sí tiene su
      // propio placeholder completo, ver "aprenderas" arriba).
      aprenderas_texto: (Array.isArray(recibidos.aprenderas_texto) && recibidos.aprenderas_texto.length) ? recibidos.aprenderas_texto : null,
      aprenderas_imagen: recibidos.aprenderas_imagen || "",
      tutorias: normalizarTutorias(recibidos),
      modulos: (Array.isArray(recibidos.modulos) ? recibidos.modulos : SIN_DATOS.modulos).map((m) => ({
        nombre: (m && m.nombre) || SIN_DATOS_MODULO.nombre,
        url: (m && m.url) || SIN_DATOS_MODULO.url,
        ilustracion: (m && m.ilustracion) || inferirIlustracion(m && m.nombre) || SIN_DATOS_MODULO.ilustracion,
        sectionid: (m && m.sectionid) || SIN_DATOS_MODULO.sectionid
      })),
      // Config estructural (qué diapositivas mostrar, en qué orden) — no
      // es "contenido" con placeholder, es config; por eso el default es
      // simplemente "vacío" (sin overrides / sin diapositivas extra), no
      // un objeto de ejemplo. Ver construirSlides().
      secciones: (recibidos.secciones && typeof recibidos.secciones === "object") ? recibidos.secciones : {},
      diapositivas_extra: Array.isArray(recibidos.diapositivas_extra) ? recibidos.diapositivas_extra : [],
      // Ver "sinNingunDato" arriba: el ejemplo solo aplica en preview.
      // Con datos reales, "recursos" ausente = curso sin actividades sueltas.
      recursos: normalizarRecursos(
        Array.isArray(recibidos.recursos) ? recibidos.recursos
          : (sinNingunDato ? SIN_DATOS.recursos : [])
      )
    };
  }

  function toEmbedUrl(url) {
    if (!url) return "";
    const yt = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\/)([\w-]{11})/);
    if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
    const vimeo = url.match(/vimeo\.com\/(\d+)/);
    if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
    const drive = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
    if (drive) return `https://drive.google.com/file/d/${drive[1]}/preview`;
    return url;
  }

  /* ---------------------------------------------------------------------
   * 4. Utilidades
   * ------------------------------------------------------------------- */
  function capitalizar(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  }
  function formatHora12(hhmm) {
    const partes = String(hhmm || "").split(":");
    const h = Number(partes[0]);
    const m = Number(partes[1]) || 0;
    if (!Number.isFinite(h)) return hhmm || "";
    const h12 = ((h + 11) % 12) + 1;
    return `${h12}:${String(m).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
  }
  const DIA_INDICE = {
    domingo: 0, lunes: 1, martes: 2, miercoles: 3, "miércoles": 3,
    jueves: 4, viernes: 5, sabado: 6, "sábado": 6
  };
  // Próxima ocurrencia de UN bloque horario recurrente ("Jueves 18:00-
  // 20:30") a partir de "ahora": si "ahora" cae dentro de esa franja hoy,
  // la marca "enVivo"; si ya pasó hoy, la próxima es en 7 días, no hoy.
  function proximaOcurrencia(bloque, ahora) {
    const diaIdx = DIA_INDICE[String(bloque.dia || "").toLowerCase().trim()];
    if (diaIdx === undefined) return null;
    const [hi, mi] = bloque.inicio.split(":").map(Number);
    const [hf, mf] = bloque.fin.split(":").map(Number);
    if (!Number.isFinite(hi) || !Number.isFinite(hf)) return null;
    let deltaDias = (diaIdx - ahora.getDay() + 7) % 7;
    const inicioHoy = new Date(ahora); inicioHoy.setHours(hi, mi || 0, 0, 0);
    const finHoy = new Date(ahora); finHoy.setHours(hf, mf || 0, 0, 0);
    if (deltaDias === 0) {
      if (ahora >= inicioHoy && ahora <= finHoy) return { bloque, enVivo: true, esHoy: true, fecha: inicioHoy };
      if (ahora > finHoy) deltaDias = 7;
    }
    const fecha = new Date(ahora);
    fecha.setDate(fecha.getDate() + deltaDias);
    fecha.setHours(hi, mi || 0, 0, 0);
    return { bloque, enVivo: false, esHoy: deltaDias === 0, fecha };
  }
  // De todos los bloques semanales, cuál está pasando "ahora" (si hay una
  // clase en curso) o cuál es el siguiente en llegar — alimenta el aviso
  // de "en vivo ahora" / "próxima sesión" de la tarjeta de tutorías.
  function estadoTutorias(horario) {
    const ahora = new Date();
    const ocurrencias = horario.map((b) => proximaOcurrencia(b, ahora)).filter(Boolean);
    if (!ocurrencias.length) return null;
    const enVivo = ocurrencias.find((o) => o.enVivo);
    if (enVivo) return enVivo;
    ocurrencias.sort((a, b) => a.fecha - b.fecha);
    return ocurrencias[0];
  }

  function replayStagger(root) {
    $$(".stagger", root).forEach((el) => {
      el.classList.remove("is-playing");
      void el.offsetWidth; // fuerza reflow para reiniciar la animación
      el.classList.add("is-playing");
    });
  }

  /* ---------------------------------------------------------------------
   * 5. Motor del deck — navegación entre diapositivas
   * ------------------------------------------------------------------- */
  const deck = {
    slideEls: [],
    current: 0,
    total: 0,

    init() {
      this.slideEls = SLIDES.map((s) => document.getElementById(s.id));
      this.total = this.slideEls.length;
      this.slideEls.forEach((el, i) => el.setAttribute("aria-hidden", i === 0 ? "false" : "true"));
      this.slideEls[0].classList.add("is-active");
      this.updateChrome();
      replayStagger(this.slideEls[0]);
      this.runSlideExtras(SLIDES[0].id);
    },

    goTo(index) {
      const total = this.total;
      const idx = ((index % total) + total) % total; // navegación circular
      if (idx === this.current) return;
      const dir = this.directionTo(idx);
      const oldEl = this.slideEls[this.current];
      const newEl = this.slideEls[idx];

      newEl.classList.add(dir > 0 ? "is-enter-right" : "is-enter-left");
      void newEl.offsetWidth;
      oldEl.classList.remove("is-active");
      oldEl.classList.add(dir > 0 ? "is-exit-left" : "is-exit-right");
      newEl.classList.remove(dir > 0 ? "is-enter-right" : "is-enter-left");
      newEl.classList.add("is-active");
      oldEl.setAttribute("aria-hidden", "true");
      newEl.setAttribute("aria-hidden", "false");

      const cleanupClasses = ["is-exit-left", "is-exit-right", "is-enter-left", "is-enter-right"];
      setTimeout(() => {
        cleanupClasses.forEach((c) => { oldEl.classList.remove(c); newEl.classList.remove(c); });
      }, 560);

      this.current = idx;
      this.updateChrome();
      replayStagger(newEl);
      this.runSlideExtras(SLIDES[idx].id);
    },

    directionTo(idx) {
      const forward = (idx - this.current + this.total) % this.total;
      const backward = (this.current - idx + this.total) % this.total;
      return forward <= backward ? 1 : -1;
    },

    next() { this.goTo(this.current + 1); },
    prev() { this.goTo(this.current - 1); },

    updateChrome() {
      $$(".floatnav-item").forEach((item, i) => item.classList.toggle("is-active", i === this.current));
    },

    runSlideExtras(id) {
      if (id === "hero") initCounters($("#hero"));
    }
  };

  /* ---------------------------------------------------------------------
   * 6. Render — chrome de navegación (barra flotante con íconos, flechas)
   * ------------------------------------------------------------------- */
  function renderChrome() {
    $("#deckFloatNav").innerHTML = SLIDES.map((s, i) => `
      <button class="floatnav-item" data-goto="${i}" aria-label="Ir a ${s.label}" title="${s.label}">
        <i class="fa-solid ${s.icon}" aria-hidden="true"></i>
        <span class="floatnav-item-label">${s.label}</span>
      </button>
    `).join("");

    $$("[data-goto]").forEach((btn) => {
      btn.addEventListener("click", () => deck.goTo(Number(btn.dataset.goto)));
    });

    $("#prevBtn").addEventListener("click", () => deck.prev());
    $("#nextBtn").addEventListener("click", () => deck.next());
  }

  function initHeroCue() {
    const wire = (id, slideId) => {
      const btn = $(`#${id}`);
      if (!btn) return;
      const targetIndex = SLIDES.findIndex((s) => s.id === slideId);
      btn.addEventListener("click", () => deck.goTo(targetIndex));
    };
    wire("heroLearnCue", "aprenderas");
    wire("heroTutoriasCue", "tutorias");
  }

  function initGotoUnitsButtons() {
    const targetIndex = SLIDES.findIndex((s) => s.id === "unidades");
    ["heroUnitsCue", "presentacionUnitsCue", "deaUnitsCue"].forEach((id) => {
      const btn = $(`#${id}`);
      if (btn) btn.addEventListener("click", () => deck.goTo(targetIndex));
    });
  }

  function initKeyboard() {
    document.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); deck.next(); }
      else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); deck.prev(); }
      else if (e.key === "Home") { e.preventDefault(); deck.goTo(0); }
      else if (e.key === "End") { e.preventDefault(); deck.goTo(deck.total - 1); }
    });
  }

  function initSwipe() {
    const el = $("#slides");
    let sx = 0, sy = 0, tracking = false;
    el.addEventListener("touchstart", (e) => {
      sx = e.touches[0].clientX; sy = e.touches[0].clientY; tracking = true;
    }, { passive: true });
    el.addEventListener("touchend", (e) => {
      if (!tracking) return;
      tracking = false;
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.3) {
        dx < 0 ? deck.next() : deck.prev();
      }
    }, { passive: true });
  }

  /* ---------------------------------------------------------------------
   * 7. Render — Hero / Bienvenida / Docente (a partir del JSON)
   * ------------------------------------------------------------------- */
  // Se usa para el docente creador (siempre presente) y el docente tutor
  // (solo si el JSON trae "profesor_tutor") — misma tarjeta, mismos ids
  // con prefijo distinto ("teacher"/"tutor") en el HTML de cada slide.
  function renderTeacherCard(idPrefix, profesor) {
    const avatar = $(`#${idPrefix}Avatar`);
    avatar.src = profesor.foto || `https://ui-avatars.com/api/?name=${encodeURIComponent(profesor.nombre || "Docente")}&background=E2E6E9&color=0B349D&size=300`;
    avatar.alt = profesor.nombre || "Docente del curso";
    avatar.onerror = () => {
      avatar.onerror = null;
      avatar.src = "https://ui-avatars.com/api/?name=Docente&background=E2E6E9&color=0B349D&size=300";
    };
    $(`#${idPrefix}Name`).textContent = profesor.nombre || "Docente del curso";
    $(`#${idPrefix}Role`).textContent = profesor.rol || "";
    $(`#${idPrefix}Role`).hidden = !profesor.rol;
    $(`#${idPrefix}Bio`).innerHTML = (profesor.bio || []).map((p) => `<p>${p}</p>`).join("");
    $(`#${idPrefix}Tags`).innerHTML = (profesor.etiquetas || []).map((t) => `
      <span class="teacher-tag"><i class="fa-solid ${t.icono || "fa-tag"}" aria-hidden="true"></i> ${t.texto}</span>
    `).join("");
    $(`#${idPrefix}Media`).classList.toggle("has-video", Boolean(profesor.video));
    if (profesor.video) {
      $(`#${idPrefix}Video`).src = toEmbedUrl(profesor.video);
      $(`#${idPrefix}VideoFrame`).hidden = false;
    } else {
      $(`#${idPrefix}VideoFrame`).hidden = true;
    }
  }

  function renderHeroYBienvenidaYDocente(datos) {
    document.title = `${datos.curso} — U.INCCA`;
    $("#courseName").textContent = datos.curso || "Curso sin nombre";
    $("#heroResumen").textContent = datos.resumen || "";

    $("#heroBadges").innerHTML = (datos.insignias || []).map((b) => `
      <span class="hero-badge ${b.destacada ? "hero-badge--solid" : ""}"><i class="fa-solid ${b.icono || "fa-circle"}" aria-hidden="true"></i> ${b.texto}</span>
    `).join("");

    $("#statUnidades").dataset.counter = datos.unidades;
    $("#statHoras").dataset.counter = datos.horas_trabajo;

    // Docente creador (+ docente tutor, si el JSON lo trae — ver renderTeacherCard)
    renderTeacherCard("teacher", datos.profesor);
    if (datos.profesor_tutor) renderTeacherCard("tutor", datos.profesor_tutor);

    // Bienvenida — con frase_destacada se muestra la .quote-card de
    // siempre; sin ella, en vez de dejar la columna derecha vacía se
    // muestra la escena de figuras geométricas (ver initWelcomeGeo()).
    const tieneFrase = !!datos.bienvenida.frase_destacada;
    $("#bienvenidaTitulo").textContent = datos.bienvenida.titulo || "¡Bienvenidos al curso!";
    $("#bienvenidaParrafos").innerHTML = (datos.bienvenida.parrafos || []).map((p) => `<p>${p}</p>`).join("");
    $("#bienvenidaFrase").textContent = datos.bienvenida.frase_destacada || "";
    $(".quote-card").hidden = !tieneFrase;
    $("#welcomeGeo").hidden = tieneFrase;
    $("#bienvenida").classList.toggle("has-geo", !tieneFrase);

    // Presentación del curso (título + video grande, sin el DEA — ver renderDea())
    $("#presentacionTitulo").textContent = datos.video_titulo || "";
    $("#presentacionParrafos").innerHTML = (datos.video_parrafos || []).map((p) => `<p>${p}</p>`).join("");
    if (datos.video) {
      $("#presentacionVideo").src = toEmbedUrl(datos.video);
      $("#presentacionVideoFrame").hidden = false;
    } else {
      $("#presentacionVideoFrame").hidden = true;
    }

    renderDea(datos);

    // Contadores del hero
    $("#statModulos").dataset.counter = datos.modulos.length;
    $("#statTutorias").dataset.counter = datos.tutorias.horario.length;
  }

  // DEA (Diseño de Experiencia para el Aprendizaje) — diapositiva propia,
  // separada de "Presentación del curso": antes compartían un solo campo
  // "video" (una diapositiva hacía de las dos cosas a la vez); ahora cada
  // una tiene su propio video/título/párrafos independientes.
  function renderDea(datos) {
    $("#deaTitulo").textContent = datos.dea_titulo || "";
    $("#deaParrafos").innerHTML = (datos.dea_parrafos || []).map((p) => `<p>${p}</p>`).join("");
    // "dea_imagen" es el modo alternativo a "dea_video" (misma idea que
    // aprenderas_texto vs aprenderas): si llega imagen, gana sobre el
    // video — nunca se muestran los dos a la vez.
    if (datos.dea_imagen) {
      $("#deaImagen").src = datos.dea_imagen;
      $("#deaImagenFrame").hidden = false;
      $("#deaVideoFrame").hidden = true;
    } else if (datos.dea_video) {
      $("#deaVideo").src = toEmbedUrl(datos.dea_video);
      $("#deaVideoFrame").hidden = false;
      $("#deaImagenFrame").hidden = true;
    } else {
      $("#deaVideoFrame").hidden = true;
      $("#deaImagenFrame").hidden = true;
    }
    const descargaBtn = $("#deaDescargaBtn");
    if (datos.dea_descarga_url) {
      descargaBtn.href = datos.dea_descarga_url;
      descargaBtn.hidden = false;
    } else {
      descargaBtn.hidden = true;
    }
  }

  /* ---------------------------------------------------------------------
   * 8. Render — "¿Qué aprenderás?"
   * Dos diseños posibles, elegidos por la FORMA del dato (sin un
   * interruptor aparte en el JSON): "aprenderas_texto" con al menos un
   * párrafo gana y pinta el modo texto largo + imagen opcional; si no
   * llegó, se usa siempre el modo de tarjetas de siempre ("aprenderas").
   * ------------------------------------------------------------------- */
  function renderLearnCards(aprenderas) {
    const grid = $("#learnGrid");
    grid.innerHTML = aprenderas.length ? aprenderas.map((item) => `
      <div class="learn-card" tabindex="0" role="button" aria-expanded="false">
        <div class="learn-card-icon"><i class="fa-solid ${item.icono || "fa-star"}" aria-hidden="true"></i></div>
        <div class="learn-card-title">${item.titulo}</div>
        <div class="learn-card-hint"><i class="fa-solid fa-arrows-up-down" aria-hidden="true"></i> Toca para expandir</div>
        <div class="learn-card-overlay"><p>${item.detalle}</p></div>
      </div>
    `).join("") : `<div class="activity-empty"><i class="fa-solid fa-route" aria-hidden="true"></i>Este recurso todavía no tiene ruta de aprendizaje.</div>`;

    function toggle(card) {
      const willOpen = !card.classList.contains("is-open");
      $$(".learn-card", grid).forEach((c) => { c.classList.remove("is-open"); c.setAttribute("aria-expanded", "false"); });
      if (willOpen) { card.classList.add("is-open"); card.setAttribute("aria-expanded", "true"); }
    }

    $$(".learn-card", grid).forEach((card) => {
      card.addEventListener("click", () => toggle(card));
      card.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(card); } });
    });
  }

  function renderLearnTexto(parrafos, imagen) {
    $("#learnText").innerHTML = parrafos.map((p) => `<p>${p}</p>`).join("");
    const wrap = $("#learnTextImageWrap");
    const textGrid = $("#learnTextGrid");
    if (imagen) {
      $("#learnTextImage").src = imagen;
      wrap.hidden = false;
      textGrid.classList.remove("learn-text-grid--full");
    } else {
      wrap.hidden = true;
      textGrid.classList.add("learn-text-grid--full");
    }
  }

  function renderLearn(datos) {
    const modoTexto = Array.isArray(datos.aprenderas_texto) && datos.aprenderas_texto.length > 0;
    $("#learnGrid").hidden = modoTexto;
    $("#learnSub").hidden = modoTexto;
    $("#learnTextGrid").hidden = !modoTexto;
    if (modoTexto) {
      renderLearnTexto(datos.aprenderas_texto, datos.aprenderas_imagen);
    } else {
      renderLearnCards(datos.aprenderas);
    }
  }

  /* ---------------------------------------------------------------------
   * 9. Render — Tutorías (horario semanal recurrente + acceso al aula)
   * Ya no hay grabaciones ni link por sesión: el curso entrega UN solo
   * link (a un recurso de Moodle, típicamente mod/googlemeet) + uno o
   * más bloques "día de la semana + hora" recurrentes que comparten ese
   * mismo link — es Moodle quien decide qué mostrar ahí adentro (entrar
   * en vivo o ver la grabación), el visor no gestiona esa lógica.
   * ------------------------------------------------------------------- */

  
  function renderTutorias(tutorias) {
    const card = $("#meetCard");
    const empty = $("#meetEmpty");
    const horario = tutorias.horario || [];

    if (!horario.length) {
      card.hidden = true;
      empty.hidden = false;
      return;
    }
    card.hidden = false;
    empty.hidden = true;

    $("#meetScheduleList").innerHTML = horario.map((b) => `
      <div class="meet-slot">
        <span class="meet-slot-day"><i class="fa-solid fa-calendar-day" aria-hidden="true"></i> ${capitalizar(b.dia)}</span>
        <span class="meet-slot-time"><i class="fa-regular fa-clock" aria-hidden="true"></i> ${formatHora12(b.inicio)} – ${formatHora12(b.fin)}</span>
      </div>
    `).join("");

    // Aviso dinámico ("en vivo ahora" / "próxima sesión: ..."), calculado
    // en cada render a partir de la hora actual — no es un campo del JSON.
    const estado = estadoTutorias(horario);
    const next = $("#meetNext");
    if (!estado) {
      next.hidden = true;
    } else if (estado.enVivo) {
      next.hidden = false;
      next.className = "meet-next meet-next--live";
      next.innerHTML = `<span class="meet-live-dot" aria-hidden="true"></span> Clase en vivo ahora`;
    } else {
      next.hidden = false;
      next.className = "meet-next";
      const cuando = estado.esHoy ? "Hoy" : capitalizar(estado.bloque.dia);
      next.innerHTML = `<i class="fa-regular fa-clock" aria-hidden="true"></i> Próxima sesión: ${cuando} · ${formatHora12(estado.bloque.inicio)}`;
    }

    $("#meetCtaBtn").href = tutorias.url_aula_virtual || "#";
  }

  /* ---------------------------------------------------------------------
   * 10. Render — Unidades (acordeón horizontal de módulos)
   * Cada módulo (CONECTA, INCCA APOYO, Semana N...) es un panel-acordeón:
   * clic para expandir/contraer, y su CTA "INICIAR MÓDULO" es un <a> real
   * (target="_blank") a la url del módulo — no dispara lógica propia, solo
   * navega, igual que cualquier enlace normal de Moodle.
   * ------------------------------------------------------------------- */
  // Paleta institucional del más claro al más oscuro (mismos tonos que
  // --gradient-institutional). Cada panel recibe UN color sólido tomado de
  // un punto de este degradé según su posición (índice/total) — no el
  // degradé completo — para que se note la progresión clara→oscura Y la
  // separación/forma de cada panel a la vez, en vez de una sola mancha
  // continua o colores sueltos sin relación entre sí.


  const UNIT_GRADIENT_STOPS = [
    { t: 0, rgb: [101, 203, 227] },   // light-cyan
    { t: 0.42, rgb: [43, 139, 250] }, // dodger-blue
    { t: 0.70, rgb: [11, 52, 157] },  // royal-blue
    { t: 1, rgb: [4, 12, 56] }        // oxford-blue
  ];
  function unitColorAt(t) {
    t = Math.max(0, Math.min(1, t));
    for (let i = 0; i < UNIT_GRADIENT_STOPS.length - 1; i++) {
      const a = UNIT_GRADIENT_STOPS[i], b = UNIT_GRADIENT_STOPS[i + 1];
      if (t >= a.t && t <= b.t) {
        const localT = (t - a.t) / (b.t - a.t || 1);
        const rgb = a.rgb.map((c, idx) => Math.round(c + (b.rgb[idx] - c) * localT));
        return `rgb(${rgb.join(",")})`;
      }
    }
    return `rgb(${UNIT_GRADIENT_STOPS[UNIT_GRADIENT_STOPS.length - 1].rgb.join(",")})`;
  }

  // El nombre es lo único garantizado por módulo, así que el ícono/número
  // "más asertado" se infiere del propio nombre — no es un campo aparte
  // del JSON. Reconoce los patrones reales del mosaico de Moodle (CONECTA,
  // INCCA APOYO, Semana N); cualquier otro nombre cae en un ícono genérico.
  function unitVisualMeta(nombre) {
    const n = (nombre || "").toLowerCase();
    if (n.includes("conecta")) return { icon: "fa-comments" };
    if (n.includes("apoyo")) return { icon: "fa-handshake" };
    const num = n.match(/(\d+)/);
    if (n.includes("semana") && num) return { number: num[1] };
    return { icon: "fa-layer-group" };
  }

  // Ilustración de respaldo cuando el módulo no trae "ilustracion"
  // explícita — mismo criterio de inferencia por nombre que
  // unitVisualMeta(), usando los PNG genéricos que el visor ya trae
  // consigo (CONECTA/INCCA APOYO/Semana 1-4). No son contenido específico
  // de ningún curso — son la ilustración estándar de cada tipo de módulo,
  // por eso vale tenerlos como respaldo incluso sin dato del JSON. Si el
  // nombre no matchea ningún patrón conocido, no hay respaldo (mejor sin
  // imagen que una genérica que no pega con nada).
  function inferirIlustracion(nombre) {
    const n = (nombre || "").toLowerCase();
    if (n.includes("conecta")) return "./assets/img-temp/CONECTA.png";
    if (n.includes("apoyo")) return "./assets/img-temp/incca-apoyo.png";
    const semana = n.match(/semana\s*([1-4])\b/);
    if (semana) return `./assets/img-temp/semana${semana[1]}.png`;
    return "";
  }

  function renderUnitsAccordion(modulos) {
    const hero = $("#unitsHero");
    if (!hero) return;
    if (!modulos.length) {
      hero.innerHTML = `<div class="activity-empty"><i class="fa-solid fa-door-closed" aria-hidden="true"></i>Este recurso todavía no tiene unidades.</div>`;
      return;
    }
    hero.innerHTML = modulos.map((m, i) => {
      const meta = unitVisualMeta(m.nombre);
      const iconoHtml = meta.number
        ? `<div class="unit-panel-number" aria-hidden="true">${meta.number}</div>`
        : `<div class="unit-panel-icon" aria-hidden="true"><i class="fa-solid ${meta.icon}"></i></div>`;
      // Invertido a propósito: el primer módulo sale más oscuro y el
      // degradé se va aclarando hacia el último (antes era al revés).
      const t = modulos.length > 1 ? 1 - i / (modulos.length - 1) : 1;
      const color = unitColorAt(t);
      return `
      <div class="unit-panel" role="button" tabindex="0" data-unit="${i}" aria-label="${m.nombre}" style="z-index:${modulos.length - i}; --unit-color:${color}">
        ${iconoHtml}
        <div class="unit-footer">
          <div class="unit-footer-shape"><span class="unit-footer-label">${m.nombre}</span></div>
        </div>
        <div class="unit-active-content">
          <div class="unit-watermark" aria-hidden="true"><span>${m.nombre} · ${m.nombre}</span></div>
          <span class="unit-tag">UNIDAD ${i + 1}</span>
          <h3 class="unit-title">${m.nombre}</h3>
          <div class="unit-illustration">${m.ilustracion ? `<img src="${m.ilustracion}" alt="" loading="lazy">` : ""}</div>
          <a class="unit-cta" href="${m.url}" target="_blank" rel="noopener" data-sectionid="${m.sectionid || ""}">
            INICIAR MÓDULO
            <span class="unit-cta-arrow"><i class="fa-solid fa-arrow-right" aria-hidden="true"></i></span>
          </a>
        </div>
      </div>`;
    }).join("");

    // Confirmado con curl (headers idénticos a un <img> real: Referer,
    // Sec-Fetch-*, UA de Chrome, repetido varias veces) que algunos Moodle
    // bloquean la carga cross-site de pluginfile.php desde <img> en el
    // navegador real, aunque la MISMA url funcione perfecto navegando
    // directo y el servidor nunca mande ningún header CORS/CORP/Referer
    // distinto entre los dos casos — no hay nada del lado del visor que
    // pueda "arreglar" eso de forma confiable. Por eso, si el intento
    // directo falla, se reintenta UNA vez a través de un proxy de
    // imágenes genérico (images.weserv.nl — no depende de ningún dominio
    // de Moodle en particular, sirve cualquier url pública): el navegador
    // ya no le pide la imagen al dominio bloqueado, se la pide a un CDN
    // conocido que sí manda Access-Control-Allow-Origin. Si el proxy
    // TAMBIÉN falla (url realmente rota/inexistente), recién ahí se cae al
    // link "Ver ilustración" como último recurso. El campo "ilustracion"
    // del JSON no cambia en ningún paso, solo cómo se usa acá.
    function proxyIlustracionUrl(url) {
      return `https://images.weserv.nl/?url=${encodeURIComponent(url)}`;
    }
    $$(".unit-illustration img", hero).forEach((img) => {
      const urlOriginal = img.getAttribute("src");
      let viaProxy = false;
      img.addEventListener("error", () => {
        if (!viaProxy) {
          viaProxy = true;
          img.src = proxyIlustracionUrl(urlOriginal);
          return;
        }
        const contenedor = img.closest(".unit-illustration");
        img.remove();
        if (contenedor && urlOriginal) {
          contenedor.innerHTML = `
            <a class="unit-illustration-fallback" href="${urlOriginal}" target="_blank" rel="noopener">
              <i class="fa-solid fa-image" aria-hidden="true"></i> Ver ilustración
            </a>`;
        }
      });
    });

    $$(".unit-cta", hero).forEach((a) => initUnitCta(a));

    $$(".unit-panel", hero).forEach((panelEl) => {
      panelEl.addEventListener("click", (e) => {
        if (e.target.closest(".unit-cta")) return; // el <a> maneja su propia navegación
        toggleUnit(panelEl);
      });
      panelEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleUnit(panelEl); }
      });
    });
  }

  function toggleUnit(panelEl) {
    const willOpen = !panelEl.classList.contains("expanded");
    $$(".unit-panel", panelEl.parentElement).forEach((p) => p.classList.remove("expanded"));
    if (willOpen) panelEl.classList.add("expanded");
  }

  // Puente con la página que embebe el visor (Moodle + local_visorincca +
  // formato de curso "Mosaicos"): en vez de navegar de una, le avisa a la
  // ventana padre por postMessage para que abra el mosaico nativo ahí mismo,
  // sin pestaña nueva ni recarga. Si no hay confirmación a tiempo — porque
  // el visor está suelto (sin iframe), el padre no tiene el plugin, o
  // cualquier otro caso no contemplado — cae de vuelta a abrir "url" en
  // pestaña nueva, el comportamiento de siempre. Nunca debe quedar un click
  // sin efecto.
  //
  // BUG REAL encontrado y corregido (2026-08-21): el mensaje "abrir-modulo"
  // SÍ llegaba bien a Moodle (confirmado con logs reales de consola: origen
  // y sectionid correctos), y el mosaico incluso llegaba a abrirse ahí — pero
  // IGUAL se abría una pestaña nueva en paralelo. Causa: este timeout
  // (antes 500ms) es MUCHO más corto que el round-trip real del lado de
  // Moodle -- populateAndExpandSection() dispara su propia llamada AJAX
  // interna (format_tiles pidiendo el fragmento de la sección, que primero
  // pasa por filter_visorincca para expandir el marcador [[visorincca_unidad:N]]
  // a un <iframe> real) antes de que exista algo que observar en el DOM. En
  // un entorno normal (y más todavía en uno de desarrollo local sin cachés
  // calientes) ese viaje solo del lado de Moodle ya puede superar 500ms sin
  // que nada esté realmente roto -- el timeout se cumplía y disparaba
  // window.open() ANTES de que la confirmación real tuviera chance de
  // llegar, que sí llega, solo que un poco después. Se sube a 5000ms (con
  // margen real, sin quedar eterno si el puente de verdad no existe) y se
  // agregan logs con prefijo "[visorincca]" en cada paso para poder ver en
  // consola, con datos reales, si esto vuelve a pasar y por qué.
  const UNIT_CTA_ACK_TIMEOUT_MS = 5000;
  function initUnitCta(a) {
    a.addEventListener("click", (e) => {
      const sectionid = Number(a.dataset.sectionid) || null;
      if (window.self === window.top || !sectionid) {
        console.log("[visorincca] initUnitCta: no embebido o sin sectionid, link normal", {
          embebido: window.self !== window.top,
          sectionidCrudo: a.dataset.sectionid,
        });
        return; // no embebido o sin dato para el puente: link normal
      }

      e.preventDefault();
      let confirmado = false;
      const inicio = performance.now();
      console.log("[visorincca] initUnitCta: mandando abrir-modulo", { sectionid });

      const alRecibirMensaje = (ev) => {
        const d = ev.data;
        if (d && d.source === "visorincca" && d.type === "modulo-abierto" && d.sectionid === sectionid) {
          confirmado = true;
          console.log("[visorincca] initUnitCta: confirmacion modulo-abierto recibida", {
            sectionid,
            msDesdeElClick: Math.round(performance.now() - inicio),
          });
          window.removeEventListener("message", alRecibirMensaje);
        }
      };
      window.addEventListener("message", alRecibirMensaje);
      window.parent.postMessage({ source: "visorincca", type: "abrir-modulo", sectionid }, "*");

      setTimeout(() => {
        window.removeEventListener("message", alRecibirMensaje);
        if (!confirmado) {
          console.warn("[visorincca] initUnitCta: SIN confirmacion tras " + UNIT_CTA_ACK_TIMEOUT_MS
            + "ms, cae al fallback (pestana nueva)", { sectionid, href: a.href });
          window.open(a.href, "_blank", "noopener");
        }
      }, UNIT_CTA_ACK_TIMEOUT_MS);
    });
  }

  /* ---------------------------------------------------------------------
   * 11. Render — Diapositivas custom (datos.diapositivas_extra)
   * Cada entrada de "diapositivas_extra" no tiene un <section> propio en
   * index.html — se crea acá, en JS, la primera vez que aparece en SLIDES.
   * Dos tipos (campo "tipo", cualquier valor que no sea "pagina" cae en
   * "media"):
   *   - "media": diapositiva normal (con padding, como Docente o
   *     Tutorías) con título + descripción + el iframe/html en un marco
   *     contenido, más un botón para abrirlo en el modal de pantalla
   *     completa ("otra pantalla").
   *   - "pagina": a pantalla completa (misma clase .slide-fullbleed que
   *     usa Unidades) — el iframe/html ocupa toda la diapositiva, sin
   *     título/descripción; solo quedan las flechas prev/next (y los
   *     puntos de abajo) para navegar.
   * El contenido es "iframe" (url) o "html" (string, inyectado tal cual
   * — es contenido de confianza que arma el plugin de Moodle, mismo
   * criterio que los cuadros de "insertar HTML" del propio Moodle) — si
   * llegan ambos, gana "iframe"; si no llega ninguno, se muestra un
   * mensaje de "sin contenido" en vez de una diapositiva vacía rota.
   * ------------------------------------------------------------------- */
  function contenidoEmbebidoCustom(custom) {
    if (custom.iframe) {
      const tituloSeguro = (custom.titulo || "Recurso").replace(/"/g, "&quot;");
      return `<iframe src="${custom.iframe}" title="${tituloSeguro}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen loading="lazy"></iframe>`;
    }
    if (custom.html) return custom.html;
    return `<div class="activity-empty"><i class="fa-solid fa-inbox" aria-hidden="true"></i>Este recurso todavía no tiene contenido.</div>`;
  }

  function crearSlideCustom(id, custom) {
    const esPagina = custom.tipo === "pagina";
    const section = document.createElement("section");
    section.id = id;
    section.setAttribute("role", "group");
    section.setAttribute("aria-roledescription", "diapositiva");
    section.setAttribute("aria-label", custom.titulo || String(custom.id));
    section.className = esPagina ? "slide slide-fullbleed" : "slide";

    if (esPagina) {
      section.innerHTML = `
        <div class="slide-body">
          <div class="custom-page">${contenidoEmbebidoCustom(custom)}</div>
        </div>`;
    } else {
      section.innerHTML = `
        <div class="slide-body">
          <div class="slide-head">
            <div class="tag"><i class="fa-solid fa-photo-film" aria-hidden="true"></i> Recurso</div>
            ${custom.titulo ? `<h2 class="heading">${custom.titulo}</h2>` : ""}
            ${custom.descripcion ? `<p class="sub">${custom.descripcion}</p>` : ""}
          </div>
          <div class="custom-media-frame">
            ${contenidoEmbebidoCustom(custom)}
            <button class="custom-media-expand" type="button" aria-label="Abrir en pantalla completa">
              <i class="fa-solid fa-expand" aria-hidden="true"></i>
            </button>
          </div>
        </div>`;
      $(".custom-media-expand", section).addEventListener("click", () => openMediaModal(custom));
    }
    return section;
  }

  // Crea (si hace falta) el <section> de cada diapositiva custom y
  // reordena TODAS las diapositivas (fijas + custom) dentro de #slides
  // según el orden final ya calculado en SLIDES — reinsertar un nodo que
  // ya es hijo de #slides simplemente lo mueve a esa posición, así que
  // este mismo paso resuelve tanto crear las nuevas como reordenar las
  // fijas cuando "orden" las cambia de lugar.
  function renderCustomSlides(slides) {
    const contenedor = $("#slides");
    slides.forEach((s) => {
      let el = document.getElementById(s.id);
      if (!el && s.custom) el = crearSlideCustom(s.id, s.custom);
      else if (!el && s.actividades) el = crearSlideActividades(s.id, s.actividades);
      if (el) contenedor.appendChild(el);
    });
  }

  /* ---------------------------------------------------------------------
   * 11b. Render — diapositiva de ACTIVIDADES (datos.recursos)
   * Cada actividad es una "parada" de una ruta vertical (misma familia
   * visual que "¿Qué aprenderás?"): nodo numerado + tarjeta con barra de
   * acento lateral del color del tipo, etiqueta de tipo y nombre.
   *
   * INTERACCIÓN — una sola: si la actividad trae descripción, la fila
   * abre el **modal de pantalla completa** y la descripción se renderiza
   * RECIÉN en ese momento (openActividadModal → se limpia al cerrar). NO
   * hay acordeón inline: ni texto ni HTML se muestran dentro de la fila.
   *   - descripcion_html: false → en el modal, texto plano en párrafos
   *     (escapado, partido por línea en blanco).
   *   - descripcion_html: true  → en el modal, el HTML tal cual.
   *   - sin descripción → fila estática (solo el botón "ir", si hay link).
   *
   * Dos diseños por cantidad de ítems: varias = la ruta; una sola =
   * ".act-list--single" (medallón grande, nombre protagonista, botones
   * "Ver la actividad" + "Ir a la actividad").
   * ------------------------------------------------------------------- */
  function actividadCard(r, it, i, single) {
    const tieneDescripcion = !!it.descripcion;
    const num = String(i + 1).padStart(2, "0");
    const meta = ACT_TYPE_META[it.tipoActividad] || ACT_TYPE_META.tarea;
    const dataAttrs = `data-resource="${r.id}" data-item="${i}"`;

    const typePill = `<span class="act-type"><i class="fa-solid ${meta.icon}" aria-hidden="true"></i> ${meta.label}</span>`;

    // La zona del nombre:
    //   - lista (2+) con descripción → botón que abre el modal.
    //   - lista sin descripción, o modo "una sola" → texto estático
    //     (en modo single la acción va en los botones grandes de abajo).
    const nombreBloque = (!single && tieneDescripcion)
      ? `<button class="act-open" type="button" ${dataAttrs} aria-label="Ver el detalle de: ${it.nombre}">
          ${typePill}
          <span class="act-headline">
            <span class="act-nombre">${it.nombre}</span>
            <span class="act-open-hint">Ver detalle <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></span>
          </span>
        </button>`
      : `<div class="act-static">
          ${typePill}
          <span class="act-nombre">${it.nombre}</span>
        </div>`;

    const goBtn = it.link
      ? `<a class="act-go" href="${it.link}" target="_blank" rel="noopener" title="Ir a la actividad" aria-label="Ir a la actividad: ${it.nombre}"><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></a>`
      : "";

    // Modo "una sola actividad": botones grandes en vez de la fila compacta.
    const acciones = single
      ? `<div class="act-actions">
          ${tieneDescripcion ? `<button class="act-see" type="button" ${dataAttrs}><i class="fa-solid fa-file-lines" aria-hidden="true"></i> Ver la actividad</button>` : ""}
          ${it.link ? `<a class="act-cta" href="${it.link}" target="_blank" rel="noopener"><span>Ir a la actividad</span><span class="act-cta-arrow" aria-hidden="true"><i class="fa-solid fa-arrow-right"></i></span></a>` : ""}
        </div>`
      : "";

    return `
      <div class="act" data-type="${it.tipoActividad}" style="--act-i:${i}">
        <span class="act-node" aria-hidden="true">${single ? `<i class="fa-solid ${meta.icon}"></i>` : num}</span>
        <div class="act-card">
          <span class="act-accent" aria-hidden="true"></span>
          <span class="act-glyph" aria-hidden="true"><i class="fa-solid ${meta.icon}"></i></span>
          <div class="act-row">
            ${nombreBloque}${single ? "" : goBtn}
          </div>
          ${acciones}
        </div>
      </div>`;
  }

  function cuerpoActividades(r) {
    if (!r.items.length) {
      return `<div class="activity-empty"><i class="fa-solid fa-list-check" aria-hidden="true"></i>Este recurso todavía no tiene actividades.</div>`;
    }
    const single = r.items.length === 1;
    return `<div class="act-list${single ? " act-list--single" : ""}">
      ${single ? "" : `<span class="act-line" aria-hidden="true"></span>`}
      ${r.items.map((it, i) => actividadCard(r, it, i, single)).join("")}
    </div>`;
  }

  function crearSlideActividades(id, recurso) {
    const section = document.createElement("section");
    section.id = id;
    section.setAttribute("role", "group");
    section.setAttribute("aria-roledescription", "diapositiva");
    section.setAttribute("aria-label", recurso.titulo || "Actividades");
    section.className = "slide";
    section.innerHTML = `
      <div class="slide-body">
        <div class="slide-head">
          <div class="tag"><i class="fa-solid fa-list-check" aria-hidden="true"></i> Actividades</div>
          <h2 class="heading">${recurso.titulo || "Actividades"}</h2>
          <p class="sub">Actividades del curso, fuera de los mosaicos de las semanas.</p>
        </div>
        <div class="act-wrap">${cuerpoActividades(recurso)}</div>
      </div>`;
    return section;
  }

  function openMediaModal(custom) {
    $("#customMediaModalTitle").textContent = custom.titulo || "";
    $("#customMediaModalTitle").hidden = !custom.titulo;
    $("#customMediaModalDescripcion").textContent = custom.descripcion || "";
    $("#customMediaModalDescripcion").hidden = !custom.descripcion;
    $("#customMediaModalBody").innerHTML = contenidoEmbebidoCustom(custom);
    $("#customMediaModalOverlay").classList.add("is-open");
  }

  // Reusa el modal de pantalla completa de las diapositivas custom para
  // mostrar la descripción de una actividad — texto plano (en párrafos) o
  // HTML (tal cual). Se arma acá, al abrir; closeMediaModal() lo limpia al
  // cerrar, así que el contenido solo existe mientras el modal está abierto.
  // El link de la actividad va como botón flotante dentro del modal.
  function openActividadModal(titulo, descripcion, esHtml, link) {
    if (!descripcion) return;
    $("#customMediaModalTitle").textContent = titulo || "";
    $("#customMediaModalTitle").hidden = !titulo;
    $("#customMediaModalDescripcion").hidden = true;
    const cuerpo = esHtml
      ? `<div class="act-modal-html">${descripcion}</div>`
      : `<div class="act-modal-html act-modal-html--texto">${escaparHtml(descripcion).split(/\n{2,}/).map((p) => `<p>${p}</p>`).join("")}</div>`;
    $("#customMediaModalBody").innerHTML = cuerpo
      + (link ? `<a class="act-modal-go" href="${link}" target="_blank" rel="noopener"><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i> Ir a la actividad</a>` : "");
    $("#customMediaModalOverlay").classList.add("is-open");
  }

  function closeMediaModal() {
    $("#customMediaModalOverlay").classList.remove("is-open");
    $("#customMediaModalBody").innerHTML = ""; // corta el iframe al cerrar (que no siga sonando/corriendo de fondo)
  }

  function initMediaModal() {
    $("#customMediaModalClose").addEventListener("click", closeMediaModal);
    $("#customMediaModalOverlay").addEventListener("click", (e) => {
      if (e.target.id === "customMediaModalOverlay") closeMediaModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && $("#customMediaModalOverlay").classList.contains("is-open")) closeMediaModal();
    });
  }

  /* ---------------------------------------------------------------------
   * 11c. Interacción de las diapositivas de ACTIVIDADES + CTA/stat del hero
   * ------------------------------------------------------------------- */
  function initActividades(datos) {
    const porId = {};
    datos.recursos.forEach((r) => { porId[r.id] = r; });

    // Toda actividad con descripción abre su detalle en el modal — sin
    // acordeón inline. Un mismo handler para la fila (.act-open) y para el
    // botón grande del modo "una sola" (.act-see).
    $$(".act-open, .act-see").forEach((btn) => {
      btn.addEventListener("click", () => {
        const r = porId[btn.dataset.resource];
        const item = r && r.items[Number(btn.dataset.item)];
        if (!item) return;
        openActividadModal(item.nombre || r.titulo, item.descripcion, item.descripcionHtml, item.link);
      });
    });
  }

  // CTA "Ir a actividades" + tile de la franja de estadísticas del hero —
  // solo si el curso trae al menos una actividad. El número es el total de
  // todas las actividades de todos los recursos.
  function renderActividadesHero(datos) {
    const total = datos.recursos.reduce((n, r) => n + (r.items ? r.items.length : 0), 0);
    const primeraId = datos.recursos.length ? `actividades-${datos.recursos[0].id}` : null;

    const tile = $("#statActividades");
    if (tile) {
      tile.hidden = total === 0;
      const num = $("#statActividadesNum", tile) || $(".stat-num", tile);
      if (num) num.dataset.counter = total;
    }

    const cue = $("#heroActividadesCue");
    if (cue) {
      cue.hidden = !primeraId;
      const badge = $(".btn-pill-badge", cue);
      if (badge) { badge.textContent = total > 9 ? "9+" : String(total); badge.hidden = total === 0; }
      if (primeraId) {
        const idx = SLIDES.findIndex((s) => s.id === primeraId);
        if (idx !== -1) cue.addEventListener("click", () => deck.goTo(idx));
      }
    }
  }

  /* ---------------------------------------------------------------------
   * 12. Contadores animados (hero)
   * ------------------------------------------------------------------- */
  function initCounters(root) {
    $$("[data-counter]", root).forEach((el) => {
      const target = Number(el.dataset.counter);
      const suffix = el.dataset.counterSuffix || "";
      const duration = 1100;
      let startTime = null;
      function tick(ts) {
        if (!startTime) startTime = ts;
        const progress = Math.min(1, (ts - startTime) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target) + suffix;
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }

  /* ---------------------------------------------------------------------
   * 13. Parallax de los blobs del hero (sigue al puntero, --hero-px/py
   *     los leen los .hero-blob en CSS). Se omite con prefers-reduced-motion.
   * ------------------------------------------------------------------- */
  function initHeroParallax() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const hero = $("#hero");
    if (!hero) return;
    let raf = null;
    hero.addEventListener("mousemove", (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        const rect = hero.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        hero.style.setProperty("--hero-px", px.toFixed(3));
        hero.style.setProperty("--hero-py", py.toFixed(3));
      });
    });
    hero.addEventListener("mouseleave", () => {
      hero.style.setProperty("--hero-px", 0);
      hero.style.setProperty("--hero-py", 0);
    });
  }

  /* ---------------------------------------------------------------------
   * 14. Escena de figuras geométricas de Bienvenida (variante sin frase) —
   *     port directo de la animación original: right/top/size en "vh"
   *     (la escena mide top:0/bottom:0 = 100% del alto de la diapositiva,
   *     igual que el #geo-scene original de 100vh, así que "vh" sigue
   *     significando lo mismo sin recalcular nada en JS), mismo parallax
   *     con requestAnimationFrame + lerp sobre todo el documento.
   * ------------------------------------------------------------------- */
  const WELCOME_SHAPES = [
    { type: "glass", size: 55, right: 10,  top: -5,  z: 3,  delay: 0,  depth: .010 },
    { type: "glass", size: 65, right: 20,  top: 20,  z: 2,  delay: .1, depth: .015 },
    { type: "glass", size: 55, right: 8,   top: 45,  z: 1,  delay: .2, depth: .012 },
    { type: "glass", size: 70, right: 25,  top: 70,  z: 2,  delay: .3, depth: .018 },
    { type: "glass", size: 60, right: 12,  top: 100, z: 1,  delay: .4, depth: .010 },
    { type: "blue",  size: 35, right: -12, top: -15, z: 20, delay: .2, depth: .042 },
    { type: "white", size: 45, right: -12, top: 5,   z: 19, delay: .3, depth: .038 },
    { type: "blue",  size: 38, right: -15, top: 25,  z: 18, delay: .4, depth: .044 },
    { type: "white", size: 45, right: -10, top: 48,  z: 17, delay: .5, depth: .039 },
    { type: "blue",  size: 40, right: -18, top: 70,  z: 16, delay: .6, depth: .045 },
    { type: "white", size: 45, right: -12, top: 92,  z: 15, delay: .7, depth: .037 },
    { type: "blue",  size: 38, right: -15, top: 115, z: 14, delay: .8, depth: .043 }
  ];
  let welcomeGeoWrappers = [];

  function buildWelcomeShapes(scene) {
    welcomeGeoWrappers = WELCOME_SHAPES.map((d, i) => {
      const wrapper = document.createElement("div");
      wrapper.className = "welcome-shape-wrapper";
      wrapper.style.right = `${d.right}vh`;
      wrapper.style.top = `${d.top}vh`;
      // width/height:0 explícitos: sin esto, el wrapper (auto, sin left/
      // width) se autodimensiona por shrink-to-fit, y ese cálculo SÍ
      // cuenta el margin-left/margin-top negativos del cuadro de adentro
      // (quedaría en size/2, no en 0) — el ancla de right/top terminaba
      // corrida medio tamaño de figura respecto al punto real del mockup.
      wrapper.style.width = "0";
      wrapper.style.height = "0";
      wrapper.style.zIndex = d.z;
      wrapper.dataset.depth = d.depth;

      const shape = document.createElement("div");
      shape.className = `welcome-shape ${d.type}`;
      shape.style.width = `${d.size}vh`;
      shape.style.height = `${d.size}vh`;
      shape.style.marginLeft = `-${d.size / 2}vh`;
      shape.style.marginTop = `-${d.size / 2}vh`;
      const floatAnim = i % 2 === 0 ? "incca-shape-float-a" : "incca-shape-float-b";
      shape.style.animation = `incca-shape-pop 1s cubic-bezier(.16,1,.3,1) forwards, ${floatAnim} 7s ease-in-out ${d.delay}s infinite`;

      wrapper.appendChild(shape);
      scene.appendChild(wrapper);
      return wrapper;
    });
  }

  let welcomeGeoParallaxStarted = false;
  function initWelcomeGeo() {
    const scene = $("#welcomeGeo");
    if (!scene || scene.hidden) return; // hay frase_destacada: se usa la quote-card de siempre
    if (!scene.childElementCount) buildWelcomeShapes(scene);
    if (welcomeGeoParallaxStarted) return;
    welcomeGeoParallaxStarted = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;
    document.addEventListener("mousemove", (e) => {
      mouseX = e.clientX - window.innerWidth / 2;
      mouseY = e.clientY - window.innerHeight / 2;
    });
    document.addEventListener("touchmove", (e) => {
      if (e.touches.length) {
        mouseX = e.touches[0].clientX - window.innerWidth / 2;
        mouseY = e.touches[0].clientY - window.innerHeight / 2;
      }
    });
    (function tick() {
      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;
      welcomeGeoWrappers.forEach((wrapper) => {
        const depth = parseFloat(wrapper.dataset.depth);
        wrapper.style.transform = `translate(${(targetX * depth * -0.15).toFixed(2)}px, ${(targetY * depth * -0.15).toFixed(2)}px)`;
      });
      requestAnimationFrame(tick);
    })();
  }

  /* ---------------------------------------------------------------------
   * Init
   * ------------------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", () => {
    const datos = obtenerDatos();
    SLIDES = construirSlides(datos);

    // Cualquier diapositiva FIJA que quedó fuera de SLIDES (visible:false
    // propio, o —para "docente_tutor"— ausencia de profesor_tutor) se
    // saca del árbol de accesibilidad, no solo se deja invisible por CSS.
    const idsVisibles = new Set(SLIDES.map((s) => s.id));
    SLIDES_FIJAS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) el.hidden = !idsVisibles.has(s.id);
    });

    renderCustomSlides(SLIDES);
    renderHeroYBienvenidaYDocente(datos);
    renderChrome();
    renderLearn(datos);
    renderTutorias(datos.tutorias);
    renderUnitsAccordion(datos.modulos);
    renderActividadesHero(datos);
    initActividades(datos);
    initHeroCue();
    initGotoUnitsButtons();
    initHeroParallax();
    initWelcomeGeo();
    initMediaModal();
    initKeyboard();
    initSwipe();
    deck.init();
  });
})();
