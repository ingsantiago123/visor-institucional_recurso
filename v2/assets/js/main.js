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
   * 0. (v2) Texto seguro. TODO texto que llega del JSON se inserta
   *    escapado: decodificar() deshace las entidades que ya traiga (Moodle
   *    manda algunos nombres con &amp; / &quot; via format_string) y esc()
   *    vuelve a escapar -- el resultado es el mismo venga el texto crudo o
   *    ya escapado, y una comilla en un titulo ya no rompe un atributo.
   *    Solo los campos HTML declarados (descripcion_html:true,
   *    diapositivas_extra[].html) se insertan tal cual.
   * ------------------------------------------------------------------- */
  const decodificador = document.createElement("textarea");
  function decodificar(s) {
    const str = String(s == null ? "" : s);
    if (str.indexOf("&") === -1) return str;
    decodificador.innerHTML = str; // textarea: el contenido no se interpreta como HTML ni se ejecuta
    return decodificador.value;
  }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function texto(s) { return esc(decodificar(s)); }
  // Un texto sin ninguna letra ni numero (".", "-", espacios) cuenta como vacio.
  function tieneTexto(s) { return /[\p{L}\p{N}]/u.test(decodificar(s)); }
  // Solo http(s), rutas relativas y anclas; cualquier otro esquema
  // (javascript:, data:, vbscript:) se convierte en "#".
  function urlSegura(u) {
    const s = decodificar(u).trim();
    if (!s) return "";
    if (/^[a-z][a-z0-9+.-]*:/i.test(s) && !/^https?:/i.test(s)) return "#";
    return s;
  }
  function attrUrl(u) { return esc(urlSegura(u)); }
  // Clase de icono de Font Awesome: solo nombres "fa-xxx", nunca texto libre en el atributo class.
  function icono(nombre, defecto) {
    const n = String(nombre || "").trim();
    return /^fa-[a-z0-9-]+$/i.test(n) ? n : defecto;
  }
  // Avatar de respaldo con las iniciales, generado aqui (antes: ui-avatars.com, un tercero por cada carga).
  function avatarIniciales(nombre) {
    const partes = decodificar(nombre || "").trim().split(/\s+/).filter(Boolean);
    const ini = partes.length
      ? (partes[0].charAt(0) + (partes.length > 1 ? partes[partes.length - 1].charAt(0) : "")).toUpperCase()
      : "D";
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">'
      + '<rect width="300" height="300" fill="#E2E6E9"/>'
      + '<text x="150" y="150" dy=".35em" text-anchor="middle" font-family="Roboto,Arial,sans-serif" '
      + 'font-size="120" font-weight="600" fill="#0B349D">' + esc(ini) + "</text></svg>";
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  /* ---------------------------------------------------------------------
   * 0b. (v2) Puente con la pagina que embebe el visor -- protocolo 2.
   *
   *  ALCANCE: postMessage va de ventana a ventana dentro de la MISMA
   *  pestaña. Este visor solo le escribe a window.parent (la pagina de
   *  Moodle que lo contiene: ese curso, esa seccion) y solo escucha
   *  mensajes cuyo ev.source es esa misma ventana -- nada sale de la
   *  pestaña, ni llega a otro curso ni a otro estudiante. No se guarda
   *  NADA en localStorage/sessionStorage (ese almacenamiento si lo
   *  comparten todos los cursos del sitio en el navegador): el estado del
   *  puente vive solo en la memoria de este iframe.
   *
   *  - "visor-listo" (visor -> padre): al terminar de dibujar; se reintenta
   *    a los 0,5 / 1,5 / 3 s mientras el padre no conteste.
   *  - "puente-listo" (padre -> visor): {capacidades:[...]}. Un plugin que
   *    no conoce el protocolo (4.22) nunca contesta y el puente queda
   *    "desconocido": se usa el camino de siempre (compatibilidad).
   *  - "visor-error" (visor -> padre): un paso del arranque fallo; el padre
   *    puede ofrecer la version ligera. Sin datos personales.
   * ------------------------------------------------------------------- */
  const PROTOCOLO = 2;
  const puente = { estado: "desconocido", capacidades: [], origen: "" };
  let origenPadre = ""; // datos.origen_padre: si el plugin lo manda, se usa como destino y como filtro
  const embebido = window.parent && window.parent !== window;

  function enviarAlPadre(msg) {
    if (!embebido) return;
    try {
      window.parent.postMessage(Object.assign({ source: "visorincca", v: PROTOCOLO }, msg),
        puente.origen || origenPadre || "*");
    } catch (e) { /* origen distinto al esperado: el navegador lo descarta */ }
  }
  // Solo mensajes de la ventana padre (y de su origen, si se conoce) con el formato del visor.
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
  function reportarError(etapa, err) {
    const mensaje = String((err && err.message) || err || "").slice(0, 200);
    if (window.console) console.warn("[visorincca] fallo en " + etapa + ": " + mensaje);
    if (++erroresReportados <= 5) enviarAlPadre({ type: "visor-error", etapa: String(etapa).slice(0, 60), mensaje });
  }
  // Cada paso del arranque va aislado: si uno falla, los demas siguen y el visor no queda en blanco.
  function paso(etapa, fn) {
    try { return fn(); } catch (e) { reportarError(etapa, e); return undefined; }
  }
  // Equipos modestos (<=4 hilos o <=4 GB, deviceMemory solo existe en Chromium):
  // sin desenfoques ni animaciones infinitas (ver .equipo-modesto en styles.css).
  function marcarEquipoModesto() {
    const hilos = navigator.hardwareConcurrency || 8;
    const memoria = navigator.deviceMemory || 8;
    if (hilos <= 4 || memoria <= 4) document.documentElement.classList.add("equipo-modesto");
  }
  window.addEventListener("error", (ev) => reportarError("global", ev.error || ev.message));

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

  // (v2) Una diapositiva fija solo existe si tiene algo que mostrar: con
  // datos reales de Moodle, lo vacio se OCULTA (nunca se rellena con el
  // ejemplo). En la vista suelta (datos.ejemplo) todas tienen contenido.
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
      // (v2) visible:false en "secciones" sigue ocultando, pero visible:true
      // ya no puede forzar una diapositiva vacia.
      const conContenido = slideTieneContenido(s.id, datos);
      return {
        id: s.id,
        label: s.label,
        icon: s.icon,
        custom: null,
        visible: conContenido && (typeof override.visible === "boolean" ? override.visible : visibleDefault),
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
      foto: "", // (v2) sin pravatar.cc: el avatar de iniciales se genera localmente
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
  // (v2) escaparHtml() se reemplazo por texto() (seccion 0), que ademas
  // decodifica entidades y escapa comillas.
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
  function normalizarTutorias(recibidos, ejemplo) {
    // (v2) el horario de ejemplo solo en la vista suelta; con datos reales sin la clave = sin tutorias.
    if (recibidos.tutorias === undefined) return ejemplo ? SIN_DATOS.tutorias : { url_aula_virtual: "#", horario: [] };
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
    // (v2) El contenido de ejemplo (SIN_DATOS) es SOLO para la vista suelta
    // (sin window.name). Con datos de Moodle, un campo vacio queda vacio y
    // la diapositiva o el elemento se oculta -- antes un curso real sin
    // video mostraba el video de ejemplo y "Ejemplo de resumen...".
    const ejemplo = (campo, vacio) => (sinNingunDato ? SIN_DATOS[campo] : vacio);
    const cadena = (valor, campo) => ((typeof valor === "string" && tieneTexto(valor)) ? valor : ejemplo(campo, ""));
    // Listas: se descartan los vacios y los textos sin letras (un "." suelto no es un parrafo).
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
      // A diferencia de "profesor" (siempre existe, con placeholders si
      // falta), "profesor_tutor" es null cuando el JSON no trae esa clave
      // — el curso puede no tener ese rol asignado todavía — y eso es lo
      // que decide si la diapositiva "Docente tutor" existe o no. (v2) Si
      // llega, se completa con campos VACIOS, no con el ejemplo.
      profesor_tutor: (recibidos.profesor_tutor && typeof recibidos.profesor_tutor === "object")
        ? docente(recibidos.profesor_tutor, docenteVacio)
        : null,
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
      // Modo alternativo de "aprenderás" (texto largo + imagen opcional) —
      // sin placeholder propio a propósito: su ausencia simplemente
      // significa "usar el modo de tarjetas de siempre" (que sí tiene su
      // propio placeholder completo, ver "aprenderas" arriba).
      aprenderas_texto: (Array.isArray(recibidos.aprenderas_texto) && recibidos.aprenderas_texto.some(tieneTexto)) ? recibidos.aprenderas_texto.filter(tieneTexto) : null,
      aprenderas_imagen: recibidos.aprenderas_imagen || "",
      tutorias: normalizarTutorias(recibidos, sinNingunDato),
      modulos: (Array.isArray(recibidos.modulos) ? recibidos.modulos : ejemplo("modulos", [])).filter(Boolean).map((m, i) => ({
        nombre: m.nombre || (sinNingunDato ? SIN_DATOS_MODULO.nombre : `Módulo ${i + 1}`),
        url: m.url || SIN_DATOS_MODULO.url,
        ilustracion: m.ilustracion || inferirIlustracion(m.nombre) || SIN_DATOS_MODULO.ilustracion,
        sectionid: m.sectionid || SIN_DATOS_MODULO.sectionid
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

  // (v2) Mismas reglas que utils::normalizar_url_embebible() del plugin.
  // Nuevos: Drive con selector de cuenta (/file/u/0/d/ID), open?id= y
  // uc?id=; Docs/Presentaciones/Hojas (/edit -> /preview); YouTube
  // shorts/, live/, m.youtube.com y watch?...&v=ID (v no siempre es el
  // primer parametro). Lo que no se reconoce se devuelve tal cual.
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

  // (v2) Miniatura para la fachada del video: el reproductor (YouTube, Drive:
  // 1-6 MB cada uno) solo se carga cuando el estudiante pulsa reproducir.
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
   * 4b. (v2) Medios bajo demanda. Las diapositivas inactivas estan en
   *     opacity:0 DENTRO del viewport, asi que loading="lazy" no difiere
   *     nada: antes la portada descargaba todas las imagenes y TODOS los
   *     reproductores de video del mazo (medido: 7,5 MB en un curso con 2
   *     videos de Drive). Ahora:
   *     - imagenes: el src real va en data-src y se pone al activar la
   *       diapositiva (y se precarga la siguiente);
   *     - videos: una fachada (miniatura + boton) y el reproductor recien
   *       al pulsar; al salir de la diapositiva se descarga (para el audio);
   *     - iframes de diapositivas personalizadas: se cargan al activar la
   *       diapositiva y se descargan al salir.
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
    $$("iframe[data-embed]", slideEl).forEach((f) => detenerVideo(f));
  }

  function prepararVideo(iframe, url) {
    if (!iframe) return false;
    const marco = iframe.parentElement;
    const embed = toEmbedUrl(url);
    iframe.removeAttribute("src");
    let fachada = marco ? $(".video-fachada", marco) : null;
    if (!embed) {
      delete iframe.dataset.embed;
      if (fachada) fachada.remove();
      return false;
    }
    iframe.dataset.embed = embed;
    if (!fachada) {
      fachada = document.createElement("button");
      fachada.type = "button";
      fachada.className = "video-fachada";
      fachada.setAttribute("aria-label", "Reproducir video");
      fachada.innerHTML = '<img class="video-fachada-img" alt="">'
        + '<span class="video-fachada-play" aria-hidden="true"><i class="fa-solid fa-play"></i></span>';
      fachada.addEventListener("click", () => reproducirVideo(iframe));
      marco.appendChild(fachada);
    }
    imagenDiferida($(".video-fachada-img", fachada), miniaturaVideo(embed), (img) => img.remove());
    fachada.hidden = false;
    return true;
  }
  function reproducirVideo(iframe) {
    if (!iframe || !iframe.dataset.embed) return;
    iframe.src = conAutoplay(iframe.dataset.embed);
    const fachada = iframe.parentElement && $(".video-fachada", iframe.parentElement);
    if (fachada) fachada.hidden = true;
  }
  function detenerVideo(iframe) {
    if (!iframe || !iframe.hasAttribute("src")) return;
    iframe.src = "about:blank"; // corta el reproductor: deja de sonar y libera memoria
    iframe.removeAttribute("src");
    const fachada = iframe.parentElement && $(".video-fachada", iframe.parentElement);
    if (fachada) fachada.hidden = false;
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
      this.slideEls.forEach((el, i) => {
        el.setAttribute("aria-hidden", i === 0 ? "false" : "true");
        // (v2) "dormida": invisible y con sus animaciones en pausa -- antes
        // las animaciones infinitas de TODAS las diapositivas corrian a la
        // vez aunque solo se viera una (CPU ocupada en reposo).
        if (i !== 0) el.classList.add("is-dormida");
      });
      this.slideEls[0].classList.add("is-active");
      this.updateChrome();
      replayStagger(this.slideEls[0]);
      activarMedios(this.slideEls[0]);
      if (this.total > 1) cargarImagenes(this.slideEls[1]);
      this.runSlideExtras(SLIDES[0].id, null);
    },

    goTo(index) {
      const total = this.total;
      const idx = ((index % total) + total) % total; // navegación circular
      if (idx === this.current) return;
      const dir = this.directionTo(idx);
      const oldEl = this.slideEls[this.current];
      const newEl = this.slideEls[idx];
      const anterior = SLIDES[this.current].id;

      newEl.classList.remove("is-dormida");
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
        // Si el usuario ya volvio a esta diapositiva durante la transicion, no se duerme.
        if (!oldEl.classList.contains("is-active")) oldEl.classList.add("is-dormida");
      }, 560);

      desactivarMedios(oldEl);
      activarMedios(newEl);
      cargarImagenes(this.slideEls[(idx + 1) % total]); // precarga de la siguiente

      this.current = idx;
      this.updateChrome();
      replayStagger(newEl);
      this.runSlideExtras(SLIDES[idx].id, anterior);
    },

    directionTo(idx) {
      const forward = (idx - this.current + this.total) % this.total;
      const backward = (this.current - idx + this.total) % this.total;
      return forward <= backward ? 1 : -1;
    },

    next() { this.goTo(this.current + 1); },
    prev() { this.goTo(this.current - 1); },

    updateChrome() {
      const nav = $("#deckFloatNav");
      $$(".floatnav-item").forEach((item, i) => {
        const activo = i === this.current;
        item.classList.toggle("is-active", activo);
        if (activo) item.setAttribute("aria-current", "step");
        else item.removeAttribute("aria-current");
        // (v2) En pantallas angostas la barra se desplaza: el item activo queda centrado.
        if (activo && nav && nav.scrollWidth > nav.clientWidth) {
          const destino = item.offsetLeft - nav.clientWidth / 2 + item.offsetWidth / 2;
          nav.scrollTo({ left: Math.max(0, destino), behavior: "smooth" });
        }
      });
    },

    runSlideExtras(id, anterior) {
      if (id === "hero") initCounters($("#hero"));
      if (anterior === "bienvenida") detenerWelcomeGeo();
      if (id === "bienvenida") arrancarWelcomeGeo();
    }
  };

  /* ---------------------------------------------------------------------
   * 6. Render — chrome de navegación (barra flotante con íconos, flechas)
   * ------------------------------------------------------------------- */
  function renderChrome() {
    $("#deckFloatNav").innerHTML = SLIDES.map((s, i) => `
      <button class="floatnav-item" data-goto="${i}" aria-label="Ir a ${texto(s.label)}" title="${texto(s.label)}">
        <i class="fa-solid ${icono(s.icon, "fa-circle")}" aria-hidden="true"></i>
        <span class="floatnav-item-label">${texto(s.label)}</span>
      </button>
    `).join("");

    $$("[data-goto]").forEach((btn) => {
      btn.addEventListener("click", () => deck.goTo(Number(btn.dataset.goto)));
    });

    $("#prevBtn").addEventListener("click", () => deck.prev());
    $("#nextBtn").addEventListener("click", () => deck.next());

    // (v2) Con una sola diapositiva no hay a donde navegar.
    const unaSola = SLIDES.length < 2;
    $("#prevBtn").hidden = unaSola;
    $("#nextBtn").hidden = unaSola;
    $("#deckFloatNav").hidden = unaSola;
  }

  // (v2) Un boton cuyo destino no existe (diapositiva oculta o vacia) se
  // oculta -- antes findIndex() devolvia -1 y goTo(-1) daba la vuelta y
  // llevaba a la ULTIMA diapositiva.
  function enlazarSalto(btn, slideId) {
    if (!btn) return;
    const targetIndex = SLIDES.findIndex((s) => s.id === slideId);
    if (targetIndex === -1) { btn.hidden = true; return; }
    btn.addEventListener("click", () => deck.goTo(targetIndex));
  }

  function initHeroCue() {
    enlazarSalto($("#heroLearnCue"), "aprenderas");
    enlazarSalto($("#heroTutoriasCue"), "tutorias");
  }

  function initGotoUnitsButtons() {
    ["heroUnitsCue", "presentacionUnitsCue", "deaUnitsCue"].forEach((id) => enlazarSalto($(`#${id}`), "unidades"));
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
  const parrafosHtml = (lista) => (lista || []).filter(tieneTexto).map((p) => `<p>${texto(p)}</p>`).join("");

  function renderTeacherCard(idPrefix, profesor) {
    const avatar = $(`#${idPrefix}Avatar`);
    const nombre = decodificar(profesor.nombre);
    // (v2) Sin foto, o si la foto no carga: iniciales generadas aqui (sin ui-avatars.com).
    imagenDiferida(avatar, urlSegura(profesor.foto) || avatarIniciales(nombre),
      (img) => { img.src = avatarIniciales(nombre); });
    avatar.alt = nombre || "Docente del curso";
    $(`#${idPrefix}Name`).textContent = nombre || "Docente del curso";
    $(`#${idPrefix}Role`).textContent = decodificar(profesor.rol);
    $(`#${idPrefix}Role`).hidden = !profesor.rol;
    $(`#${idPrefix}Bio`).innerHTML = parrafosHtml(profesor.bio);
    $(`#${idPrefix}Tags`).innerHTML = (profesor.etiquetas || []).map((t) => `
      <span class="teacher-tag"><i class="fa-solid ${icono(t.icono, "fa-tag")}" aria-hidden="true"></i> ${texto(t.texto)}</span>
    `).join("");
    const hayVideo = prepararVideo($(`#${idPrefix}Video`), profesor.video);
    $(`#${idPrefix}Media`).classList.toggle("has-video", hayVideo);
    $(`#${idPrefix}VideoFrame`).hidden = !hayVideo;
  }

  // (v2) Una ficha de estadistica en 0 no le dice nada al estudiante: se oculta
  // (y el panel entero si quedan todas ocultas).
  function ocultarEstadisticasEnCero() {
    $$(".hero-panel .stat-tile").forEach((tile) => {
      const num = $(".stat-num", tile);
      if (!num) return;
      const valor = Number(num.dataset.counter);
      if (!(valor > 0)) tile.hidden = true;
    });
    const panel = $(".hero-panel");
    if (panel) panel.hidden = !$$(".hero-panel .stat-tile").some((t) => !t.hidden);
  }

  function renderHeroYBienvenidaYDocente(datos) {
    document.title = `${decodificar(datos.curso) || "Curso"} — U.INCCA`;
    $("#courseName").textContent = decodificar(datos.curso);
    $("#heroResumen").textContent = decodificar(datos.resumen);
    $("#heroResumen").hidden = !datos.resumen;

    $("#heroBadges").innerHTML = (datos.insignias || []).map((b) => `
      <span class="hero-badge ${b.destacada ? "hero-badge--solid" : ""}"><i class="fa-solid ${icono(b.icono, "fa-circle")}" aria-hidden="true"></i> ${texto(b.texto)}</span>
    `).join("");
    $("#heroBadges").hidden = !(datos.insignias || []).length;

    $("#statUnidades").dataset.counter = datos.unidades;
    $("#statHoras").dataset.counter = datos.horas_trabajo;

    // Docente creador (+ docente tutor, si el JSON lo trae — ver renderTeacherCard)
    paso("docente", () => renderTeacherCard("teacher", datos.profesor));
    if (datos.profesor_tutor) paso("docente_tutor", () => renderTeacherCard("tutor", datos.profesor_tutor));

    // Bienvenida — con frase_destacada se muestra la .quote-card de
    // siempre; sin ella, en vez de dejar la columna derecha vacía se
    // muestra la escena de figuras geométricas (ver initWelcomeGeo()).
    const tieneFrase = tieneTexto(datos.bienvenida.frase_destacada);
    $("#bienvenidaTitulo").textContent = decodificar(datos.bienvenida.titulo) || "¡Bienvenidos al curso!";
    $("#bienvenidaParrafos").innerHTML = parrafosHtml(datos.bienvenida.parrafos);
    $("#bienvenidaFrase").textContent = decodificar(datos.bienvenida.frase_destacada);
    $(".quote-card").hidden = !tieneFrase;
    $("#welcomeGeo").hidden = tieneFrase;
    $("#bienvenida").classList.toggle("has-geo", !tieneFrase);

    // Presentación del curso (título + video grande, sin el DEA — ver renderDea())
    $("#presentacionTitulo").textContent = decodificar(datos.video_titulo);
    $("#presentacionTitulo").hidden = !datos.video_titulo;
    $("#presentacionParrafos").innerHTML = parrafosHtml(datos.video_parrafos);
    $("#presentacionVideoFrame").hidden = !prepararVideo($("#presentacionVideo"), datos.video);

    paso("dea", () => renderDea(datos));

    // Contadores del hero
    $("#statModulos").dataset.counter = datos.modulos.length;
    $("#statTutorias").dataset.counter = datos.tutorias.horario.length;
  }

  // DEA (Diseño de Experiencia para el Aprendizaje) — diapositiva propia,
  // separada de "Presentación del curso": antes compartían un solo campo
  // "video" (una diapositiva hacía de las dos cosas a la vez); ahora cada
  // una tiene su propio video/título/párrafos independientes.
  function renderDea(datos) {
    $("#deaTitulo").textContent = decodificar(datos.dea_titulo);
    $("#deaTitulo").hidden = !datos.dea_titulo;
    $("#deaParrafos").innerHTML = parrafosHtml(datos.dea_parrafos);
    // "dea_imagen" es el modo alternativo a "dea_video" (misma idea que
    // aprenderas_texto vs aprenderas): si llega imagen, gana sobre el
    // video — nunca se muestran los dos a la vez.
    const grid = $("#dea .dea-grid");
    const sinMedio = () => { if (grid) grid.classList.add("dea-grid--solo-texto"); };
    if (datos.dea_imagen) {
      // (v2) Si la imagen no carga (dominio con proteccion anti-bots, URL rota), se
      // quita el marco y queda el texto a ancho completo -- nunca un recuadro roto.
      imagenDiferida($("#deaImagen"), urlSegura(datos.dea_imagen), () => { $("#deaImagenFrame").hidden = true; sinMedio(); });
      $("#deaImagenFrame").hidden = false;
      $("#deaVideoFrame").hidden = true;
      prepararVideo($("#deaVideo"), "");
    } else if (prepararVideo($("#deaVideo"), datos.dea_video)) {
      $("#deaVideoFrame").hidden = false;
      $("#deaImagenFrame").hidden = true;
    } else {
      $("#deaVideoFrame").hidden = true;
      $("#deaImagenFrame").hidden = true;
      sinMedio();
    }
    const descargaBtn = $("#deaDescargaBtn");
    const descarga = urlSegura(datos.dea_descarga_url);
    if (descarga && descarga !== "#") {
      descargaBtn.href = descarga;
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
        <div class="learn-card-icon"><i class="fa-solid ${icono(item.icono, "fa-star")}" aria-hidden="true"></i></div>
        <div class="learn-card-title">${texto(item.titulo)}</div>
        <div class="learn-card-hint"><i class="fa-solid fa-arrows-up-down" aria-hidden="true"></i> Toca para expandir</div>
        <div class="learn-card-overlay"><p>${texto(item.detalle)}</p></div>
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
    $("#learnText").innerHTML = parrafosHtml(parrafos);
    const wrap = $("#learnTextImageWrap");
    const textGrid = $("#learnTextGrid");
    const sinImagen = () => { wrap.hidden = true; textGrid.classList.add("learn-text-grid--full"); };
    const url = urlSegura(imagen);
    if (url && url !== "#") {
      // (v2) Imagen que no carga: texto a ancho completo, nunca un recuadro roto.
      imagenDiferida($("#learnTextImage"), url, sinImagen);
      wrap.hidden = false;
      textGrid.classList.remove("learn-text-grid--full");
    } else {
      sinImagen();
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
        <span class="meet-slot-day"><i class="fa-solid fa-calendar-day" aria-hidden="true"></i> ${texto(capitalizar(b.dia))}</span>
        <span class="meet-slot-time"><i class="fa-regular fa-clock" aria-hidden="true"></i> ${texto(formatHora12(b.inicio))} – ${texto(formatHora12(b.fin))}</span>
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
      next.innerHTML = `<i class="fa-regular fa-clock" aria-hidden="true"></i> Próxima sesión: ${texto(cuando)} · ${texto(formatHora12(estado.bloque.inicio))}`;
    }

    // (v2) Sin link de aula virtual no se ofrece un boton que no lleva a ningun lado.
    const aula = urlSegura(tutorias.url_aula_virtual);
    $("#meetCtaBtn").href = aula || "#";
    $("#meetCtaBtn").hidden = !aula || aula === "#";
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
      <div class="unit-panel" role="button" tabindex="0" data-unit="${i}" aria-label="${texto(m.nombre)}" style="z-index:${modulos.length - i}; --unit-color:${color}">
        ${iconoHtml}
        <div class="unit-footer">
          <div class="unit-footer-shape"><span class="unit-footer-label">${texto(m.nombre)}</span></div>
        </div>
        <div class="unit-active-content">
          <div class="unit-watermark" aria-hidden="true"><span>${texto(m.nombre)} · ${texto(m.nombre)}</span></div>
          <span class="unit-tag">UNIDAD ${i + 1}</span>
          <h3 class="unit-title">${texto(m.nombre)}</h3>
          <div class="unit-illustration">${m.ilustracion ? `<img data-src="${attrUrl(m.ilustracion)}" alt="" decoding="async">` : ""}</div>
          <a class="unit-cta" href="${attrUrl(m.url) || "#"}" target="_blank" rel="noopener" data-sectionid="${Number(m.sectionid) || ""}">
            INICIAR MÓDULO
            <span class="unit-cta-arrow"><i class="fa-solid fa-arrow-right" aria-hidden="true"></i></span>
          </a>
          <p class="unit-cta-aviso" role="status" hidden></p>
        </div>
      </div>`;
    }).join("");

    // (v2) Si la ilustracion no carga se ofrece el link "Ver ilustracion".
    // Se quito el reintento por images.weserv.nl: le pasaba la URL de cada
    // imagen del curso a un tercero, y no servia para lo que de verdad
    // falla (archivos que piden sesion de Moodle). Las ilustraciones que
    // arma el plugin ya se sirven publicas desde su propia area de archivos.
    $$(".unit-illustration img", hero).forEach((img) => {
      const urlOriginal = img.dataset.src;
      img.addEventListener("error", () => {
        const contenedor = img.closest(".unit-illustration");
        img.remove();
        if (contenedor && urlOriginal) {
          contenedor.innerHTML = `
            <a class="unit-illustration-fallback" href="${esc(urlOriginal)}" target="_blank" rel="noopener">
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
  //
  // (v2) Tres casos segun el saludo con la pagina padre (ver 0b):
  //  - puente presente CON "abrir-modulo": se pide por postMessage; si en
  //    10 s no llega "modulo-abierto" se muestra un enlace VISIBLE para
  //    abrirlo en pestaña nueva (un nuevo clic del estudiante).
  //  - puente presente SIN esa capacidad (modo edicion, formato sin puente):
  //    el <a target="_blank"> navega en el mismo clic, sin esperar.
  //  - puente desconocido (plugin sin el protocolo 2): camino de siempre,
  //    pero el respaldo ya no es window.open() a los 5 s -- para entonces
  //    el navegador ya bloquea la ventana emergente y el clic quedaba sin
  //    efecto, o se abria una pestaña duplicada si el mosaico tardaba.
  const UNIT_CTA_ACK_TIMEOUT_MS = 5000;
  const UNIT_CTA_ACK_TIMEOUT_PUENTE_MS = 10000;
  function initUnitCta(a) {
    const aviso = a.parentElement ? $(".unit-cta-aviso", a.parentElement) : null;
    let pendiente = null;

    function mostrarRespaldo() {
      if (!aviso) return;
      aviso.innerHTML = `No se pudo abrir el módulo aquí. <a href="${esc(a.href)}" target="_blank" rel="noopener">Abrirlo en una pestaña nueva</a>`;
      aviso.hidden = false;
    }

    a.addEventListener("click", (e) => {
      const sectionid = Number(a.dataset.sectionid) || null;
      if (!embebido || !sectionid) return; // suelto o sin dato para el puente: link normal
      if (puente.estado === "presente" && !puenteTiene("abrir-modulo")) return; // sin puente: link normal

      e.preventDefault();
      if (aviso) aviso.hidden = true;
      if (pendiente) pendiente.cancelar();

      let confirmado = false;
      const alRecibirMensaje = (ev) => {
        const d = mensajeDelPadre(ev);
        if (d && d.type === "modulo-abierto" && Number(d.sectionid) === sectionid) {
          confirmado = true;
          pendiente.cancelar();
        }
      };
      const espera = puente.estado === "presente" ? UNIT_CTA_ACK_TIMEOUT_PUENTE_MS : UNIT_CTA_ACK_TIMEOUT_MS;
      const timer = setTimeout(() => {
        window.removeEventListener("message", alRecibirMensaje);
        pendiente = null;
        if (!confirmado) mostrarRespaldo();
      }, espera);
      pendiente = {
        cancelar() {
          clearTimeout(timer);
          window.removeEventListener("message", alRecibirMensaje);
          pendiente = null;
        }
      };
      window.addEventListener("message", alRecibirMensaje);
      enviarAlPadre({ type: "abrir-modulo", sectionid });
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
  // (v2) diferido=true (en la diapositiva): el iframe se carga recien al
  // activar la diapositiva y se descarga al salir (ver activarMedios()).
  // En el modal (diferido=false) se carga de inmediato.
  function contenidoEmbebidoCustom(custom, diferido) {
    const url = custom.iframe ? toEmbedUrl(custom.iframe) : "";
    if (url) {
      const atributoSrc = diferido ? `data-diferido="${esc(url)}"` : `src="${esc(url)}"`;
      return `<iframe ${atributoSrc} title="${texto(custom.titulo || "Recurso")}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
    }
    if (custom.html) return custom.html; // HTML de confianza armado por el plugin (saneado alla)
    return `<div class="activity-empty"><i class="fa-solid fa-inbox" aria-hidden="true"></i>Este recurso todavía no tiene contenido.</div>`;
  }

  function crearSlideCustom(id, custom) {
    const esPagina = custom.tipo === "pagina";
    const section = document.createElement("section");
    section.id = id;
    section.setAttribute("role", "group");
    section.setAttribute("aria-roledescription", "diapositiva");
    section.setAttribute("aria-label", decodificar(custom.titulo || String(custom.id)));
    section.className = esPagina ? "slide slide-fullbleed" : "slide";

    if (esPagina) {
      section.innerHTML = `
        <div class="slide-body">
          <div class="custom-page">${contenidoEmbebidoCustom(custom, true)}</div>
        </div>`;
    } else {
      section.innerHTML = `
        <div class="slide-body">
          <div class="slide-head">
            <div class="tag"><i class="fa-solid fa-photo-film" aria-hidden="true"></i> Recurso</div>
            ${custom.titulo ? `<h2 class="heading">${texto(custom.titulo)}</h2>` : ""}
            ${custom.descripcion ? `<p class="sub">${texto(custom.descripcion)}</p>` : ""}
          </div>
          <div class="custom-media-frame">
            ${contenidoEmbebidoCustom(custom, true)}
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
    const dataAttrs = `data-resource="${esc(r.id)}" data-item="${i}"`;
    const nombre = texto(it.nombre);
    const link = attrUrl(it.link);

    const typePill = `<span class="act-type"><i class="fa-solid ${meta.icon}" aria-hidden="true"></i> ${meta.label}</span>`;

    // La zona del nombre:
    //   - lista (2+) con descripción → botón que abre el modal.
    //   - lista sin descripción, o modo "una sola" → texto estático
    //     (en modo single la acción va en los botones grandes de abajo).
    const nombreBloque = (!single && tieneDescripcion)
      ? `<button class="act-open" type="button" ${dataAttrs} aria-label="Ver el detalle de: ${nombre}">
          ${typePill}
          <span class="act-headline">
            <span class="act-nombre">${nombre}</span>
            <span class="act-open-hint">Ver detalle <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></span>
          </span>
        </button>`
      : `<div class="act-static">
          ${typePill}
          <span class="act-nombre">${nombre}</span>
        </div>`;

    const goBtn = link
      ? `<a class="act-go" href="${link}" target="_blank" rel="noopener" title="Ir a la actividad" aria-label="Ir a la actividad: ${nombre}"><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></a>`
      : "";

    // Modo "una sola actividad": botones grandes en vez de la fila compacta.
    const acciones = single
      ? `<div class="act-actions">
          ${tieneDescripcion ? `<button class="act-see" type="button" ${dataAttrs}><i class="fa-solid fa-file-lines" aria-hidden="true"></i> Ver la actividad</button>` : ""}
          ${link ? `<a class="act-cta" href="${link}" target="_blank" rel="noopener"><span>Ir a la actividad</span><span class="act-cta-arrow" aria-hidden="true"><i class="fa-solid fa-arrow-right"></i></span></a>` : ""}
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
    section.setAttribute("aria-label", decodificar(recurso.titulo) || "Actividades");
    section.className = "slide";
    section.innerHTML = `
      <div class="slide-body">
        <div class="slide-head">
          <div class="tag"><i class="fa-solid fa-list-check" aria-hidden="true"></i> Actividades</div>
          <h2 class="heading">${texto(recurso.titulo) || "Actividades"}</h2>
          <p class="sub">Actividades del curso, fuera de los mosaicos de las semanas.</p>
        </div>
        <div class="act-wrap">${cuerpoActividades(recurso)}</div>
      </div>`;
    return section;
  }

  function openMediaModal(custom) {
    $("#customMediaModalTitle").textContent = decodificar(custom.titulo);
    $("#customMediaModalTitle").hidden = !custom.titulo;
    $("#customMediaModalDescripcion").textContent = decodificar(custom.descripcion);
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
    $("#customMediaModalTitle").textContent = decodificar(titulo);
    $("#customMediaModalTitle").hidden = !titulo;
    $("#customMediaModalDescripcion").hidden = true;
    const cuerpo = esHtml
      ? `<div class="act-modal-html">${descripcion}</div>`
      : `<div class="act-modal-html act-modal-html--texto">${texto(descripcion).split(/\n{2,}/).map((p) => `<p>${p}</p>`).join("")}</div>`;
    const href = attrUrl(link);
    $("#customMediaModalBody").innerHTML = cuerpo
      + (href ? `<a class="act-modal-go" href="${href}" target="_blank" rel="noopener"><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i> Ir a la actividad</a>` : "");
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

  // (v2) Antes el bucle requestAnimationFrame corria SIEMPRE, desde la
  // carga y en cualquier diapositiva (CPU ocupada en reposo). Ahora solo
  // corre mientras "Bienvenida" esta activa y solo hasta que las figuras
  // alcanzan al puntero; el siguiente movimiento lo vuelve a arrancar.
  const welcomeGeo = { activa: false, raf: 0, mouseX: 0, mouseY: 0, x: 0, y: 0, escuchando: false };

  function pasoWelcomeGeo() {
    const g = welcomeGeo;
    g.raf = 0;
    if (!g.activa) return;
    g.x += (g.mouseX - g.x) * 0.05;
    g.y += (g.mouseY - g.y) * 0.05;
    welcomeGeoWrappers.forEach((wrapper) => {
      const depth = parseFloat(wrapper.dataset.depth);
      wrapper.style.transform = `translate(${(g.x * depth * -0.15).toFixed(2)}px, ${(g.y * depth * -0.15).toFixed(2)}px)`;
    });
    if (Math.abs(g.mouseX - g.x) > 0.5 || Math.abs(g.mouseY - g.y) > 0.5) g.raf = requestAnimationFrame(pasoWelcomeGeo);
  }
  function moverWelcomeGeo(x, y) {
    const g = welcomeGeo;
    g.mouseX = x - window.innerWidth / 2;
    g.mouseY = y - window.innerHeight / 2;
    if (g.activa && !g.raf) g.raf = requestAnimationFrame(pasoWelcomeGeo);
  }
  function arrancarWelcomeGeo() {
    const scene = $("#welcomeGeo");
    if (!scene || scene.hidden || !welcomeGeoWrappers.length) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    welcomeGeo.activa = true;
    if (!welcomeGeo.escuchando) {
      welcomeGeo.escuchando = true;
      document.addEventListener("mousemove", (e) => moverWelcomeGeo(e.clientX, e.clientY), { passive: true });
      document.addEventListener("touchmove", (e) => {
        if (e.touches.length) moverWelcomeGeo(e.touches[0].clientX, e.touches[0].clientY);
      }, { passive: true });
    }
  }
  function detenerWelcomeGeo() {
    welcomeGeo.activa = false;
    if (welcomeGeo.raf) { cancelAnimationFrame(welcomeGeo.raf); welcomeGeo.raf = 0; }
  }
  function initWelcomeGeo() {
    const scene = $("#welcomeGeo");
    if (!scene || scene.hidden) return; // hay frase_destacada: se usa la quote-card de siempre
    if (!scene.childElementCount) buildWelcomeShapes(scene);
  }

  /* ---------------------------------------------------------------------
   * Init
   * ------------------------------------------------------------------- */
  // (v2) Cada paso va aislado con paso(): si uno falla (un dato raro en el
  // JSON), los demas siguen, el visor no queda en blanco y el error se le
  // avisa a la pagina padre ("visor-error") para que ofrezca la version ligera.
  document.addEventListener("DOMContentLoaded", () => {
    const datos = paso("datos", obtenerDatos);
    if (!datos) return;
    origenPadre = datos.origen_padre;
    iniciarSaludo("hero");
    paso("equipo", marcarEquipoModesto);

    SLIDES = paso("estructura", () => construirSlides(datos)) || [SLIDES_FIJAS[0]];

    // Cualquier diapositiva FIJA que quedó fuera de SLIDES (visible:false
    // propio, o —para "docente_tutor"— ausencia de profesor_tutor) se
    // saca del árbol de accesibilidad, no solo se deja invisible por CSS.
    const idsVisibles = new Set(SLIDES.map((s) => s.id));
    SLIDES_FIJAS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) el.hidden = !idsVisibles.has(s.id);
    });

    paso("diapositivas_extra", () => renderCustomSlides(SLIDES));
    paso("portada", () => renderHeroYBienvenidaYDocente(datos));
    paso("navegacion", renderChrome);
    paso("aprenderas", () => renderLearn(datos));
    paso("tutorias", () => renderTutorias(datos.tutorias));
    paso("unidades", () => renderUnitsAccordion(datos.modulos));
    paso("actividades_portada", () => renderActividadesHero(datos));
    if (!datos.ejemplo) paso("estadisticas", ocultarEstadisticasEnCero);
    paso("actividades", () => initActividades(datos));
    paso("botones", initHeroCue);
    paso("botones_unidades", initGotoUnitsButtons);
    paso("parallax", initHeroParallax);
    paso("bienvenida_figuras", initWelcomeGeo);
    paso("modal", initMediaModal);
    paso("teclado", initKeyboard);
    paso("gesto", initSwipe);
    paso("mazo", () => deck.init());
  });
})();
