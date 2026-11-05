# Pauta de Prensa · Secretaría de Familia y Desarrollo Social

Sistema de solicitudes de prensa de la Secretaría de Familia y Desarrollo Social de la Alcaldía de Zipaquirá.

Las coordinadoras de **Vivienda**, **Comisarías de Familia** e **Inclusión Social** usan el formulario para pedir cubrimientos, piezas gráficas y videos. Inclusión Social agrupa Primera Infancia, Infancia, Adolescencia, Juventud, Mujer y Equidad de Género, Manzanas del Cuidado, Línea Púrpura, Adulto Mayor, Discapacidad y LGBTI. Darwin y Camila gestionan las solicitudes desde la pauta: las delegan, quedan en su Google Calendar, hacen seguimiento hasta el envío a Prensa Central y consultan las estadísticas.

| Página | Para quién | Qué hace |
|---|---|---|
| `index.html` | Coordinadoras de programa | Formulario con preguntas según el servicio, mínimo 5 días de anticipación y revisión de la agenda del equipo |
| `pauta.html` | Darwin, Camila y Coordinación (con PIN) | Franja de los próximos 7 días, tablero por estados, delegación con revisión de cruces, agenda, tabla con filtros y CSV, estadísticas |

## Estructura

```
├── index.html            Formulario de solicitud
├── pauta.html            Dashboard del equipo de prensa
├── assets/
│   ├── config.js         URL de la API de Apps Script  ← editar
│   └── api.js            Conexión con la API (fetch)
└── apps-script/
    ├── Code.gs           Backend: Google Sheets + Google Calendar + correos
    └── appsscript.json   Manifiesto (zona horaria America/Bogota)
```

## Puesta en marcha

### 1. Backend en Apps Script

1. Cree un proyecto en [script.google.com](https://script.google.com) con la cuenta dueña del Google Sheet.
2. Pegue `apps-script/Code.gs`. Para pegar `appsscript.json`, active primero *Configuración del proyecto → Mostrar el archivo de manifiesto*.
3. En `CONFIG`, complete:
   - `SITIO_URL`: la dirección de GitHub Pages, por ejemplo `https://usuario.github.io/pauta-prensa/`
   - `email` de Darwin y de Camila, para que les lleguen los avisos.
4. Ejecute `setup()` y acepte los permisos. El registro indica si hay acceso a los dos calendarios.
5. Ejecute `verPines()` para ver los PIN de Darwin, Camila y Coordinación. Para cambiar uno, use `cambiarPin('Darwin', '123456')`.
6. Vaya a **Implementar → Nueva implementación → Aplicación web**, con *Ejecutar como: Yo* y *Quién tiene acceso: Cualquier persona*.
7. Copie la URL que termina en `/exec`. Si la abre en el navegador, debe mostrar `{"ok":true,...}`.

> Darwin y Camila deben compartir su Google Calendar con la cuenta dueña del script, con el permiso **"Hacer cambios en eventos"**.

### 2. Frontend en GitHub Pages

1. Pegue la URL `/exec` en `assets/config.js`.
2. Suba el repositorio a GitHub.
3. Active GitHub Pages en *Settings → Pages → Deploy from a branch → `main` / root*.
4. Comparta:
   - con las coordinadoras: `https://usuario.github.io/pauta-prensa/`
   - con el equipo de prensa: `https://usuario.github.io/pauta-prensa/pauta.html`

### Cuando cambie el código de Apps Script

Vaya a *Implementar → Administrar implementaciones → editar → Nueva versión*. Así la URL `/exec` no cambia y no hay que tocar `config.js`.

## Reglas del sistema

- **Anticipación:** 5 días como mínimo desde el formulario (`ANTICIPACION_DIAS`). Las solicitudes directas que registra el equipo, por ejemplo de la Secretaria de Despacho, no tienen esta restricción.
- **Cruces de horario:**
  - El formulario no recibe una solicitud si Darwin y Camila están ocupados los dos a esa hora.
  - Al delegar, el sistema avisa si la persona tiene otro compromiso y propone pasársela a quien está libre.
  - Revisa con un margen de 30 minutos para el desplazamiento.
- **Retraso:**
  - Una pieza gráfica se marca como retrasada si pasa la fecha en que se necesitaba.
  - Un cubrimiento o video, si pasa 1 día después del evento sin enviarse a Prensa Central (`PLAZO_ENTREGA_DIAS`).
- **Estados:** Por asignar → Asignada → En producción → Lista para enviar → Enviada a Prensa Central. Una solicitud también puede quedar Cancelada.

## Privacidad

- Los datos quedan en el Google Sheet y nunca en GitHub.
- El Sheet **no necesita estar compartido públicamente**, porque el script lo lee con la cuenta dueña. Se recomienda dejarlo restringido.
- Los PIN se guardan en las propiedades del script, no en el código.

---

Desarrollado por Hope - Julieth Rivera
