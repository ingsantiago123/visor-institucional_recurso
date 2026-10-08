/*!
 * U.INCCA · Visor de recurso v3 — JavaScript propio, sin dependencias.
 * ---------------------------------------------------------------------
 * TODO el contenido llega como UN objeto JSON en `window.name` (el plugin
 * local_visorincca lo imprime en el atributo name del iframe):
 *
 *   <iframe id="incca-hero-section" src="https://.../v3/" name='{"curso":"...", ...}'></iframe>
 *
 * Contrato (todos los campos son opcionales; con datos reales lo vacio se
 * OCULTA, nunca se rellena con ejemplos):
 *
 *   curso, resumen, insignias[{icono,texto,destacada}], unidades, horas_trabajo,
 *   profesor{nombre,foto,rol,bio[],etiquetas[{icono,texto}],video},
 *   profesor_tutor (misma forma; sin la clave no hay diapositiva de tutor),
 *   video, video_titulo, video_parrafos[]          -> Presentacion
 *   dea_video | dea_imagen (gana la imagen), dea_titulo, dea_parrafos[], dea_descarga_url
 *   bienvenida{titulo,parrafos[],frase_destacada}
 *   aprenderas[{icono,titulo,detalle}], aprenderas_texto[], aprenderas_imagen
 *   tutorias{url_aula_virtual, horario[{dia,inicio,fin}]}
 *   modulos[{nombre,url,ilustracion,sectionid}]   -> Unidades (puente con Moodle por sectionid)
 *   secciones{id:{visible,orden}}, diapositivas_extra[{id,tipo,orden,visible,titulo,descripcion,iframe|html}]
 *   recursos[{id,tipo:"actividades",titulo,orden,visible,items[{nombre,tipo,link,descripcion,descripcion_html}]}]
 *   origen_padre, v_contrato                        -> protocolo postMessage v2
 *
 * NUEVO en v3 -- fondos configurables (la foto de la propuesta es el defecto):
 *
 *   "fondos": {
 *     "general": "https://.../foto.jpg",            // todas las diapositivas con foto
 *     "hero" | "presentacion" | "bienvenida" | "aprenderas" | "dea" |
 *     "tutorias" | "unidades" | "actividades": "https://...",   // una en particular
 *     "docente": "https://..."                      // reemplaza las ondas del docente por foto
 *   }
 *
 * Cada valor puede ser una URL (el visor le aplica la gradacion de la
 * propuesta segun la diapositiva sea oscura o clara) o un objeto
 * { "original": url, "oscuro": url, "claro": url } con versiones ya
 * graduadas. Prioridad: la de la diapositiva -> "general" -> la del visor.
 * Una URL que no carga cae sola a la del visor.
 * ------------------------------------------------------------------- */
(function () {
  "use strict";

  const VERSION = "3.1.0";
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
  const reducido = () => !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  /* ---------------------------------------------------------------------
   * 0. Texto seguro (guia 2.1): TODO texto del JSON entra escapado.
   * ------------------------------------------------------------------- */
  const decodificador = document.createElement("textarea");
  function decodificar(s) {
    const str = String(s == null ? "" : s);
    if (str.indexOf("&") === -1) return str;
    decodificador.innerHTML = str; // textarea: no interpreta HTML ni ejecuta nada
    return decodificador.value;
  }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function texto(s) { return esc(decodificar(s)); }
  function tieneTexto(s) { return /[\p{L}\p{N}]/u.test(decodificar(s)); }
  function urlSegura(u) {
    const s = decodificar(u).trim();
    if (!s) return "";
    if (/^[a-z][a-z0-9+.-]*:/i.test(s) && !/^https?:/i.test(s)) return "#";
    return s;
  }
  function attrUrl(u) { return esc(urlSegura(u)); }
  function icono(nombre, defecto) {
    const n = String(nombre || "").trim();
    return /^fa-[a-z0-9-]+$/i.test(n) ? n : defecto;
  }

  /* ---------------------------------------------------------------------
   * 0b. Puente con la pagina que embebe el visor -- protocolo 2 (guia 5).
   *     postMessage solo a window.parent (ese curso, esa seccion); solo se
   *     aceptan mensajes de esa ventana; nada en localStorage.
   * ------------------------------------------------------------------- */
  const PROTOCOLO = 2;
  const puente = { estado: "desconocido", capacidades: [], origen: "" };
  let origenPadre = "";
  const embebido = window.parent && window.parent !== window;

  function enviarAlPadre(msg) {
    if (!embebido) return;
    try {
      window.parent.postMessage(Object.assign({ source: "visorincca", v: PROTOCOLO }, msg),
        puente.origen || origenPadre || "*");
    } catch (e) { /* origen distinto al esperado: el navegador lo descarta */ }
  }
  function mensajeDelPadre(ev) {
    if (!embebido || ev.source !== window.parent) return null;
    if (origenPadre && ev.origin !== origenPadre) return null;
    const d = ev.data;
    return (d && typeof d === "object" && d.source === "visorincca") ? d : null;
  }
  function puenteTiene(capacidad) {
    return puente.estado === "presente" && puente.capacidades.indexOf(capacidad) !== -1;
  }
  function iniciarSaludo(tipo) {
    if (!embebido) return;
    window.addEventListener("message", (ev) => {
      const d = mensajeDelPadre(ev);
      if (!d || d.type !== "puente-listo") return;
      puente.estado = "presente";
      puente.capacidades = Array.isArray(d.capacidades) ? d.capacidades.map(String) : [];
      puente.origen = ev.origin;
    });
    [0, 500, 1500, 3000].forEach((ms) => setTimeout(() => {
      if (puente.estado === "desconocido") enviarAlPadre({ type: "visor-listo", tipo });
    }, ms));
  }
  let erroresReportados = 0;
  // Avisos del navegador que no son fallas del visor: no se reportan (el
  // plugin encenderia su alerta por nada).
  const AVISO_BENIGNO = /ResizeObserver loop|Script error\.?$/i;
  function reportarError(etapa, err) {
    const mensaje = String((err && err.message) || err || "").slice(0, 200);
    if (etapa === "global" && AVISO_BENIGNO.test(mensaje)) return;
    if (window.console) console.warn("[visorincca] fallo en " + etapa + ": " + mensaje);
    if (++erroresReportados <= 5) enviarAlPadre({ type: "visor-error", etapa: String(etapa).slice(0, 60), mensaje });
  }
  // Cada paso del arranque va aislado: si uno falla, los demas siguen.
  function paso(etapa, fn) {
    try { return fn(); } catch (e) { reportarError(etapa, e); return undefined; }
  }
  function marcarEquipoModesto() {
    const hilos = navigator.hardwareConcurrency || 8;
    const memoria = navigator.deviceMemory || 8;
    const modesto = hilos <= 4 || memoria <= 4;
    if (modesto) document.documentElement.classList.add("equipo-modesto");
    return modesto;
  }
  window.addEventListener("error", (ev) => reportarError("global", ev.error || ev.message));

  /* ---------------------------------------------------------------------
   * 1. Estructura de diapositivas: fijas + extra + actividades, con
   *    datos.secciones (visible/orden). "hero" siempre existe y es la primera.
   *    "escena" elige el fondo (seccion 5).
   * ------------------------------------------------------------------- */
  const SLIDES_FIJAS = [
    { id: "hero", label: "Inicio", icon: "fa-house", escena: "inicio" },
    { id: "presentacion", label: "Presentación", icon: "fa-clapperboard", escena: "presentacion" },
    { id: "bienvenida", label: "Bienvenida", icon: "fa-hand-holding-heart", escena: "bienvenida" },
    { id: "aprenderas", label: "Aprenderás", icon: "fa-route", escena: "aprenderas" },
    { id: "dea", label: "DEA", icon: "fa-compass", escena: "dea" },
    { id: "docente", label: "Docente creador", icon: "fa-chalkboard-user", escena: "docente" },
    { id: "docente_tutor", label: "Docente tutor", icon: "fa-user-tie", escena: "docente" },
    { id: "tutorias", label: "Tutorías", icon: "fa-calendar-days", escena: "tutorias" },
    { id: "unidades", label: "Unidades", icon: "fa-layer-group", escena: "unidades", completa: true }
  ];

  // Una diapositiva fija solo existe si tiene algo que mostrar (guia 2.2).
  function slideTieneContenido(id, datos) {
    if (datos.ejemplo) return true;
    switch (id) {
      case "presentacion":
        return Boolean(datos.video || datos.video_titulo || datos.video_parrafos.length);
      case "dea":
        return Boolean(datos.dea_video || datos.dea_imagen || datos.dea_titulo || datos.dea_parrafos.length);
      case "bienvenida":
        return Boolean((datos.bienvenida.parrafos || []).length || tieneTexto(datos.bienvenida.frase_destacada));
      case "aprenderas":
        return Boolean(datos.aprenderas.length || (datos.aprenderas_texto || []).length);
      case "docente":
        return Boolean(datos.profesor && datos.profesor.nombre);
      case "docente_tutor":
        return Boolean(datos.profesor_tutor && datos.profesor_tutor.nombre);
      case "tutorias":
        return Boolean(datos.tutorias.horario.length);
      case "unidades":
        return Boolean(datos.modulos.length);
      default:
        return true;
    }
  }

  function construirSlides(datos) {
    const config = datos.secciones;
    const fijas = SLIDES_FIJAS.map((s, i) => {
      if (s.id === "hero") return Object.assign({}, s, { custom: null, visible: true, orden: -Infinity });
      const override = config[s.id] || {};
      const visibleDefault = s.id === "docente_tutor" ? Boolean(datos.profesor_tutor) : true;
      return Object.assign({}, s, {
        custom: null,
        visible: slideTieneContenido(s.id, datos) && (typeof override.visible === "boolean" ? override.visible : visibleDefault),
        orden: Number.isFinite(override.orden) ? override.orden : i
      });
    });
    const extra = datos.diapositivas_extra
      .filter((d) => d && d.id)
      .map((d, i) => ({
        id: `custom-${d.id}`,
        label: decodificar(d.titulo) || String(d.id),
        icon: d.tipo === "pagina" ? "fa-window-maximize" : "fa-photo-film",
        escena: d.tipo === "pagina" ? "pagina" : "media",
        completa: d.tipo === "pagina",
        custom: d,
        visible: d.visible !== false,
        orden: Number.isFinite(d.orden) ? d.orden : SLIDES_FIJAS.length + i
      }));
    const acts = datos.recursos
      .filter((r) => r && r.tipo === "actividades")
      .map((r, i) => ({
        id: `actividades-${r.id}`,
        label: decodificar(r.titulo),
        icon: "fa-list-check",
        escena: "actividades",
        custom: null,
        actividades: r,
        visible: r.visible !== false,
        orden: Number.isFinite(r.orden) ? r.orden : i
      }));
    const lista = fijas.concat(extra).filter((s) => s.visible).sort((a, b) => a.orden - b.orden);
    // Las actividades van SIEMPRE justo antes de "Unidades" (o al final).
    const actsVisibles = acts.filter((s) => s.visible).sort((a, b) => a.orden - b.orden);
    if (actsVisibles.length) {
      const idx = lista.findIndex((s) => s.id === "unidades");
      lista.splice(idx === -1 ? lista.length : idx, 0, ...actsVisibles);
    }
    return lista;
  }
  let SLIDES = [];

  /* ---------------------------------------------------------------------
   * 2. Contenido de ejemplo: SOLO para la vista suelta (sin window.name).
   *    Con datos de Moodle nunca se usa (guia, leccion 1).
   * ------------------------------------------------------------------- */
  const SIN_DATOS = {
    curso: "Nombre del curso (ejemplo: Liderazgo y Ética de la Gestión)",
    resumen: "Ejemplo de resumen: un párrafo breve (2-3 líneas) que cuenta de qué trata el curso, a quién está dirigido y qué lo hace valioso. La idea es que alguien lo lea en 10 segundos y entienda si le sirve.",
    insignias: [
      { icono: "fa-clock", texto: "Duración: 8 semanas (ejemplo)" },
      { icono: "fa-laptop", texto: "100% virtual (ejemplo)" },
      { icono: "fa-certificate", texto: "Con certificado (ejemplo)", destacada: true }
    ],
    unidades: 4,
    horas_trabajo: 96,
    profesor: {
      nombre: "Nombre del docente (ejemplo)",
      foto: "",
      rol: "Título profesional del docente (ejemplo: Magíster en Educación)",
      bio: [
        "Ejemplo de biografía: profesional con trayectoria en el área del curso, docente universitario y especialista en el tema.",
        "Un segundo párrafo puede sumar experiencia relevante, publicaciones o proyectos destacados."
      ],
      etiquetas: [
        { icono: "fa-graduation-cap", texto: "Ejemplo: Magíster en..." },
        { icono: "fa-briefcase", texto: "Ejemplo: 10 años de experiencia" }
      ],
      video: "https://www.youtube.com/watch?v=aqz-KE-bpKQ"
    },
    video: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
    video_titulo: "Presentación del curso (ejemplo)",
    video_parrafos: [
      "Ejemplo: un párrafo breve presentando el video, de qué trata y qué va a entender el estudiante al verlo.",
      "Un segundo párrafo puede sumar contexto, como la duración o los temas cubiertos."
    ],
    dea_video: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
    dea_titulo: "DEA · Diseño de Experiencia para el Aprendizaje (ejemplo)",
    dea_parrafos: [
      "Ejemplo de párrafo del DEA: explica en qué consiste el Diseño de Experiencia para el Aprendizaje de este curso, el mapa que guía cada paso del recorrido.",
      "Un segundo párrafo puede sumar qué va a encontrar el estudiante ahí: herramientas, recursos y estrategias."
    ],
    dea_descarga_url: "",
    bienvenida: {
      titulo: "¡Bienvenidos al curso! (ejemplo)",
      parrafos: [
        "Ejemplo de bienvenida: este espacio es para saludar a los estudiantes y contarles, en 2 o 3 párrafos cortos, qué encontrarán en el curso.",
        "Puede incluir cómo está organizado, qué se espera de su participación y un cierre motivador antes de empezar."
      ],
      frase_destacada: "Una frase inspiradora que resuma el espíritu del curso (ejemplo)."
    },
    aprenderas: [
      { icono: "fa-lightbulb", titulo: "Temática 1 (ejemplo)", detalle: "Aquí van los detalles de esta temática: qué conceptos se cubren y qué sabrá hacer el estudiante al dominarla." },
      { icono: "fa-people-group", titulo: "Temática 2 (ejemplo)", detalle: "Describe en un par de líneas el contenido de este bloque temático." },
      { icono: "fa-scale-balanced", titulo: "Temática 3 (ejemplo)", detalle: "Puedes agregar tantas temáticas como el curso necesite: no hay un número fijo." },
      { icono: "fa-briefcase", titulo: "Temática 4 (ejemplo)", detalle: "La última suele ser la aplicación práctica de todo lo anterior." }
    ],
    aprenderas_texto: [
      "Ejemplo de texto largo de la ruta de aprendizaje: en este curso desarrollarás competencias aplicables a contextos reales.",
      "Puede ocupar varios párrafos; si no cabe, se desplaza dentro de su panel."
    ],
    tutorias: { url_aula_virtual: "#", horario: [{ dia: "Lunes", inicio: "17:00", fin: "18:00" }] },
    modulos: [
      { nombre: "CONECTA (ejemplo)", url: "#" },
      { nombre: "INCCA APOYO (ejemplo)", url: "#" },
      { nombre: "Semana 1 (ejemplo)", url: "#" },
      { nombre: "Semana 2 (ejemplo)", url: "#" },
      { nombre: "Semana 3 (ejemplo)", url: "#" },
      { nombre: "Semana 4 (ejemplo)", url: "#" }
    ],
    recursos: [
      {
        id: "curso", tipo: "actividades", titulo: "Actividades del curso (ejemplo)", orden: 8,
        items: [
          { nombre: "Cuestionario diagnóstico (ejemplo)", tipo: "quiz", link: "#", descripcion: "Ejemplo de descripción en texto plano: 10 preguntas de opción múltiple, 20 minutos, 2 intentos.\n\nUna línea en blanco separa los párrafos.", descripcion_html: false },
          { nombre: "Foro de presentación (ejemplo)", tipo: "foro", link: "#", descripcion: "Ejemplo: preséntate ante el grupo y comenta al menos dos aportes de tus compañeros antes del cierre de la semana.", descripcion_html: false },
          { nombre: "Entrega con instrucciones en HTML (ejemplo)", tipo: "entrega", link: "#", descripcion: "<p>Ejemplo de descripción en <strong>HTML</strong>.</p><ul><li>Formato de entrega: PDF</li><li>Peso en la nota: 20%</li></ul>", descripcion_html: true },
          { nombre: "Rúbrica de autoevaluación (ejemplo, sin descripción ni enlace)", tipo: "tarea" }
        ]
      },
      {
        id: "examen", tipo: "actividades", titulo: "Examen final (ejemplo)", orden: 9,
        items: [
          { nombre: "Examen integral del curso (ejemplo)", tipo: "examen", link: "#", descripcion: "Ejemplo del diseño de UNA sola actividad: la tarjeta protagonista con los botones grandes.\n\n25 preguntas, 90 minutos, un único intento.", descripcion_html: false }
        ]
      }
    ]
  };
  const SIN_DATOS_MODULO = { nombre: "Nombre del módulo (ejemplo)", url: "#", ilustracion: "", sectionid: null };

  /* ---------------------------------------------------------------------
   * 2b. Actividades (datos.recursos): tipo -> color, icono y etiqueta.
   * ------------------------------------------------------------------- */
  const ACT_TYPES = ["quiz", "tarea", "foro", "taller", "entrega", "examen"];
  const ACT_TYPE_META = {
    quiz: { label: "Quiz", icon: "fa-circle-question" },
    tarea: { label: "Tarea", icon: "fa-file-pen" },
    foro: { label: "Foro", icon: "fa-comments" },
    taller: { label: "Taller", icon: "fa-screwdriver-wrench" },
    entrega: { label: "Entrega", icon: "fa-cloud-arrow-up" },
    examen: { label: "Examen", icon: "fa-file-circle-check" }
  };
  function inferActType(tipo, link) {
    if (ACT_TYPES.indexOf(tipo) !== -1) return tipo;
    const l = String(link || "").toLowerCase();
    if (l.indexOf("mod/quiz/") !== -1) return "quiz";
    if (l.indexOf("mod/forum/") !== -1) return "foro";
    if (l.indexOf("mod/workshop/") !== -1) return "taller";
    return "tarea";
  }
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
   * 3. Datos (window.name, ya leido por el script del <head>)
   * ------------------------------------------------------------------- */
  function leerDatos() {
    if ("__visorDatos" in window) return window.__visorDatos;
    try {
      const d = window.name ? JSON.parse(window.name) : null;
      return d && typeof d === "object" && !Array.isArray(d) ? d : null;
    } catch (e) { return null; }
  }

  function normalizarTutorias(recibidos, ejemplo) {
    if (recibidos.tutorias === undefined) return ejemplo ? SIN_DATOS.tutorias : { url_aula_virtual: "#", horario: [] };
    const t = (recibidos.tutorias && typeof recibidos.tutorias === "object" && !Array.isArray(recibidos.tutorias)) ? recibidos.tutorias : {};
    const horario = Array.isArray(t.horario) ? t.horario.filter((h) => h && h.dia && h.inicio && h.fin) : [];
    return { url_aula_virtual: t.url_aula_virtual || "#", horario };
  }

  // Fondos: solo URL absolutas http(s) (las mismas reglas que el script del <head>).
  const RANURAS = ["general", "hero", "presentacion", "bienvenida", "aprenderas", "dea", "docente", "tutorias", "unidades", "actividades"];
  const urlFondo = (u) => ((typeof u === "string" && /^https?:\/\//i.test(u.trim())) ? u.trim() : "");
  function normalizarFondos(f) {
    const out = {};
    if (!f || typeof f !== "object" || Array.isArray(f)) return out;
    RANURAS.forEach((k) => {
      const v = f[k];
      if (typeof v === "string") {
        if (urlFondo(v)) out[k] = { original: urlFondo(v) };
      } else if (v && typeof v === "object") {
        const o = {};
        ["original", "oscuro", "claro"].forEach((t) => { if (urlFondo(v[t])) o[t] = urlFondo(v[t]); });
        if (Object.keys(o).length) out[k] = o;
      }
    });
    return out;
  }

  function obtenerDatos() {
    const recibidosRaw = leerDatos();
    const recibidos = recibidosRaw || {};
    const sinNingunDato = !recibidosRaw || Object.keys(recibidosRaw).length === 0;
    const ejemplo = (campo, vacio) => (sinNingunDato ? SIN_DATOS[campo] : vacio);
    const cadena = (valor, campo) => ((typeof valor === "string" && tieneTexto(valor)) ? valor : ejemplo(campo, ""));
    const lista = (valor, campo) => (Array.isArray(valor)
      ? valor.filter((x) => x !== null && x !== "" && (typeof x !== "string" || tieneTexto(x)))
      : ejemplo(campo, []));
    const numero = (valor, campo) => (Number.isFinite(valor) ? valor : ejemplo(campo, 0));
    const docenteVacio = { nombre: "", foto: "", rol: "", bio: [], etiquetas: [], video: "" };
    const docente = (valor, base) => {
      const d = Object.assign({}, base, (valor && typeof valor === "object") ? valor : {});
      d.bio = Array.isArray(d.bio) ? d.bio.filter(tieneTexto) : [];
      d.etiquetas = Array.isArray(d.etiquetas) ? d.etiquetas.filter((t) => t && t.texto) : [];
      return d;
    };
    return {
      ejemplo: sinNingunDato,
      origen_padre: typeof recibidos.origen_padre === "string" ? recibidos.origen_padre : "",
      curso: cadena(recibidos.curso, "curso"),
      resumen: cadena(recibidos.resumen, "resumen"),
      insignias: lista(recibidos.insignias, "insignias").filter((b) => b && b.texto),
      unidades: numero(recibidos.unidades, "unidades"),
      horas_trabajo: numero(recibidos.horas_trabajo, "horas_trabajo"),
      profesor: docente(recibidos.profesor, sinNingunDato ? SIN_DATOS.profesor : docenteVacio),
      profesor_tutor: (recibidos.profesor_tutor && typeof recibidos.profesor_tutor === "object")
        ? docente(recibidos.profesor_tutor, docenteVacio) : null,
      video: cadena(recibidos.video, "video"),
      video_titulo: cadena(recibidos.video_titulo, "video_titulo"),
      video_parrafos: lista(recibidos.video_parrafos, "video_parrafos"),
      dea_video: cadena(recibidos.dea_video, "dea_video"),
      dea_imagen: cadena(recibidos.dea_imagen, "") || "",
      dea_titulo: cadena(recibidos.dea_titulo, "dea_titulo"),
      dea_parrafos: lista(recibidos.dea_parrafos, "dea_parrafos"),
      dea_descarga_url: cadena(recibidos.dea_descarga_url, "dea_descarga_url"),
      bienvenida: (function () {
        const b = Object.assign({}, sinNingunDato ? SIN_DATOS.bienvenida : { titulo: "", parrafos: [], frase_destacada: "" },
          (recibidos.bienvenida && typeof recibidos.bienvenida === "object") ? recibidos.bienvenida : {});
        b.parrafos = Array.isArray(b.parrafos) ? b.parrafos.filter(tieneTexto) : [];
        return b;
      })(),
      aprenderas: lista(recibidos.aprenderas, "aprenderas").filter((a) => a && (a.titulo || a.detalle)),
      aprenderas_texto: (Array.isArray(recibidos.aprenderas_texto) && recibidos.aprenderas_texto.some(tieneTexto))
        ? recibidos.aprenderas_texto.filter(tieneTexto)
        : (sinNingunDato ? SIN_DATOS.aprenderas_texto : null),
      aprenderas_imagen: recibidos.aprenderas_imagen || "",
      tutorias: normalizarTutorias(recibidos, sinNingunDato),
      modulos: (Array.isArray(recibidos.modulos) ? recibidos.modulos : ejemplo("modulos", [])).filter(Boolean).map((m, i) => ({
        nombre: m.nombre || (sinNingunDato ? SIN_DATOS_MODULO.nombre : `Módulo ${i + 1}`),
        url: m.url || SIN_DATOS_MODULO.url,
        ilustracion: m.ilustracion || "",
        sectionid: m.sectionid || null
      })),
      secciones: (recibidos.secciones && typeof recibidos.secciones === "object") ? recibidos.secciones : {},
      diapositivas_extra: Array.isArray(recibidos.diapositivas_extra) ? recibidos.diapositivas_extra : [],
      recursos: normalizarRecursos(Array.isArray(recibidos.recursos) ? recibidos.recursos : (sinNingunDato ? SIN_DATOS.recursos : [])),
      fondos: normalizarFondos(recibidos.fondos)
    };
  }

  /* ---------------------------------------------------------------------
   * 3b. URLs de video (mismas reglas que utils::normalizar_url_embebible)
   * ------------------------------------------------------------------- */
  function toEmbedUrl(url) {
    url = urlSegura(url);
    if (!url || url === "#") return "";
    let m = url.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed|shorts|live|v)\/)([\w-]{11})/);
    if (m) return `https://www.youtube.com/embed/${m[1]}`;
    m = url.match(/youtube\.com\/watch\?(?:[^#]*&)?v=([\w-]{11})/);
    if (m) return `https://www.youtube.com/embed/${m[1]}`;
    m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (m) return `https://player.vimeo.com/video/${m[1]}`;
    m = url.match(/drive\.google\.com\/file\/(?:u\/\d+\/)?d\/([\w-]+)/) || url.match(/drive\.google\.com\/(?:open|uc)\?(?:[^#]*&)?id=([\w-]+)/);
    if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
    m = url.match(/docs\.google\.com\/(document|presentation|spreadsheets)\/(?:u\/\d+\/)?d\/([\w-]+)/);
    if (m) return `https://docs.google.com/${m[1]}/d/${m[2]}/preview`;
    return url;
  }
  function miniaturaVideo(embed) {
    let m = embed.match(/youtube\.com\/embed\/([\w-]{11})/);
    if (m) return `https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg`;
    m = embed.match(/drive\.google\.com\/file\/d\/([\w-]+)\/preview/);
    if (m) return `https://drive.google.com/thumbnail?id=${m[1]}&sz=w1280`;
    return "";
  }
  function conAutoplay(embed) {
    if (!/youtube\.com\/embed\/|player\.vimeo\.com\/video\//.test(embed)) return embed;
    return embed + (embed.indexOf("?") === -1 ? "?" : "&") + "autoplay=1";
  }
  function origenVideo(embed) {
    if (/youtube(?:-nocookie)?\.com\/embed\//.test(embed)) return "youtube";
    if (/player\.vimeo\.com\//.test(embed)) return "vimeo";
    if (/drive\.google\.com\/file\/d\//.test(embed)) return "drive";
    if (/docs\.google\.com\//.test(embed)) return "docs";
    return "otro";
  }
  function enlaceExterno(embed) {
    let m = embed.match(/drive\.google\.com\/file\/d\/([\w-]+)\/preview/);
    if (m) return `https://drive.google.com/file/d/${m[1]}/view`;
    m = embed.match(/docs\.google\.com\/(document|presentation|spreadsheets)\/d\/([\w-]+)\/preview/);
    if (m) return `https://docs.google.com/${m[1]}/d/${m[2]}/view`;
    return "";
  }

  /* ---------------------------------------------------------------------
   * 4. Utilidades
   * ------------------------------------------------------------------- */
  function capitalizar(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
  function formatHora12(hhmm) {
    const partes = String(hhmm || "").split(":");
    const h = Number(partes[0]);
    const m = Number(partes[1]) || 0;
    if (!Number.isFinite(h)) return hhmm || "";
    return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
  }
  const DIA_INDICE = { domingo: 0, lunes: 1, martes: 2, miercoles: 3, "miércoles": 3, jueves: 4, viernes: 5, sabado: 6, "sábado": 6 };
  function proximaOcurrencia(bloque, ahora) {
    const diaIdx = DIA_INDICE[String(bloque.dia || "").toLowerCase().trim()];
    if (diaIdx === undefined) return null;
    const [hi, mi] = String(bloque.inicio).split(":").map(Number);
    const [hf, mf] = String(bloque.fin).split(":").map(Number);
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
  function estadoTutorias(horario) {
    const ahora = new Date();
    const ocurrencias = horario.map((b) => proximaOcurrencia(b, ahora)).filter(Boolean);
    if (!ocurrencias.length) return null;
    const enVivo = ocurrencias.find((o) => o.enVivo);
    if (enVivo) return enVivo;
    ocurrencias.sort((a, b) => a.fecha - b.fecha);
    return ocurrencias[0];
  }
  // Parrafos con entrada escalonada (la de la propuesta: un parrafo tras otro).
  function parrafosHtml(lista, base, pasoS) {
    return (lista || []).filter(tieneTexto).map((p, i) =>
      `<p class="rv" style="--d:${(base + Math.min(i, 6) * pasoS).toFixed(2)}s">${texto(p)}</p>`).join("");
  }
  function iniciales(nombre) {
    // Solo palabras que empiezan con letra y no son titulos abreviados ("Dr.", "Mg.").
    const partes = decodificar(nombre || "").trim().split(/\s+/).filter((p) => /^\p{L}/u.test(p) && !/\.$/.test(p));
    if (!partes.length) return "";
    return (partes[0].charAt(0) + (partes.length > 1 ? partes[partes.length - 1].charAt(0) : "")).toUpperCase();
  }
  // Avatar generico de Moodle (sin foto real): mejor el medallon con iniciales.
  function esFotoGenerica(url) {
    return /\/theme\/image\.php\/.*\/u\/f[123]\b|\/pix\/u\/f[123]\./.test(url);
  }

  /* ---------------------------------------------------------------------
   * 4b. Medios bajo demanda (guia 2.4): las imagenes de diapositivas no
   *     activas esperan en data-src; los iframes de diapositivas
   *     personalizadas en data-diferido (se cargan al activar y se
   *     descargan al salir).
   * ------------------------------------------------------------------- */
  function imagenDiferida(img, url, alFallar) {
    if (!img) return;
    img.removeAttribute("src");
    delete img.dataset.src;
    if (!url) return;
    img.dataset.src = url;
    img.onerror = alFallar ? () => { img.onerror = null; alFallar(img); } : null;
  }
  function cargarImagenes(raiz) {
    if (!raiz) return;
    $$("img[data-src]", raiz).forEach((img) => {
      const url = img.dataset.src;
      delete img.dataset.src;
      img.src = url;
    });
  }
  function activarMedios(slideEl) {
    if (!slideEl) return;
    cargarImagenes(slideEl);
    $$("iframe[data-diferido]", slideEl).forEach((f) => {
      if (f.getAttribute("src") !== f.dataset.diferido) f.setAttribute("src", f.dataset.diferido);
    });
  }
  function desactivarMedios(slideEl) {
    if (!slideEl) return;
    $$("iframe[data-diferido]", slideEl).forEach((f) => {
      if (f.hasAttribute("src")) { f.src = "about:blank"; f.removeAttribute("src"); }
    });
  }

  /* ---------------------------------------------------------------------
   * 4c. Lectura: los textos largos se desplazan dentro de su caja y sus
   *     bordes se desvanecen (clases que lee visor.css).
   * ------------------------------------------------------------------- */
  function medirLectura(el) {
    if (!el || !el.isConnected) return;
    const desborda = el.scrollHeight > el.clientHeight + 4;
    el.classList.toggle("desborda", desborda);
    if (!desborda) {
      el.classList.remove("al-inicio", "al-final");
      el.removeAttribute("tabindex");
      return;
    }
    el.tabIndex = 0; // region con desplazamiento: alcanzable con el teclado
    el.classList.toggle("al-inicio", el.scrollTop <= 2);
    el.classList.toggle("al-final", el.scrollTop + el.clientHeight >= el.scrollHeight - 2);
  }
  const vigiaLectura = window.ResizeObserver ? new ResizeObserver((e) => e.forEach((x) => medirLectura(x.target))) : null;
  function initLecturas() {
    $$(".lectura").forEach((el) => {
      el.addEventListener("scroll", () => medirLectura(el), { passive: true });
      if (vigiaLectura) vigiaLectura.observe(el);
      medirLectura(el);
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => $$(".lectura").forEach(medirLectura));
  }

  /* ---------------------------------------------------------------------
   * 4d. Dialogos nativos: video (el reproductor existe solo mientras esta
   *     abierto) y contenido (actividades, "Leer mas", personalizadas).
   *     Con un dialogo abierto el fondo animado se pausa.
   * ------------------------------------------------------------------- */
  let disparadorDialogo = null;
  function abrirDialogo(d, disparador) {
    disparadorDialogo = disparador || document.activeElement;
    if (escenario.motor) escenario.motor.pausar();
    if (typeof d.showModal === "function") d.showModal(); else d.setAttribute("open", "");
  }
  function cerrarDialogo(d) {
    if (typeof d.close === "function") d.close(); else { d.removeAttribute("open"); d.dispatchEvent(new Event("close")); }
  }
  function alCerrarDialogo() {
    if (!document.querySelector("dialog[open]") && escenario.motor) escenario.motor.reanudar();
    if (disparadorDialogo && disparadorDialogo.isConnected && typeof disparadorDialogo.focus === "function") {
      disparadorDialogo.focus({ preventScroll: true });
    }
    disparadorDialogo = null;
  }

  function abrirVideo(url, titulo, disparador) {
    const embed = toEmbedUrl(url);
    if (!embed) return;
    const d = $("#dialogoVideo");
    const origen = origenVideo(embed);
    const nombre = decodificar(titulo) || "Video";
    $("#dialogoVideoTitulo").textContent = nombre;
    const externo = enlaceExterno(embed);
    const enlace = $("#dialogoVideoExterno");
    enlace.hidden = !externo;
    if (externo) {
      enlace.href = externo;
      $("span", enlace).textContent = origen === "docs" ? "Abrir en Google Docs" : "Abrir en Google Drive";
    }
    $("#dialogoVideoNota").hidden = origen !== "drive";
    const pantalla = $("#dialogoVideoPantalla");
    pantalla.dataset.origen = origen;
    const f = document.createElement("iframe");
    f.title = nombre;
    f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    f.setAttribute("allowfullscreen", "");
    f.referrerPolicy = "strict-origin-when-cross-origin";
    f.src = conAutoplay(embed);
    pantalla.replaceChildren(f);
    abrirDialogo(d, disparador);
  }

  // contenido: { titulo, bajada, html (de confianza o ya escapado), iframe, accion:{href,texto}, medio }
  function abrirContenido(op, disparador) {
    const d = $("#dialogoContenido");
    $("#dialogoContenidoTitulo").textContent = decodificar(op.titulo || "");
    const bajada = $("#dialogoContenidoBajada");
    bajada.textContent = decodificar(op.bajada || "");
    bajada.hidden = !op.bajada;
    const cuerpo = $("#dialogoContenidoCuerpo");
    cuerpo.className = "dialogo-cuerpo";
    d.classList.toggle("es-medio", !!op.medio);
    if (op.iframe) {
      const f = document.createElement("iframe");
      f.title = decodificar(op.titulo || "Recurso");
      f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      f.setAttribute("allowfullscreen", "");
      f.referrerPolicy = "strict-origin-when-cross-origin";
      f.src = op.iframe;
      cuerpo.replaceChildren(f);
    } else {
      if (op.medio) cuerpo.classList.add("es-html");
      cuerpo.innerHTML = op.html || "";
    }
    const pie = $("#dialogoContenidoPie");
    const href = op.accion ? attrUrl(op.accion.href) : "";
    pie.innerHTML = href
      ? `<a class="boton boton--marea" href="${href}" target="_blank" rel="noopener"><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i> ${texto(op.accion.texto || "Abrir")}</a>`
      : "";
    pie.hidden = !pie.innerHTML;
    abrirDialogo(d, disparador);
  }

  function initDialogos() {
    [$("#dialogoVideo"), $("#dialogoContenido")].forEach((d) => {
      $$("[data-cerrar]", d).forEach((b) => b.addEventListener("click", () => cerrarDialogo(d)));
      // Clic en el fondo (fuera de la caja) cierra.
      d.addEventListener("click", (e) => {
        if (e.target !== d) return;
        const r = d.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) cerrarDialogo(d);
      });
      d.addEventListener("close", () => {
        // Se destruye lo que tenga dentro: el video deja de sonar.
        if (d.id === "dialogoVideo") $("#dialogoVideoPantalla").replaceChildren();
        else { $("#dialogoContenidoCuerpo").replaceChildren(); $("#dialogoContenidoPie").replaceChildren(); }
        alCerrarDialogo();
      });
    });
  }

  /* ---------------------------------------------------------------------
   * 5. Escenario: el fondo de todo el mazo. Cada escena dice que color
   *    base, que velo, que foto (y con que opacidad) y que motor animado
   *    usa. La foto se decodifica en la capa oculta y luego se funde.
   * ------------------------------------------------------------------- */
  const DEFECTO = {
    oscuro: { src: "./assets/img/fondo-oscuro-1686.webp", srcset: "./assets/img/fondo-oscuro-960.webp 960w, ./assets/img/fondo-oscuro-1686.webp 1686w" },
    claro: { src: "./assets/img/fondo-claro-1686.webp", srcset: "./assets/img/fondo-claro-960.webp 960w, ./assets/img/fondo-claro-1686.webp 1686w" }
  };
  const ESCENAS = {
    inicio: { base: "noche", tono: "oscuro", velo: "inicio", ranura: "hero", red: true },
    presentacion: { base: "noche", tono: "oscuro", velo: "presentacion", ranura: "presentacion", red: true },
    bienvenida: { base: "noche", tono: "oscuro", velo: "bienvenida", ranura: "bienvenida", red: true },
    aprenderas: { base: "gris", tono: "claro", velo: "claro-izq", ranura: "aprenderas", red: true },
    dea: { base: "gris", tono: "claro", velo: "claro-der", ranura: "dea", red: true },
    docente: { base: "docente", tono: "oscuro", velo: "docente", ranura: "docente", ondas: true, vineta: true, soloPropia: true },
    "docente-foto": { base: "docente", tono: "oscuro", velo: "docente-foto", ranura: "docente", vineta: true },
    tutorias: { base: "noche", tono: "oscuro", velo: "tutorias", ranura: "tutorias", red: true },
    actividades: { base: "noche", tono: "oscuro", velo: "actividades", ranura: "actividades", red: true, opacidad: 0.6 },
    unidades: { base: "noche", tono: "oscuro", velo: "unidades", ranura: "unidades", red: true, opacidad: 0.34 },
    media: { base: "noche", tono: "oscuro", velo: "media", ranura: "general", red: true, opacidad: 0.5 },
    // Pagina completa: casi siempre una web clara; la barra se pone clara.
    pagina: { base: "gris", tono: "claro", velo: "claro-izq", ranura: "general", opacidad: 0.5 }
  };

  const escenario = {
    el: null, fotos: [], velos: [], fotoVisible: 0, veloVisible: 0, veloActual: "inicio",
    fondos: {}, fallidas: new Set(), precargadas: new Set(), token: 0, motor: null, actual: "",

    iniciar(fondos, modesto) {
      this.el = $("#escenario");
      this.fotos = [$("#fondoFotoA"), $("#fondoFotoB")];
      this.velos = [$("#fondoVeloA"), $("#fondoVeloB")];
      this.fondos = fondos || {};
      // La foto A ya la pidio el script del <head>; si no carga, la del visor.
      const a = this.fotos[0];
      const fallo = () => {
        const clave = a.dataset.clave || "";
        if (clave.charAt(0) === "d") return;
        this.fallidas.add(clave.replace(/^[gr]:/, "").replace(/#(oscuro|claro)$/, ""));
        a.dataset.clave = "";
        this.mostrar(this.actual || "inicio");
      };
      if (a.complete && a.getAttribute("src") && !a.naturalWidth) fallo();
      else a.addEventListener("error", fallo, { once: true });
      if (window.FondoIncca) {
        const e = ESCENAS.inicio;
        this.motor = window.FondoIncca.iniciar({
          red: $("#fondoRed"), ondas: $("#fondoOndas"), anfitrion: this.el, modesto,
          escena: { red: e.red, ondas: false, tema: e.tono },
          urlTrabajador: "./assets/js/fondo.js?v=" + VERSION
        });
      }
    },
    resolver(nombre) {
      if (nombre === "docente" && this.fondos.docente) return ESCENAS["docente-foto"];
      return ESCENAS[nombre] || ESCENAS.inicio;
    },
    foto(e) {
      const propia = this.fondos[e.ranura] || (e.ranura !== "docente" ? this.fondos.general : null);
      if (propia) {
        const graduada = propia[e.tono];
        if (graduada && !this.fallidas.has(graduada)) return { clave: "g:" + graduada, src: graduada };
        if (propia.original && !this.fallidas.has(propia.original)) {
          return { clave: "r:" + propia.original + "#" + e.tono, src: propia.original, cruda: true, tono: e.tono };
        }
      }
      if (e.soloPropia) return null;
      return { clave: "d:" + e.tono, src: DEFECTO[e.tono].src, srcset: DEFECTO[e.tono].srcset };
    },
    mostrar(nombre) {
      this.actual = nombre;
      const e = this.resolver(nombre);
      const el = this.el;
      el.dataset.base = e.base;
      el.dataset.tono = e.tono;
      el.toggleAttribute("data-red", !!e.red);
      el.toggleAttribute("data-ondas", !!e.ondas);
      el.toggleAttribute("data-vineta", !!e.vineta);
      $("#deck").dataset.tema = e.tono;

      if (e.velo !== this.veloActual) {
        const sig = this.velos[1 - this.veloVisible];
        sig.className = "escenario-velo velo--" + e.velo + " is-visible";
        this.velos[this.veloVisible].classList.remove("is-visible");
        this.veloVisible = 1 - this.veloVisible;
        this.veloActual = e.velo;
      }

      const f = this.foto(e);
      const tok = ++this.token;
      const visible = this.fotos[this.fotoVisible];
      const opacidad = String(e.opacidad || 1);
      if (!f) {
        // Escena sin foto (docente con ondas): la foto se funde.
        this.fotos.forEach((img) => img.classList.remove("is-visible"));
      } else if (visible.dataset.clave === f.clave) {
        // Misma foto: solo cambia su opacidad (o vuelve a aparecer). La
        // primera vez se espera a que este decodificada: entra con fundido.
        visible.style.setProperty("--foto-opacidad", opacidad);
        if (visible.complete && visible.naturalWidth) visible.classList.add("is-visible");
        else {
          (visible.decode ? visible.decode() : Promise.resolve())
            .then(() => { if (tok === this.token) visible.classList.add("is-visible"); }, () => {});
        }
      } else {
        const idx = 1 - this.fotoVisible;
        const img = this.fotos[idx];
        this.cargar(img, f).then((ok) => {
          if (tok !== this.token) return; // el usuario ya paso a otra diapositiva
          if (!ok) {
            this.fallidas.add(f.src);
            img.dataset.clave = "";
            if (f.clave.charAt(0) !== "d") this.mostrar(nombre);
            return;
          }
          img.style.setProperty("--foto-opacidad", opacidad);
          img.classList.add("is-visible");
          this.fotos[this.fotoVisible].classList.remove("is-visible");
          this.fotoVisible = idx;
        });
      }
      if (this.motor) this.motor.escena({ red: !!e.red, ondas: !!e.ondas, tema: e.tono });
    },
    cargar(img, f) {
      img.classList.toggle("is-propia", !!f.cruda);
      img.classList.toggle("tono-oscuro", !!f.cruda && f.tono === "oscuro");
      img.classList.toggle("tono-claro", !!f.cruda && f.tono === "claro");
      img.dataset.clave = f.clave;
      if (f.srcset) { img.sizes = "100vw"; img.srcset = f.srcset; } else { img.removeAttribute("srcset"); img.removeAttribute("sizes"); }
      img.src = f.src;
      const espera = img.decode ? img.decode() : new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
      return espera.then(() => true, () => false);
    },
    // Precarga (y decodifica) la foto de una escena para que el fundido sea inmediato.
    precargar(nombre) {
      const f = this.foto(this.resolver(nombre));
      if (!f || this.precargadas.has(f.clave)) return;
      this.precargadas.add(f.clave);
      const i = new Image();
      i.decoding = "async";
      if (f.srcset) { i.sizes = "100vw"; i.srcset = f.srcset; }
      i.src = f.src;
      if (i.decode) i.decode().catch(() => {});
    }
  };

  /* ---------------------------------------------------------------------
   * 6. Mazo: navegacion entre diapositivas
   * ------------------------------------------------------------------- */
  const deck = {
    el: null, slides: [], actual: 0, total: 0,

    init() {
      this.el = $("#deck");
      this.slides = SLIDES.map((s) => document.getElementById(s.id));
      this.total = this.slides.length;
      this.slides.forEach((el, i) => {
        const activa = i === 0;
        el.classList.toggle("is-active", activa);
        el.classList.toggle("is-dormida", !activa);
        el.setAttribute("aria-hidden", activa ? "false" : "true");
        el.inert = !activa;
      });
      activarMedios(this.slides[0]);
      if (this.total > 1) cargarImagenes(this.slides[1]);
      escenario.mostrar(SLIDES[0].escena);
      if (this.total > 1) escenario.precargar(SLIDES[1].escena);
      this.chrome();
      this.extras(SLIDES[0].id);
    },

    goTo(index) {
      const total = this.total;
      if (total < 2) return;
      const idx = ((index % total) + total) % total;
      if (idx === this.actual) return;
      const dir = this.direccion(idx);
      const oldEl = this.slides[this.actual];
      const newEl = this.slides[idx];

      newEl.classList.remove("is-dormida");
      newEl.inert = false;
      newEl.classList.add(dir > 0 ? "is-enter-right" : "is-enter-left");
      void newEl.offsetWidth; // reflow: la entrada parte del lado correcto
      oldEl.classList.remove("is-active");
      oldEl.classList.add(dir > 0 ? "is-exit-left" : "is-exit-right");
      newEl.classList.remove(dir > 0 ? "is-enter-right" : "is-enter-left");
      newEl.classList.add("is-active");
      oldEl.setAttribute("aria-hidden", "true");
      newEl.setAttribute("aria-hidden", "false");
      oldEl.inert = true;

      setTimeout(() => {
        ["is-exit-left", "is-exit-right", "is-enter-left", "is-enter-right"].forEach((c) => { oldEl.classList.remove(c); newEl.classList.remove(c); });
        if (!oldEl.classList.contains("is-active")) oldEl.classList.add("is-dormida");
      }, 600);

      desactivarMedios(oldEl);
      activarMedios(newEl);
      cargarImagenes(this.slides[(idx + 1) % total]);

      this.actual = idx;
      escenario.mostrar(SLIDES[idx].escena);
      escenario.precargar(SLIDES[(idx + 1) % total].escena);
      escenario.precargar(SLIDES[(idx - 1 + total) % total].escena);
      this.chrome();
      this.anunciar();
      $$(".lectura", newEl).forEach(medirLectura);
      this.extras(SLIDES[idx].id);
    },
    direccion(idx) {
      const adelante = (idx - this.actual + this.total) % this.total;
      const atras = (this.actual - idx + this.total) % this.total;
      return adelante <= atras ? 1 : -1;
    },
    next() { this.goTo(this.actual + 1); },
    prev() { this.goTo(this.actual - 1); },

    chrome() {
      const s = SLIDES[this.actual];
      const nav = $("#deckNav");
      $$(".nav-item", nav).forEach((item, i) => {
        const activo = i === this.actual;
        item.classList.toggle("is-active", activo);
        if (activo) item.setAttribute("aria-current", "step"); else item.removeAttribute("aria-current");
        if (activo && nav.scrollWidth > nav.clientWidth) {
          const destino = item.offsetLeft - nav.clientWidth / 2 + item.offsetWidth / 2;
          nav.scrollTo({ left: Math.max(0, destino), behavior: reducido() ? "auto" : "smooth" });
        }
      });
      $("#deckProgreso").style.setProperty("--p", ((this.actual + 1) / this.total).toFixed(4));
      this.el.dataset.slide = s.id;
      this.el.toggleAttribute("data-completa", !!s.completa);
    },
    anunciar() {
      const s = SLIDES[this.actual];
      $("#deckAnuncio").textContent = `Diapositiva ${this.actual + 1} de ${this.total}: ${s.label}`;
    },
    extras(id) {
      if (id === "hero") animarContadores($("#hero"));
      if (id === "tutorias") paso("tutorias_estado", actualizarEstadoTutorias);
    }
  };

  /* ---------------------------------------------------------------------
   * 7. Navegacion: barra, flechas, saltos, teclado y gesto
   * ------------------------------------------------------------------- */
  function renderNavegacion() {
    const nav = $("#deckNav");
    nav.innerHTML = SLIDES.map((s, i) => `
      <button class="nav-item" type="button" data-ir="${i}" aria-label="Ir a ${texto(s.label)}" title="${texto(s.label)}">
        <i class="fa-solid ${icono(s.icon, "fa-circle")}" aria-hidden="true"></i>
        <span class="nav-item-texto">${texto(s.label)}</span>
      </button>`).join("");
    $$("[data-ir]", nav).forEach((b) => b.addEventListener("click", () => deck.goTo(Number(b.dataset.ir))));
    $("#deckPrev").addEventListener("click", () => deck.prev());
    $("#deckNext").addEventListener("click", () => deck.next());
    const unaSola = SLIDES.length < 2;
    $("#deckPrev").hidden = unaSola;
    $("#deckNext").hidden = unaSola;
    nav.hidden = unaSola;
  }

  // Un boton cuyo destino no existe se oculta (si no, goTo(-1) iria a la ultima).
  function enlazarSalto(btn, slideId) {
    if (!btn) return;
    const i = SLIDES.findIndex((s) => s.id === slideId);
    if (i === -1) { btn.hidden = true; return; }
    btn.addEventListener("click", () => deck.goTo(i));
  }
  function initSaltos() {
    enlazarSalto($("#heroIrAprenderas"), "aprenderas");
    enlazarSalto($("#heroIrTutorias"), "tutorias");
    ["heroIrUnidades", "presentacionIrUnidades", "deaIrUnidades"].forEach((id) => enlazarSalto($("#" + id), "unidades"));
  }

  function initTeclado() {
    document.addEventListener("keydown", (e) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      if (document.querySelector("dialog[open]")) return;
      const t = e.target;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      const enLectura = t && t.closest && t.closest(".lectura");
      if (e.key === "ArrowRight" || (e.key === "PageDown" && !enLectura)) { e.preventDefault(); deck.next(); }
      else if (e.key === "ArrowLeft" || (e.key === "PageUp" && !enLectura)) { e.preventDefault(); deck.prev(); }
      else if (e.key === "Home" && !enLectura) { e.preventDefault(); deck.goTo(0); }
      else if (e.key === "End" && !enLectura) { e.preventDefault(); deck.goTo(deck.total - 1); }
    });
  }

  function initGesto() {
    const el = $("#slides");
    let sx = 0, sy = 0, siguiendo = false;
    el.addEventListener("touchstart", (e) => {
      if (e.touches.length !== 1) { siguiendo = false; return; }
      sx = e.touches[0].clientX; sy = e.touches[0].clientY; siguiendo = true;
    }, { passive: true });
    el.addEventListener("touchend", (e) => {
      if (!siguiendo) return;
      siguiendo = false;
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.3) { if (dx < 0) deck.next(); else deck.prev(); }
    }, { passive: true });
  }

  /* ---------------------------------------------------------------------
   * 8. INICIO
   * ------------------------------------------------------------------- */
  function renderInicio(datos) {
    const nombre = decodificar(datos.curso).trim();
    document.title = `${nombre || "Curso"} — U.INCCA`;
    const titulo = $("#heroTitulo");
    titulo.textContent = nombre;
    // Ajuste fino del tamano por largo (las mayusculas ocupan mas).
    const mayus = nombre.length > 3 && nombre === nombre.toUpperCase() && /\p{Lu}/u.test(nombre);
    const largo = nombre.length * (mayus ? 1.22 : 1);
    if (largo > 54) titulo.dataset.largo = "largo"; else if (largo > 28) titulo.dataset.largo = "medio";
    if (mayus) titulo.dataset.mayusculas = "";

    const resumen = decodificar(datos.resumen).trim();
    const r = $("#heroResumen");
    r.textContent = resumen;
    $("#heroResumenCaja").hidden = !resumen;
    if (resumen.length > 380) r.dataset.largo = "largo"; else if (resumen.length > 230) r.dataset.largo = "medio";

    const insignias = datos.insignias || [];
    const caja = $("#heroInsignias");
    caja.innerHTML = insignias.map((b) => `
      <span class="insignia${b.destacada ? " insignia--oro" : ""}"><i class="fa-solid ${icono(b.icono, "fa-circle")}" aria-hidden="true"></i> ${texto(b.texto)}</span>`).join("");
    caja.hidden = !insignias.length;

    renderFicha(datos);
  }

  // Ficha del curso: solo cifras mayores que 0 (una ficha en 0 no informa nada).
  function renderFicha(datos) {
    const totalActividades = datos.recursos.reduce((n, r) => n + (r.items ? r.items.length : 0), 0);
    const fichas = [
      { icono: "fa-layer-group", valor: datos.unidades, texto: "Unidades" },
      { icono: "fa-clock", valor: datos.horas_trabajo, sufijo: "h", texto: "Trabajo directo" },
      { icono: "fa-video", valor: datos.tutorias.horario.length, texto: "Tutorías en vivo" },
      { icono: "fa-book-open", valor: datos.modulos.length, texto: "Módulos", oro: true },
      { icono: "fa-list-check", valor: totalActividades, texto: "Actividades" }
    ].filter((f) => Number(f.valor) > 0);
    const caja = $("#heroFicha");
    caja.innerHTML = fichas.map((f, i) => {
      const ancha = fichas.length % 2 === 1 && i === fichas.length - 1;
      const valor = Math.round(Number(f.valor));
      return `
      <div class="ficha${f.oro ? " ficha--oro" : ""}${ancha ? " ficha--ancha" : ""}" role="listitem" style="--i:${i}" aria-label="${valor}${f.sufijo || ""} ${esc(f.texto)}">
        <span class="ficha-icono" aria-hidden="true"><i class="fa-solid ${f.icono}"></i></span>
        <span class="ficha-num" aria-hidden="true" data-contador="${valor}" data-sufijo="${f.sufijo || ""}">${valor}${f.sufijo || ""}</span>
        <span class="ficha-texto" aria-hidden="true">${esc(f.texto)}</span>
      </div>`;
    }).join("");
    caja.hidden = !fichas.length;
    $("#heroGrid").classList.toggle("inicio-grid--sin-ficha", !fichas.length);
  }

  function animarContadores(raiz) {
    $$("[data-contador]", raiz).forEach((el) => {
      const meta = Number(el.dataset.contador) || 0;
      const sufijo = el.dataset.sufijo || "";
      if (reducido() || meta <= 1) { el.textContent = meta + sufijo; return; }
      const duracion = 1100;
      let inicio = null;
      el.textContent = "0" + sufijo;
      const tic = (ts) => {
        if (inicio === null) inicio = ts;
        const p = Math.min(1, (ts - inicio) / duracion);
        el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * meta) + sufijo;
        if (p < 1) requestAnimationFrame(tic);
      };
      // Arranca cuando la ficha empieza a entrar (ver .ficha en visor.css).
      setTimeout(() => requestAnimationFrame(tic), 450);
    });
  }

  /* ---------------------------------------------------------------------
   * 9. PRESENTACION y BIENVENIDA
   * ------------------------------------------------------------------- */
  function renderPresentacion(datos) {
    const titulo = decodificar(datos.video_titulo).trim();
    $("#presentacionTitulo").textContent = titulo || "Presentación del curso";
    $("#presentacionParrafos").innerHTML = parrafosHtml(datos.video_parrafos, 0.26, 0.1);
    const embed = toEmbedUrl(datos.video);
    $("#presentacion").classList.toggle("sin-video", !embed);
    $("#presentacionPlay").hidden = !embed;
    if (embed) {
      $("#presentacionVideoBtn").addEventListener("click", (e) =>
        abrirVideo(datos.video, titulo || "Presentación del curso", e.currentTarget));
    }
  }

  function renderBienvenida(datos) {
    const b = datos.bienvenida;
    $("#bienvenidaTitulo").textContent = decodificar(b.titulo).trim() || "¡Bienvenidos al curso!";
    $("#bienvenidaParrafos").innerHTML = parrafosHtml(b.parrafos, 0.45, 0.1);
    // Sin parrafos no hay carta: titulo, frase y sello ocupan el ancho.
    $("#bienvenidaCarta").hidden = !b.parrafos.length;
    // Letra capital solo si el texto empieza con letra (con "¡" o comillas se veria rara).
    const primero = $("#bienvenidaParrafos p");
    if (primero && /^\p{L}/u.test(primero.textContent)) primero.classList.add("capitular");
    $("#bienvenida").classList.toggle("sin-carta", !b.parrafos.length);
    const frase = decodificar(b.frase_destacada).trim();
    $("#bienvenidaFrase").textContent = frase;
    $("#bienvenidaCita").hidden = !tieneTexto(frase);
  }

  /* ---------------------------------------------------------------------
   * 10. QUE APRENDERAS
   *  - texto largo + imagen   -> panel azul + imagen con halo
   *  - texto largo (sin imagen) + tarjetas -> panel + tarjetas (la propuesta)
   *  - texto largo solo       -> panel (la foto de fondo queda a la vista)
   *  - solo tarjetas          -> grilla de tarjetas
   *  El texto sigue reemplazando a las tarjetas cuando hay imagen, como
   *  explica el formulario del plugin.
   * ------------------------------------------------------------------- */
  function renderAprenderas(datos) {
    const cuerpo = $("#aprenderasCuerpo");
    const panel = $("#aprenderasPanel");
    const lista = $("#aprenderasTarjetas");
    const marco = $("#aprenderasImagenMarco");
    const largo = Array.isArray(datos.aprenderas_texto) && datos.aprenderas_texto.length ? datos.aprenderas_texto : null;
    const tarjetas = datos.aprenderas || [];
    const imagen = urlSegura(datos.aprenderas_imagen);
    const modo = (m) => { cuerpo.className = "aprenderas-cuerpo aprenderas-cuerpo--" + m; };

    const mostrarTarjetas = () => {
      lista.innerHTML = tarjetas.map((t, i) => `
        <article class="tarjeta" role="listitem" style="--i:${Math.min(i, 8)}">
          <span class="tarjeta-icono" aria-hidden="true"><i class="fa-solid ${icono(t.icono, "fa-star")}"></i></span>
          <h3 class="tarjeta-titulo">${texto(t.titulo)}</h3>
          ${tieneTexto(t.detalle) ? `<p class="tarjeta-detalle">${texto(t.detalle)}</p>` : ""}
        </article>`).join("");
      if (tarjetas.length > 4) lista.dataset.muchas = ""; else delete lista.dataset.muchas;
      lista.hidden = false;
    };

    if (largo) {
      $("#aprenderasTexto").innerHTML = parrafosHtml(largo, 0.27, 0.1);
      panel.hidden = false;
      if (imagen && imagen !== "#") {
        marco.hidden = false;
        modo("doble");
        // Imagen que no carga: el texto solo (nunca un recuadro roto).
        imagenDiferida($("#aprenderasImagen"), imagen, () => { marco.hidden = true; modo("texto"); });
      } else if (tarjetas.length) {
        mostrarTarjetas();
        modo("doble");
      } else {
        modo("texto");
      }
    } else if (tarjetas.length) {
      mostrarTarjetas();
      modo("tarjetas");
    }
  }

  /* ---------------------------------------------------------------------
   * 11. DEA: panel azul + imagen (gana) o video; sin medio, texto a dos columnas
   * ------------------------------------------------------------------- */
  function renderDea(datos) {
    const sec = $("#dea");
    const titulo = decodificar(datos.dea_titulo).trim();
    $("#deaTitulo").textContent = titulo || "DEA · Diseño de Experiencia para el Aprendizaje";
    $("#deaParrafos").innerHTML = parrafosHtml(datos.dea_parrafos, 0.3, 0.1);
    const medio = $("#deaMedio");
    const marco = $("#deaImagenMarco");
    const video = $("#deaVideo");
    const soloTexto = () => { medio.hidden = true; sec.classList.add("solo-texto"); };
    const imagen = urlSegura(datos.dea_imagen);
    const embed = toEmbedUrl(datos.dea_video);
    if (imagen && imagen !== "#") {
      medio.hidden = false; marco.hidden = false; video.hidden = true;
      imagenDiferida($("#deaImagen"), imagen, soloTexto);
    } else if (embed) {
      medio.hidden = false; video.hidden = false; marco.hidden = true;
      imagenDiferida($("img", video), miniaturaVideo(embed), (img) => img.remove());
      video.addEventListener("click", () => abrirVideo(datos.dea_video, titulo || "Video del DEA", video));
    } else {
      soloTexto();
    }
    const descarga = urlSegura(datos.dea_descarga_url);
    const btn = $("#deaDescarga");
    btn.hidden = !(descarga && descarga !== "#");
    if (!btn.hidden) btn.href = descarga;
  }

  /* ---------------------------------------------------------------------
   * 12. DOCENTES (creador y tutor): misma diapositiva, distinto rol.
   *     Con video: texto a la izquierda y retrato con play plateado; sin
   *     video: foto a sangre a la izquierda. Sin foto (o si no carga, o es
   *     el avatar generico de Moodle): medallon con las iniciales.
   * ------------------------------------------------------------------- */
  function renderDocente(sec, profesor) {
    const q = (s) => $(s, sec);
    const rolBase = sec.dataset.rol || "Docente";
    const nombre = decodificar(profesor.nombre).trim();
    const nom = q(".docente-nombre");
    nom.textContent = nombre;
    if (nombre.length > 30) nom.dataset.largo = "";
    const rol = decodificar(profesor.rol).trim();
    q(".docente-rol").textContent = rol ? `${rolBase} · ${rol}` : rolBase;
    const bio = q(".docente-bio");
    bio.innerHTML = parrafosHtml(profesor.bio, 0.38, 0.12);
    bio.hidden = !profesor.bio.length;
    const tags = q(".docente-etiquetas");
    tags.innerHTML = (profesor.etiquetas || []).map((t) =>
      `<span class="docente-etiqueta"><i class="fa-solid ${icono(t.icono, "fa-tag")}" aria-hidden="true"></i> ${texto(t.texto)}</span>`).join("");
    tags.hidden = !profesor.etiquetas.length;

    const grid = q(".docente-grid");
    const medio = q(".docente-medio");
    const img = q(".docente-foto");
    const caja = q(".medallon-caja");
    const plata = q(".boton-plata");
    const pildora = q(".video-pildora");
    q(".medallon-letras").textContent = iniciales(nombre) || "D";
    const embed = toEmbedUrl(profesor.video);
    grid.classList.toggle("docente--video", !!embed);

    const sinFoto = () => {
      grid.classList.add("docente--sin-foto");
      medio.classList.remove("foto-retrato");
      img.hidden = true;
      caja.hidden = false;
      plata.hidden = true;
      pildora.hidden = !embed;
    };
    const foto = urlSegura(profesor.foto);
    if (foto && foto !== "#" && !esFotoGenerica(foto)) {
      img.hidden = false;
      caja.hidden = true;
      plata.hidden = !embed;
      pildora.hidden = true;
      img.alt = nombre ? `Fotografía de ${nombre}` : "";
      imagenDiferida(img, foto, sinFoto);
      img.addEventListener("load", () => evaluarResolucion(img, medio));
    } else {
      sinFoto();
    }
    if (embed) {
      const abrir = (e) => abrirVideo(profesor.video, `Video de presentación · ${nombre || rolBase}`, e.currentTarget);
      plata.addEventListener("click", abrir);
      pildora.addEventListener("click", abrir);
    }
  }
  // Una foto chica estirada a media pantalla se ve borrosa: si habria que
  // ampliarla mas de 2 veces, se muestra como retrato enmarcado.
  function evaluarResolucion(img, medio) {
    const ancho = medio.clientWidth, alto = medio.clientHeight;
    if (!ancho || !alto || !img.naturalWidth) return;
    const ampliacion = Math.max(ancho / img.naturalWidth, alto / img.naturalHeight);
    medio.classList.toggle("foto-retrato", ampliacion > 2);
  }

  /* ---------------------------------------------------------------------
   * 13. TUTORIAS: franjas semanales + un solo enlace al aula
   * ------------------------------------------------------------------- */
  let horarioActual = [];
  function renderTutorias(tutorias) {
    horarioActual = tutorias.horario || [];
    const lista = $("#reunionLista");
    lista.innerHTML = horarioActual.map((b, i) => `
      <div class="reunion-franja" role="listitem" style="--i:${i}">
        <span class="reunion-dia"><i class="fa-solid fa-calendar-day" aria-hidden="true"></i> ${texto(capitalizar(b.dia))}</span>
        <span class="reunion-hora"><i class="fa-regular fa-clock" aria-hidden="true"></i> ${texto(formatHora12(b.inicio))} – ${texto(formatHora12(b.fin))}</span>
      </div>`).join("");
    if (horarioActual.length > 2) lista.dataset.muchas = ""; else delete lista.dataset.muchas;
    actualizarEstadoTutorias();
    const aula = urlSegura(tutorias.url_aula_virtual);
    const cta = $("#reunionCta");
    cta.hidden = !aula || aula === "#";
    if (!cta.hidden) cta.href = aula;
  }
  // "En vivo ahora" / "Proxima sesion": se recalcula cada vez que se entra a la diapositiva.
  function actualizarEstadoTutorias() {
    const estado = estadoTutorias(horarioActual);
    const p = $("#reunionProxima");
    if (!estado) { p.hidden = true; return; }
    p.hidden = false;
    if (estado.enVivo) {
      p.className = "reunion-proxima reunion-proxima--vivo";
      p.innerHTML = `<span class="punto-vivo" aria-hidden="true"></span> Clase en vivo ahora`;
    } else {
      p.className = "reunion-proxima";
      const cuando = estado.esHoy ? "Hoy" : capitalizar(estado.bloque.dia);
      p.innerHTML = `<i class="fa-regular fa-clock" aria-hidden="true"></i> Próxima sesión: ${texto(cuando)} · ${texto(formatHora12(estado.bloque.inicio))}`;
    }
  }

  /* ---------------------------------------------------------------------
   * 14. UNIDADES: acordeon de franjas verticales (la propuesta). Se abre al
   *     pasar el raton (con una pausa breve para no abrir todo al cruzar),
   *     con clic, con el foco o con las flechas del teclado.
   * ------------------------------------------------------------------- */
  function unitVisualMeta(nombre) {
    const n = (nombre || "").toLowerCase();
    if (n.includes("conecta")) return { icon: "fa-comments" };
    if (n.includes("apoyo")) return { icon: "fa-handshake" };
    const num = n.match(/(\d+)/);
    if (n.includes("semana") && num) return { number: num[1] };
    return { icon: "fa-layer-group" };
  }
  // Emblema generado para una unidad sin ilustracion (o cuya imagen no carga):
  // numero de la semana (cualquier N), icono de CONECTA / APOYO o "Unidad N",
  // en el mismo estilo del visor. Nunca un recuadro roto ni un enlace suelto.
  function emblemaUnidad(nombre, i) {
    const meta = unitVisualMeta(nombre);
    const n = (nombre || "").toLowerCase();
    const tipo = meta.number ? "semana" : n.includes("conecta") ? "conecta" : n.includes("apoyo") ? "apoyo" : "unidad";
    const etiqueta = { semana: "Semana", conecta: "Conecta", apoyo: "Apoyo", unidad: "Unidad" }[tipo];
    const numero = meta.number || (tipo === "unidad" ? String(i + 1) : "");
    const centro = numero
      ? `<span class="emblema-num">${esc(numero.padStart(2, "0"))}</span>`
      : `<i class="fa-solid ${meta.icon}"></i>`;
    return `<div class="emblema-unidad" data-tipo="${tipo}" aria-hidden="true">
      <span class="emblema-anillo emblema-anillo--1"></span>
      <span class="emblema-anillo emblema-anillo--2"><span class="emblema-satelite"></span></span>
      <span class="emblema-disco"><span class="emblema-etiqueta">${etiqueta}</span>${centro}</span>
    </div>`;
  }

  function renderUnidades(modulos) {
    const ac = $("#acordeon");
    if (!modulos.length) {
      ac.innerHTML = `<div class="vacio"><i class="fa-solid fa-door-closed" aria-hidden="true"></i> Este recurso todavía no tiene unidades.</div>`;
      return;
    }
    ac.style.setProperty("--n", modulos.length);
    ac.innerHTML = modulos.map((m, i) => {
      const meta = unitVisualMeta(m.nombre);
      const marca = meta.number
        ? `<span class="franja-marca" aria-hidden="true">${esc(meta.number)}</span>`
        : `<span class="franja-marca" aria-hidden="true"><i class="fa-solid ${meta.icon}"></i></span>`;
      const abierta = i === 0;
      return `
      <article class="franja${abierta ? " is-abierta" : ""}" data-i="${i}">
        <button class="franja-boton" type="button" id="franjaBoton${i}" aria-expanded="${abierta}" aria-controls="franjaContenido${i}">
          <span class="franja-boton-texto">${texto(m.nombre)}</span>
        </button>
        ${marca}
        <div class="franja-contenido" id="franjaContenido${i}" role="region" aria-labelledby="franjaBoton${i}"${abierta ? "" : " inert"}>
          <span class="franja-etiqueta">UNIDAD ${i + 1}</span>
          <h3 class="franja-titulo">${texto(m.nombre)}</h3>
          <div class="franja-ilustracion">${m.ilustracion
            // Solo la unidad abierta descarga su ilustracion; las demas, al abrirse.
            ? `<img ${abierta ? "data-src" : "data-src-franja"}="${attrUrl(m.ilustracion)}" alt="" decoding="async">`
            : emblemaUnidad(m.nombre, i)}</div>
          <a class="franja-cta" href="${attrUrl(m.url) || "#"}" target="_blank" rel="noopener" data-sectionid="${Number(m.sectionid) || ""}">
            Iniciar módulo <span class="franja-cta-flecha" aria-hidden="true"><i class="fa-solid fa-arrow-right"></i></span>
          </a>
          <p class="franja-aviso" role="status" hidden></p>
        </div>
      </article>`;
    }).join("");

    // Ilustracion de Moodle que no carga (archivo borrado, sitio sin https,
    // pagina anti-bots): se cambia por el emblema generado de esa unidad.
    $$(".franja-ilustracion img", ac).forEach((img) => {
      img.addEventListener("error", () => {
        const f = img.closest(".franja");
        const c = img.closest(".franja-ilustracion");
        if (!f || !c) return;
        const i = Number(f.dataset.i);
        c.innerHTML = emblemaUnidad(modulos[i] ? modulos[i].nombre : "", i);
      });
    });
    $$(".franja-cta", ac).forEach(initUnitCta);

    const franjas = $$(".franja", ac);
    const abrir = (f) => {
      franjas.forEach((x) => {
        const si = x === f;
        x.classList.toggle("is-abierta", si);
        $(".franja-boton", x).setAttribute("aria-expanded", String(si));
        $(".franja-contenido", x).inert = !si;
      });
      $$("img[data-src-franja]", f).forEach((img) => {
        img.src = img.dataset.srcFranja;
        delete img.dataset.srcFranja;
      });
    };
    franjas.forEach((f, i) => {
      const boton = $(".franja-boton", f);
      let espera = 0;
      f.addEventListener("pointerenter", (e) => {
        if (e.pointerType !== "mouse" || f.classList.contains("is-abierta")) return;
        clearTimeout(espera);
        espera = setTimeout(() => abrir(f), 120);
      });
      f.addEventListener("pointerleave", () => clearTimeout(espera));
      boton.addEventListener("click", () => abrir(f));
      boton.addEventListener("focus", () => abrir(f));
      boton.addEventListener("keydown", (e) => {
        let sig = -1;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") sig = (i + 1) % franjas.length;
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") sig = (i - 1 + franjas.length) % franjas.length;
        else if (e.key === "Home") sig = 0;
        else if (e.key === "End") sig = franjas.length - 1;
        if (sig === -1) return;
        e.preventDefault(); // la diapositiva no cambia: las flechas recorren las unidades
        $(".franja-boton", franjas[sig]).focus();
      });
    });
  }

  // "Iniciar modulo": puente con Moodle (guia 5). Tres estados del puente:
  //  - presente CON "abrir-modulo": postMessage; sin confirmacion en 10 s,
  //    un enlace visible para abrirlo en pestana nueva;
  //  - presente SIN la capacidad (modo edicion, otro formato): el enlace
  //    navega en el mismo clic;
  //  - desconocido (plugin sin el protocolo 2): postMessage y espera de 5 s,
  //    con el mismo enlace visible de respaldo (nunca window.open tardio).
  const UNIT_CTA_ACK_TIMEOUT_MS = 5000;
  const UNIT_CTA_ACK_TIMEOUT_PUENTE_MS = 10000;
  function initUnitCta(a) {
    const aviso = a.parentElement ? $(".franja-aviso", a.parentElement) : null;
    let pendiente = null;
    const mostrarRespaldo = () => {
      if (!aviso) return;
      aviso.innerHTML = `No se pudo abrir el módulo aquí. <a href="${esc(a.href)}" target="_blank" rel="noopener">Abrirlo en una pestaña nueva</a>`;
      aviso.hidden = false;
    };
    a.addEventListener("click", (e) => {
      const sectionid = Number(a.dataset.sectionid) || null;
      if (!embebido || !sectionid) return;
      if (puente.estado === "presente" && !puenteTiene("abrir-modulo")) return;
      e.preventDefault();
      if (aviso) aviso.hidden = true;
      if (pendiente) pendiente.cancelar();
      let confirmado = false;
      const alMensaje = (ev) => {
        const d = mensajeDelPadre(ev);
        if (d && d.type === "modulo-abierto" && Number(d.sectionid) === sectionid) {
          confirmado = true;
          if (pendiente) pendiente.cancelar();
        }
      };
      const espera = puente.estado === "presente" ? UNIT_CTA_ACK_TIMEOUT_PUENTE_MS : UNIT_CTA_ACK_TIMEOUT_MS;
      const timer = setTimeout(() => {
        window.removeEventListener("message", alMensaje);
        pendiente = null;
        if (!confirmado) mostrarRespaldo();
      }, espera);
      pendiente = {
        cancelar() {
          clearTimeout(timer);
          window.removeEventListener("message", alMensaje);
          pendiente = null;
        }
      };
      window.addEventListener("message", alMensaje);
      enviarAlPadre({ type: "abrir-modulo", sectionid });
    });
  }

  /* ---------------------------------------------------------------------
   * 15. Diapositivas personalizadas (diapositivas_extra) y de ACTIVIDADES
   * ------------------------------------------------------------------- */
  function marcoPersonalizado(custom) {
    const url = custom.iframe ? toEmbedUrl(custom.iframe) : "";
    if (url) {
      return `<iframe data-diferido="${esc(url)}" title="${texto(custom.titulo || "Recurso")}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
    }
    return "";
  }
  function crearSlidePersonalizada(id, custom) {
    const esPagina = custom.tipo === "pagina";
    const s = document.createElement("section");
    s.id = id;
    s.setAttribute("role", "group");
    s.setAttribute("aria-roledescription", "diapositiva");
    s.setAttribute("aria-label", decodificar(custom.titulo || String(custom.id)));
    const iframe = marcoPersonalizado(custom);
    // custom.html es HTML de confianza armado por el plugin (mismo criterio que Moodle).
    const html = !iframe && custom.html ? custom.html : "";
    const vacio = `<div class="vacio"><i class="fa-solid fa-inbox" aria-hidden="true"></i> Este recurso todavía no tiene contenido.</div>`;
    if (esPagina) {
      s.className = "slide pagina slide--completa";
      s.innerHTML = `<div class="slide-cuerpo"><div class="pagina-marco">${iframe || (html ? `<div class="pagina-html">${html}</div>` : vacio)}</div></div>`;
      return s;
    }
    s.className = "slide medio";
    s.innerHTML = `
      <div class="slide-cuerpo">
        <div class="slide-contenido">
          <div class="medio-cabeza">
            <div class="etiqueta rv"><i class="fa-solid fa-photo-film" aria-hidden="true"></i> Recurso</div>
            ${custom.titulo ? `<h2 class="titulo subrayado rv rv--titulo" style="--d:.1s">${texto(custom.titulo)}</h2>` : ""}
            ${custom.descripcion ? `<p class="bajada rv" style="--d:.2s">${texto(custom.descripcion)}</p>` : ""}
          </div>
          ${iframe || html ? `
          <div class="medio-marco${html ? " medio-marco--html" : ""} rv rv--escala" style="--d:.24s">
            ${iframe || html}
            <button class="medio-expandir" type="button" aria-label="Abrir en pantalla completa"><i class="fa-solid fa-expand" aria-hidden="true"></i></button>
          </div>` : vacio}
        </div>
      </div>`;
    const expandir = $(".medio-expandir", s);
    if (expandir) {
      expandir.addEventListener("click", () => abrirContenido({
        titulo: custom.titulo, bajada: custom.descripcion, medio: true,
        iframe: custom.iframe ? toEmbedUrl(custom.iframe) : "", html
      }, expandir));
    }
    return s;
  }

  function actividadHtml(r, it, i, una) {
    const tieneDescripcion = !!it.descripcion;
    const meta = ACT_TYPE_META[it.tipoActividad] || ACT_TYPE_META.tarea;
    const datosAttr = `data-recurso="${esc(r.id)}" data-item="${i}"`;
    const nombre = texto(it.nombre);
    const link = attrUrl(it.link);
    const tipo = `<span class="act-tipo"><i class="fa-solid ${meta.icon}" aria-hidden="true"></i> ${meta.label}</span>`;
    const bloque = (!una && tieneDescripcion)
      ? `<button class="act-abrir" type="button" ${datosAttr} aria-label="Ver el detalle de: ${nombre}">
          ${tipo}
          <span class="act-titular"><span class="act-nombre">${nombre}</span><span class="act-ver">Ver detalle <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></span></span>
        </button>`
      : `<div class="act-estatico">${tipo}<span class="act-nombre">${nombre}</span></div>`;
    const ir = link
      ? `<a class="act-ir" href="${link}" target="_blank" rel="noopener" title="Ir a la actividad" aria-label="Ir a la actividad: ${nombre}"><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></a>`
      : "";
    const acciones = una
      ? `<div class="act-acciones">
          ${tieneDescripcion ? `<button class="act-ver-grande" type="button" ${datosAttr}><i class="fa-solid fa-file-lines" aria-hidden="true"></i> Ver la actividad</button>` : ""}
          ${ir ? `<a class="act-cta" href="${link}" target="_blank" rel="noopener">Ir a la actividad <span class="act-cta-flecha" aria-hidden="true"><i class="fa-solid fa-arrow-right"></i></span></a>` : ""}
        </div>`
      : "";
    return `
      <div class="act" data-type="${it.tipoActividad}" style="--i:${i}" role="listitem">
        <span class="act-nodo" aria-hidden="true">${una ? `<i class="fa-solid ${meta.icon}"></i>` : String(i + 1).padStart(2, "0")}</span>
        <div class="act-tarjeta">
          <div class="act-fila">${bloque}${una ? "" : ir}</div>
          ${acciones}
        </div>
      </div>`;
  }
  function crearSlideActividades(id, recurso) {
    const s = document.createElement("section");
    s.id = id;
    s.className = "slide actividades";
    s.setAttribute("role", "group");
    s.setAttribute("aria-roledescription", "diapositiva");
    s.setAttribute("aria-label", decodificar(recurso.titulo) || "Actividades");
    const una = recurso.items.length === 1;
    const cuerpo = recurso.items.length
      ? `<div class="ruta${una ? " ruta--una" : ""}" role="list">
          ${una ? "" : `<span class="ruta-linea" aria-hidden="true"></span>`}
          ${recurso.items.map((it, i) => actividadHtml(recurso, it, i, una)).join("")}
        </div>`
      : `<div class="vacio"><i class="fa-solid fa-list-check" aria-hidden="true"></i> Este recurso todavía no tiene actividades.</div>`;
    s.innerHTML = `
      <div class="slide-cuerpo">
        <div class="slide-contenido">
          <div class="actividades-cabeza">
            <div class="etiqueta rv"><i class="fa-solid fa-list-check" aria-hidden="true"></i> Actividades</div>
            <h2 class="titulo subrayado rv rv--titulo" style="--d:.1s">${texto(recurso.titulo) || "Actividades"}</h2>
            <p class="bajada rv" style="--d:.2s">Actividades del curso, fuera de los mosaicos de las semanas.</p>
          </div>
          ${cuerpo}
        </div>
      </div>`;
    return s;
  }

  // Crea las diapositivas que no estan en el HTML y deja TODAS en el orden final.
  function renderPersonalizadas(slides) {
    const contenedor = $("#slides");
    slides.forEach((s) => {
      let el = document.getElementById(s.id);
      if (!el && s.custom) el = crearSlidePersonalizada(s.id, s.custom);
      else if (!el && s.actividades) el = crearSlideActividades(s.id, s.actividades);
      if (el) contenedor.appendChild(el);
    });
  }

  function initActividades(datos) {
    const porId = {};
    datos.recursos.forEach((r) => { porId[r.id] = r; });
    $$(".act-abrir, .act-ver-grande").forEach((btn) => {
      btn.addEventListener("click", () => {
        const r = porId[btn.dataset.recurso];
        const it = r && r.items[Number(btn.dataset.item)];
        if (!it || !it.descripcion) return;
        const html = it.descripcionHtml
          ? it.descripcion // HTML de confianza armado por el plugin
          : texto(it.descripcion).split(/\n{2,}/).map((p) => `<p>${p}</p>`).join("");
        abrirContenido({
          titulo: it.nombre || r.titulo,
          bajada: (ACT_TYPE_META[it.tipoActividad] || ACT_TYPE_META.tarea).label,
          html,
          accion: it.link ? { href: it.link, texto: "Ir a la actividad" } : null
        }, btn);
      });
    });
  }

  // Acceso "Ir a actividades" del inicio, con el total como contador.
  function renderActividadesInicio(datos) {
    const total = datos.recursos.reduce((n, r) => n + (r.items ? r.items.length : 0), 0);
    const primera = datos.recursos.length ? `actividades-${datos.recursos[0].id}` : null;
    const cue = $("#heroIrActividades");
    const idx = primera ? SLIDES.findIndex((s) => s.id === primera) : -1;
    cue.hidden = idx === -1;
    if (idx === -1) return;
    const contador = $(".pildora-contador", cue);
    contador.textContent = total > 9 ? "9+" : String(total);
    contador.hidden = total === 0;
    cue.addEventListener("click", () => deck.goTo(idx));
  }

  /* ---------------------------------------------------------------------
   * Arranque: cada paso aislado (guia 2.7)
   * ------------------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", () => {
    const datos = paso("datos", obtenerDatos);
    if (!datos) return;
    origenPadre = datos.origen_padre;
    iniciarSaludo("hero");
    const modesto = paso("equipo", marcarEquipoModesto);
    paso("escenario", () => escenario.iniciar(datos.fondos, modesto));

    SLIDES = paso("estructura", () => construirSlides(datos)) || [Object.assign({}, SLIDES_FIJAS[0])];
    const visibles = new Set(SLIDES.map((s) => s.id));
    SLIDES_FIJAS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) el.hidden = !visibles.has(s.id);
    });

    paso("diapositivas_extra", () => renderPersonalizadas(SLIDES));
    paso("inicio", () => renderInicio(datos));
    paso("presentacion", () => renderPresentacion(datos));
    paso("bienvenida", () => renderBienvenida(datos));
    paso("aprenderas", () => renderAprenderas(datos));
    paso("dea", () => renderDea(datos));
    paso("docente", () => renderDocente($("#docente"), datos.profesor));
    if (datos.profesor_tutor) paso("docente_tutor", () => renderDocente($("#docente_tutor"), datos.profesor_tutor));
    paso("tutorias", () => renderTutorias(datos.tutorias));
    paso("unidades", () => renderUnidades(datos.modulos));
    paso("actividades", () => initActividades(datos));
    paso("navegacion", renderNavegacion);
    paso("saltos", initSaltos);
    paso("actividades_inicio", () => renderActividadesInicio(datos));
    paso("dialogos", initDialogos);
    paso("lecturas", initLecturas);
    paso("teclado", initTeclado);
    paso("gesto", initGesto);
    paso("mazo", () => deck.init());
  });
})();
