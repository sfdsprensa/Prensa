/*************************************************************************************************
 * DATOS DEMO  —  se generan relativos a la fecha de hoy para que siempre haya solicitudes
 * pasadas, de hoy y futuras, cubriendo los tres tipos y los cinco estados.
 * En MODO producción este archivo se ignora.
 *************************************************************************************************/
window.generarDatosDemo = function () {
  const hoy = new Date();
  const d = function (offsetDias, hora, min) {
    const x = new Date(hoy);
    x.setDate(x.getDate() + offsetDias);
    x.setHours(hora || 9, min || 0, 0, 0);
    return x;
  };
  const iso = function (dt) { return dt.toISOString(); };
  const hhmm = function (dt) { return String(dt.getHours()).padStart(2, '0') + ':' + String(dt.getMinutes()).padStart(2, '0'); };

  const programas = ['Juventud', 'Cultura', 'Deportes', 'Salud', 'Educación', 'Desarrollo Económico', 'Ambiente', 'Mujer y Género'];
  const lugares = ['Plaza de los Comuneros', 'Casa de la Juventud', 'Catedral de Sal', 'Coliseo Municipal', 'Parque Villaveces', 'Alcaldía Municipal', 'Biblioteca Pública', 'Estadio Los Comuneros'];
  const nombres = ['Laura Gómez', 'Andrés Rodríguez', 'Camila Torres', 'Juan Martínez', 'Valentina Ríos', 'Sebastián Peña', 'Daniela Castro', 'Mateo Vargas', 'Sofía Herrera', 'Nicolás Forero'];

  let n = 0;
  const nuevo = function (offset, hora, tipo, estado, extra) {
    const inicio = d(offset, hora, 0);
    const fin = d(offset, hora + 2, 0);
    const nombre = nombres[n % nombres.length];
    const programa = programas[n % programas.length];
    n++;
    const base = {
      id: 'demo_' + n + '@google.com',
      titulo: tipo + ' - ' + programa,
      fechaCreacion: iso(d(offset - (2 + (n % 6)), 8, 0)),
      fechaServicio: iso(inicio),
      horaInicio: hhmm(inicio),
      horaFin: hhmm(fin),
      inicioISO: iso(inicio),
      finISO: iso(fin),
      esTodoElDia: false,
      nombre: nombre,
      correo: nombre.toLowerCase().replace(/[^a-z]/g, '.') + '@zipaquira.gov.co',
      telefono: '3' + (10 + (n % 20)) + ' ' + (400 + n) + ' ' + (1000 + n * 7),
      programa: programa,
      tipo: tipo,
      lugar: tipo === 'Cubrimiento' ? lugares[n % lugares.length] : (extra && extra.lugar) || '',
      descripcionPieza: tipo === 'Pieza gráfica' ? (extra && extra.pieza || 'Pieza para redes sociales — formato cuadrado, incluir logo institucional y fecha del evento.') : '',
      infoAdicional: extra && extra.info || '',
      descripcionCruda: '',
      enlaceEvento: 'https://calendar.google.com/calendar/u/0/r',
      estado: estado || null,
      estadoNota: '',
      estadoActualizado: estado ? iso(d(offset + 1, 10, 0)) : ''
    };
    return base;
  };

  const data = [];

  // --- Solicitudes PASADAS (algunas ya verificadas, otras pendientes) ---
  data.push(nuevo(-28, 8, 'Cubrimiento', 'REALIZADA'));
  data.push(nuevo(-25, 10, 'Pieza gráfica', 'REALIZADA', { pieza: 'Afiche vertical para Semana Cultural, resolución para impresión A3.' }));
  data.push(nuevo(-22, 14, 'Grabación de video', 'REALIZADA'));
  data.push(nuevo(-20, 9, 'Cubrimiento', 'NO_REALIZADA'));
  data.push(nuevo(-18, 11, 'Pieza gráfica', 'REALIZADA', { pieza: 'Historia para Instagram, formato vertical 1080x1920.' }));
  data.push(nuevo(-15, 15, 'Cubrimiento', 'REALIZADA'));
  data.push(nuevo(-12, 8, 'Grabación de video', 'CANCELADA'));
  data.push(nuevo(-10, 10, 'Cubrimiento', null)); // pasada sin verificar -> PENDIENTE
  data.push(nuevo(-8, 13, 'Pieza gráfica', null, { pieza: 'Banner para página web, 1200x400, tema jornada de vacunación.' }));
  data.push(nuevo(-6, 9, 'Grabación de video', null));
  data.push(nuevo(-5, 16, 'Cubrimiento', null));
  data.push(nuevo(-3, 11, 'Pieza gráfica', 'REALIZADA', { pieza: 'Invitación digital para consejo municipal de juventud.' }));
  data.push(nuevo(-2, 8, 'Cubrimiento', null));
  data.push(nuevo(-1, 14, 'Grabación de video', null));

  // --- Solicitudes de HOY ---
  data.push(nuevo(0, 9, 'Cubrimiento', 'PROGRAMADA'));
  data.push(nuevo(0, 11, 'Pieza gráfica', 'PROGRAMADA', { pieza: 'Pieza de agradecimiento para el evento de la tarde.' }));
  data.push(nuevo(0, 15, 'Grabación de video', 'PROGRAMADA'));

  // --- Solicitudes FUTURAS ---
  data.push(nuevo(1, 8, 'Cubrimiento', 'PROGRAMADA'));
  data.push(nuevo(2, 10, 'Pieza gráfica', 'PROGRAMADA', { pieza: 'Carrusel de 5 imágenes para campaña ambiental.' }));
  data.push(nuevo(2, 14, 'Cubrimiento', 'PROGRAMADA'));
  data.push(nuevo(3, 9, 'Grabación de video', 'PROGRAMADA'));
  data.push(nuevo(4, 11, 'Cubrimiento', 'PROGRAMADA'));
  data.push(nuevo(5, 16, 'Pieza gráfica', 'PROGRAMADA', { pieza: 'Diseño de reconocimiento para deportistas destacados.' }));
  data.push(nuevo(6, 8, 'Cubrimiento', 'PROGRAMADA'));
  data.push(nuevo(8, 10, 'Grabación de video', 'PROGRAMADA'));
  data.push(nuevo(9, 9, 'Cubrimiento', 'PROGRAMADA'));
  data.push(nuevo(10, 14, 'Pieza gráfica', 'PROGRAMADA', { pieza: 'Plantilla de certificados para clausura de talleres.' }));

  // Día con alta concentración de solicitudes (para probar la alerta)
  data.push(nuevo(7, 8, 'Cubrimiento', 'PROGRAMADA'));
  data.push(nuevo(7, 10, 'Pieza gráfica', 'PROGRAMADA', { pieza: 'Programación del día en formato de historia.' }));
  data.push(nuevo(7, 11, 'Cubrimiento', 'PROGRAMADA'));
  data.push(nuevo(7, 14, 'Grabación de video', 'PROGRAMADA'));
  data.push(nuevo(7, 16, 'Cubrimiento', 'PROGRAMADA'));

  // Solicitud con información incompleta (para probar la alerta)
  const incompleta = nuevo(4, 9, 'Cubrimiento', 'PROGRAMADA');
  incompleta.correo = 'No registrado';
  incompleta.telefono = 'No registrado';
  incompleta.lugar = 'No registrado';
  data.push(incompleta);

  // Solicitud con poca anticipación (creada casi el mismo día del servicio)
  const urgente = nuevo(1, 17, 'Grabación de video', 'PROGRAMADA');
  urgente.fechaCreacion = iso(d(1, 8, 0));
  data.push(urgente);

  return data;
};
