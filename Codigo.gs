/*************************************************************************************************
 * CENTRO DE GESTIÓN DE SOLICITUDES DE PRENSA
 * Backend — Google Apps Script (Web App)
 * -----------------------------------------------------------------------------------------------
 * Fuente de verdad de FECHAS/HORAS/DESCRIPCIÓN  ->  Google Calendar (creado desde Calendly)
 * Fuente de verdad de ESTADOS INTERNOS          ->  Google Sheets (hoja "Estados")
 * Relación entre ambos                          ->  ID único del evento de Google Calendar
 *
 * NUNCA modifica ni elimina eventos del calendario. Solo LEE el calendario.
 * Solo ESCRIBE en la hoja de estados internos.
 *************************************************************************************************/

/*** ============================ 1. CONFIGURACIÓN ============================ ***/
const CONFIG = {
  // ID del calendario de Google donde Calendly registra las solicitudes.
  // "primary" para tu calendario principal, o el correo del calendario compartido,
  // p.ej. "c_xxxxxxx@group.calendar.google.com"
  CALENDAR_ID: 'primary',

  // ID de la hoja de cálculo donde se guardan los estados internos.
  // Déjalo vacío ('') para que el script cree/use una hoja llamada como SHEET_NAME
  // dentro del Spreadsheet contenedor. Si usas un Spreadsheet independiente,
  // pega aquí su ID (lo que va entre /d/ y /edit en la URL).
  SPREADSHEET_ID: '',
  SHEET_NAME: 'Estados',

  // Ventana de lectura de eventos (en días). Lee desde hace PAST días hasta dentro de FUTURE días.
  DAYS_PAST: 180,
  DAYS_FUTURE: 180,

  // Token opcional para dar una capa mínima de protección al endpoint.
  // Si lo defines aquí, el dashboard debe enviar el mismo token (?token=...).
  // Déjalo '' para no exigir token.
  API_TOKEN: '',

  // Zona horaria usada para formatear fechas legibles.
  TIMEZONE: 'America/Bogota'
};

/*** ============================ 2. ROUTER PRINCIPAL ============================ ***/

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  // Permite POST con cuerpo text/plain (evita preflight CORS desde GitHub Pages).
  try {
    if (e && e.postData && e.postData.contents) {
      const body = JSON.parse(e.postData.contents);
      e.parameter = Object.assign({}, e.parameter, body);
    }
  } catch (err) { /* si no es JSON, seguimos con e.parameter */ }
  return handleRequest(e);
}

function handleRequest(e) {
  const params = (e && e.parameter) ? e.parameter : {};
  const action = params.action || 'getSolicitudes';

  // Validación de token (opcional)
  if (CONFIG.API_TOKEN && params.token !== CONFIG.API_TOKEN) {
    return json({ ok: false, error: 'No autorizado (token inválido).' });
  }

  try {
    switch (action) {
      case 'ping':
        return json({ ok: true, message: 'API activa', ts: new Date().toISOString() });

      case 'getSolicitudes':
        return json({ ok: true, solicitudes: getSolicitudes(), ts: new Date().toISOString() });

      case 'setEstado':
        return json(setEstado(params.id, params.estado, params.nota, params.usuario));

      case 'getEstados':
        return json({ ok: true, estados: getEstadosMap() });

      default:
        return json({ ok: false, error: 'Acción no reconocida: ' + action });
    }
  } catch (err) {
    return json({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/*** ============================ 3. LECTURA DE CALENDARIO ============================ ***/

function getCalendar_() {
  const cal = (CONFIG.CALENDAR_ID === 'primary')
    ? CalendarApp.getDefaultCalendar()
    : CalendarApp.getCalendarById(CONFIG.CALENDAR_ID);
  if (!cal) throw new Error('No se encontró el calendario "' + CONFIG.CALENDAR_ID + '". Verifica el ID y los permisos.');
  return cal;
}

/**
 * Devuelve todas las solicitudes: cada evento del calendario convertido en registro
 * estructurado + su estado interno leído desde la hoja "Estados".
 */
function getSolicitudes() {
  const cal = getCalendar_();
  const now = new Date();
  const start = new Date(now.getTime() - CONFIG.DAYS_PAST * 86400000);
  const end = new Date(now.getTime() + CONFIG.DAYS_FUTURE * 86400000);

  const eventos = cal.getEvents(start, end);
  const estados = getEstadosMap();

  return eventos.map(function (ev) {
    const id = ev.getId(); // ID único del evento de Google Calendar
    const inicio = ev.getStartTime();
    const fin = ev.getEndTime();
    const descripcion = ev.getDescription() || '';
    const ubicacion = ev.getLocation() || '';
    const titulo = ev.getTitle() || '';

    // Parseo tolerante de la descripción de Calendly
    const parsed = parseDescripcion(descripcion, titulo, ubicacion);

    // Estado interno (si existe en la hoja); de lo contrario se calcula en el frontend.
    const estadoInterno = estados[id] || null;

    return {
      id: id,
      titulo: titulo,
      fechaCreacion: safeIso_(ev.getDateCreated ? ev.getDateCreated() : inicio),
      fechaServicio: safeIso_(inicio),
      horaInicio: formatHora_(inicio),
      horaFin: formatHora_(fin),
      inicioISO: safeIso_(inicio),
      finISO: safeIso_(fin),
      esTodoElDia: ev.isAllDayEvent(),
      nombre: parsed.nombre,
      correo: parsed.correo,
      telefono: parsed.telefono,
      programa: parsed.programa,
      tipo: parsed.tipo,
      lugar: parsed.lugar || ubicacion || '',
      descripcionPieza: parsed.descripcionPieza,
      infoAdicional: parsed.infoAdicional,
      descripcionCruda: descripcion,
      enlaceEvento: buildEventUrl_(id),
      // Estado interno del dashboard (puede ser null si nunca se ha registrado)
      estado: estadoInterno ? estadoInterno.estado : null,
      estadoNota: estadoInterno ? estadoInterno.nota : '',
      estadoActualizado: estadoInterno ? estadoInterno.actualizadoEn : ''
    };
  });
}

function safeIso_(d) {
  try { return d ? new Date(d).toISOString() : ''; } catch (e) { return ''; }
}

function formatHora_(d) {
  try { return Utilities.formatDate(new Date(d), CONFIG.TIMEZONE, 'HH:mm'); }
  catch (e) { return ''; }
}

/** Construye una URL abrible del evento en Google Calendar a partir de su ID. */
function buildEventUrl_(eventId) {
  // El ID viene como "abc123@google.com"; para la URL se usa la parte antes de @.
  const base = String(eventId).split('@')[0];
  const b64 = Utilities.base64Encode(base + ' ' + CONFIG.CALENDAR_ID);
  return 'https://calendar.google.com/calendar/u/0/r/eventedit/' + b64;
}

/*** ============================ 4. PARSER DE LA DESCRIPCIÓN ============================ ***/
/**
 * Parser tolerante. Calendly suele escribir la descripción como pares "Etiqueta: valor",
 * un par por línea. Este parser:
 *  - normaliza acentos y mayúsculas al comparar etiquetas
 *  - acepta varias variantes de nombre de etiqueta
 *  - nunca lanza error si falta un campo
 */
function parseDescripcion(texto, titulo, ubicacion) {
  const out = {
    nombre: '', correo: '', telefono: '', programa: '', tipo: '',
    lugar: '', descripcionPieza: '', infoAdicional: ''
  };

  const limpio = String(texto || '').replace(/\r/g, '');
  const lineas = limpio.split('\n');

  // Diccionario de etiquetas -> campo destino (comparación normalizada)
  const MAPA = [
    { campo: 'nombre', claves: ['nombre', 'nombre del solicitante', 'solicitante', 'name', 'nombre completo'] },
    { campo: 'correo', claves: ['correo', 'correo electronico', 'email', 'e-mail', 'mail'] },
    { campo: 'telefono', claves: ['telefono', 'telefono o whatsapp', 'whatsapp', 'celular', 'contacto', 'numero', 'phone', 'movil'] },
    { campo: 'programa', claves: ['programa', 'dependencia', 'area', 'secretaria', 'oficina', 'program'] },
    { campo: 'tipo', claves: ['tipo de requerimiento', 'tipo', 'requerimiento', 'servicio', 'tipo de servicio'] },
    { campo: 'lugar', claves: ['lugar del cubrimiento', 'lugar', 'ubicacion', 'sitio', 'direccion', 'location', 'place'] },
    { campo: 'descripcionPieza', claves: ['descripcion de la pieza grafica', 'descripcion de la pieza', 'descripcion pieza', 'pieza grafica', 'descripcion', 'detalle', 'que necesita', 'que necesitas'] }
  ];

  const sinEtiqueta = [];

  lineas.forEach(function (linea) {
    const idx = linea.indexOf(':');
    if (idx === -1) {
      if (linea.trim()) sinEtiqueta.push(linea.trim());
      return;
    }
    const etiqueta = normalizar_(linea.substring(0, idx));
    const valor = linea.substring(idx + 1).trim();
    if (!valor) return;

    let asignado = false;
    for (var i = 0; i < MAPA.length; i++) {
      const item = MAPA[i];
      for (var j = 0; j < item.claves.length; j++) {
        if (etiqueta === item.claves[j] || etiqueta.indexOf(item.claves[j]) !== -1) {
          if (!out[item.campo]) { out[item.campo] = valor; asignado = true; }
          break;
        }
      }
      if (asignado) break;
    }
    if (!asignado) sinEtiqueta.push(linea.trim());
  });

  // Detección robusta de datos por patrón, aunque no tengan etiqueta:
  if (!out.correo) {
    const m = limpio.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
    if (m) out.correo = m[0];
  }
  if (!out.telefono) {
    const m = limpio.match(/(\+?\d[\d\s().-]{6,}\d)/);
    if (m) out.telefono = m[1].trim();
  }

  // Normalizar el tipo de requerimiento a las 3 categorías canónicas
  out.tipo = normalizarTipo_(out.tipo, titulo);

  // Información adicional = líneas sin etiqueta reconocida
  out.infoAdicional = sinEtiqueta.join(' | ');

  // Sustituir vacíos por "No registrado"
  ['nombre', 'correo', 'telefono', 'programa', 'lugar', 'descripcionPieza', 'infoAdicional'].forEach(function (k) {
    if (!out[k]) out[k] = 'No registrado';
  });

  return out;
}

/** Quita acentos, pasa a minúsculas y colapsa espacios para comparar etiquetas. */
function normalizar_(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Convierte cualquier variante a: Cubrimiento | Pieza gráfica | Grabación de video | Otro */
function normalizarTipo_(tipo, titulo) {
  const t = normalizar_(tipo + ' ' + (titulo || ''));
  if (t.indexOf('cubrimiento') !== -1 || t.indexOf('cobertura') !== -1) return 'Cubrimiento';
  if (t.indexOf('pieza') !== -1 || t.indexOf('grafic') !== -1 || t.indexOf('diseno') !== -1) return 'Pieza gráfica';
  if (t.indexOf('video') !== -1 || t.indexOf('grabacion') !== -1 || t.indexOf('grabar') !== -1) return 'Grabación de video';
  return tipo && tipo !== 'No registrado' ? tipo : 'No registrado';
}

/*** ============================ 5. ESTADOS INTERNOS (SHEETS) ============================ ***/

function getSheet_() {
  let ss;
  if (CONFIG.SPREADSHEET_ID) {
    ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  } else {
    ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      // Sin spreadsheet contenedor: se crea uno y se guarda su ID en propiedades.
      const props = PropertiesService.getScriptProperties();
      let id = props.getProperty('SPREADSHEET_ID');
      if (id) { ss = SpreadsheetApp.openById(id); }
      else {
        ss = SpreadsheetApp.create('Centro de Prensa - Estados Internos');
        props.setProperty('SPREADSHEET_ID', ss.getId());
      }
    }
  }
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
    sheet.getRange(1, 1, 1, 5)
      .setValues([['eventId', 'estado', 'nota', 'actualizadoPor', 'actualizadoEn']])
      .setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/** Devuelve un mapa { eventId: {estado, nota, actualizadoPor, actualizadoEn} }. */
function getEstadosMap() {
  const sheet = getSheet_();
  const last = sheet.getLastRow();
  const map = {};
  if (last < 2) return map;
  const rows = sheet.getRange(2, 1, last - 1, 5).getValues();
  rows.forEach(function (r) {
    if (r[0]) {
      map[r[0]] = {
        estado: r[1],
        nota: r[2] || '',
        actualizadoPor: r[3] || '',
        actualizadoEn: r[4] ? new Date(r[4]).toISOString() : ''
      };
    }
  });
  return map;
}

/** Crea o actualiza el estado interno de una solicitud identificada por su eventId. */
function setEstado(eventId, estado, nota, usuario) {
  if (!eventId) return { ok: false, error: 'Falta el ID del evento.' };
  const ESTADOS_VALIDOS = ['PROGRAMADA', 'PENDIENTE', 'REALIZADA', 'NO_REALIZADA', 'CANCELADA'];
  if (ESTADOS_VALIDOS.indexOf(estado) === -1) {
    return { ok: false, error: 'Estado inválido: ' + estado };
  }

  const sheet = getSheet_();
  const last = sheet.getLastRow();
  const ahora = new Date();
  const nuevo = [eventId, estado, nota || '', usuario || 'dashboard', ahora];

  if (last >= 2) {
    const ids = sheet.getRange(2, 1, last - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      if (ids[i][0] === eventId) {
        sheet.getRange(i + 2, 1, 1, 5).setValues([nuevo]);
        return { ok: true, id: eventId, estado: estado, actualizado: true };
      }
    }
  }
  sheet.appendRow(nuevo);
  return { ok: true, id: eventId, estado: estado, creado: true };
}

/*** ============================ 6. UTILIDADES / PRUEBAS ============================ ***/

/** Ejecuta esto una vez desde el editor para autorizar los permisos y verificar todo. */
function pruebaConexion() {
  const cal = getCalendar_();
  const sheet = getSheet_();
  const solicitudes = getSolicitudes();
  Logger.log('Calendario: ' + cal.getName());
  Logger.log('Hoja de estados: ' + sheet.getParent().getName() + ' / ' + sheet.getName());
  Logger.log('Solicitudes leídas: ' + solicitudes.length);
  if (solicitudes.length) Logger.log('Ejemplo: ' + JSON.stringify(solicitudes[0], null, 2));
  return solicitudes.length;
}
