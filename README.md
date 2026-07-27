# 📡 Centro de Gestión de Solicitudes de Prensa

Dashboard para centralizar, visualizar, gestionar y analizar las solicitudes de prensa que llegan por **Calendly → Google Calendar**. El estado de ejecución de cada solicitud se administra internamente en **Google Sheets**, usando el **ID único del evento** como llave. El frontend es estático y se publica en **GitHub Pages**.

```
Calendly  →  Google Calendar  →  Google Apps Script (Web App)  →  Dashboard (GitHub Pages)
                                          ↕
                              Google Sheets (estados internos)
```

---

## 📁 Estructura de archivos

```
centro-prensa/
├── index.html                 Página principal (sidebar + todas las vistas)
├── README.md                  Esta guía
├── .nojekyll                  Evita el procesamiento Jekyll en GitHub Pages
├── assets/
│   ├── styles.css             Estilos (diseño institucional, responsive)
│   ├── config.js              ⚙️ CONFIGURACIÓN (modo, URL del API, ponderaciones)
│   ├── demo-data.js           Datos de demostración (solo modo demo)
│   └── app.js                 Lógica: datos, estados, KPIs, agenda, gráficos, informes
└── apps-script/
    └── Codigo.gs              Backend: lee Calendar, parsea, guarda estados en Sheets
```

---

## 🚀 Puesta en marcha rápida (modo DEMO)

No requiere Google. Sirve para ver el dashboard funcionando de inmediato.

1. Abre `index.html` en el navegador (o publícalo en GitHub Pages).
2. Ya viene en `MODO: 'demo'` con datos ficticios que cubren todos los estados y tipos.
3. Explora: Dashboard, Agenda, Solicitudes, módulos de servicio, Análisis e Informes.

Cuando estés listo para datos reales, sigue la sección de **producción**.

---

## 🔌 Integración con Google Calendar (modo PRODUCCIÓN)

### Paso 1 — Crear el proyecto de Apps Script

1. Entra a **https://script.google.com** con la cuenta que administra el calendario.
2. **Nuevo proyecto** → nómbralo *"Centro de Prensa - API"*.
3. Borra el contenido de `Código.gs` y pega el archivo **`apps-script/Codigo.gs`** de este proyecto.

### Paso 2 — Configurar el ID del calendario

En la parte superior de `Codigo.gs`, ajusta `CONFIG.CALENDAR_ID`:

- `'primary'` → tu calendario principal.
- El correo del calendario compartido, p. ej. `c_ab12...@group.calendar.google.com`.
  - Para obtenerlo: Google Calendar → engranaje del calendario → **Configuración** → *"Integrar calendario"* → **ID de calendario**.

### Paso 3 — Preparar la hoja de estados (Google Sheets)

Tienes dos opciones:

- **Opción A (recomendada):** deja `SPREADSHEET_ID: ''`. El script creará automáticamente una hoja llamada *"Centro de Prensa - Estados Internos"* la primera vez y recordará su ID.
- **Opción B:** crea tú una hoja de cálculo, copia su ID (lo que va entre `/d/` y `/edit` en la URL) y pégalo en `SPREADSHEET_ID`.

La hoja `Estados` tendrá estas columnas (se crean solas):
`eventId | estado | nota | actualizadoPor | actualizadoEn`

### Paso 4 — Autorizar permisos

1. En el editor de Apps Script, selecciona la función **`pruebaConexion`** y pulsa **Ejecutar**.
2. Google pedirá autorización → **Revisar permisos** → elige tu cuenta → *"Avanzado"* → *"Ir a … (no seguro)"* → **Permitir**.
   - Esto es normal: autorizas a **tu propio** script a leer tu calendario y escribir tu hoja.
3. Abre **Ver → Registros** y confirma que aparece el número de solicitudes leídas.

### Paso 5 — Publicar la Web App (crear el endpoint)

1. Botón **Implementar → Nueva implementación**.
2. Tipo (engranaje): **Aplicación web**.
3. Configura:
   - **Descripción:** `API Centro de Prensa`
   - **Ejecutar como:** *Yo* (tu cuenta).
   - **Quién tiene acceso:** *Cualquier persona* (necesario para que el dashboard público la consulte).
4. **Implementar** → copia la **URL de la aplicación web** (termina en `/exec`).

> Cada vez que modifiques el código, usa **Implementar → Gestionar implementaciones → Editar (lápiz) → Versión: Nueva** para que los cambios entren en vigor sin cambiar la URL.

### Paso 6 — Conectar el dashboard

Edita **`assets/config.js`**:

```js
MODO: 'produccion',
API_URL: 'https://script.google.com/macros/s/AKfycb....../exec',
API_TOKEN: '',          // opcional (ver Seguridad)
AUTO_SYNC_MS: 300000,   // sincroniza cada 5 minutos
```

También puedes cambiar esto desde la pantalla **Configuración** del propio dashboard (se guarda en el navegador).

### Paso 7 — Probar

1. Abre el dashboard y pulsa **"Actualizar solicitudes"**.
2. Debes ver tus eventos reales convertidos en solicitudes.
3. Marca una solicitud pasada como *Realizada* / *No realizada* / *Cancelada*: se guardará en la hoja `Estados`.

---

## 🧩 Cómo debe verse la descripción del evento (Calendly)

El parser es **tolerante**, pero funciona mejor si la descripción trae pares `Etiqueta: valor`, uno por línea. Configura tu formulario de Calendly para que la descripción del evento incluya:

```
Nombre: {nombre del solicitante}
Correo: {correo}
Programa: {programa}
Teléfono o WhatsApp: {teléfono}
Tipo de requerimiento: Cubrimiento | Pieza gráfica | Grabación de video
Lugar del cubrimiento: {lugar}                 (si es cubrimiento)
Descripción de la pieza gráfica: {detalle}     (si es pieza gráfica)
```

**El parser también reconoce variantes** (`Correo electrónico`, `Celular`, `Dependencia`, `Requerimiento`, `Ubicación`, etc.), detecta correo y teléfono aunque no tengan etiqueta, y **nunca falla**: si un campo no existe, muestra **"No registrado"**.

---

## 🔐 Seguridad

**Qué NO exponer en GitHub:** este repositorio es público, así que en el código **solo** debe ir la URL `/exec` (que ya es pública por diseño). Nunca subas:

- IDs de calendarios privados sensibles, correos internos, ni tokens de OAuth.
- Archivos de credenciales de Google Cloud (`.json`), claves de API de terceros.

**Buenas prácticas aplicadas:**

- **Apps Script como capa intermedia:** el navegador **nunca** accede directamente a Google Calendar. Solo habla con tu Web App, que decide qué exponer. Las credenciales viven en Google, no en el frontend.
- **Token opcional:** define `CONFIG.API_TOKEN` en el backend y el mismo valor en `assets/config.js`. El endpoint rechazará peticiones sin el token. (Es una capa mínima; no lo consideres secreto fuerte porque viaja en el frontend público. Para control real de acceso, cambia *"Quién tiene acceso"* a *"Solo yo"* o *"Usuarios de mi organización"* y sirve el dashboard de forma privada.)
- **El backend solo LEE el calendario y solo ESCRIBE en la hoja de estados.** Nunca crea, modifica ni borra eventos.
- Si necesitas privacidad total, publica el dashboard en un repositorio **privado** con GitHub Pages privado (requiere plan de pago) o sírvelo internamente.

---

## 🌐 Despliegue en GitHub Pages

1. Crea un repositorio (p. ej. `centro-prensa`) y sube el contenido de esta carpeta.
2. En GitHub: **Settings → Pages**.
3. **Source:** *Deploy from a branch* → **Branch:** `main` → carpeta `/ (root)` → **Save**.
4. En 1–2 minutos tu dashboard estará en `https://TU-USUARIO.github.io/centro-prensa/`.

El archivo `.nojekyll` ya está incluido para evitar problemas de procesamiento.

---

## 🎛️ Estados de ejecución

| Estado | Cómo se asigna |
|---|---|
| 🟡 **Programada** | Automático. El evento existe y su fecha aún no llega. |
| 🔵 **Pendiente de verificación** | Automático. La fecha/hora ya pasó y no hay resultado registrado. |
| 🟢 **Realizada** | Manual. El equipo confirma que se atendió. |
| 🔴 **No realizada** | Manual. La fecha pasó y no se realizó. |
| ⚪ **Cancelada** | Manual. La solicitud se canceló. |

> El estado interno **no toca** el evento de Google Calendar. Se guarda en la hoja `Estados`, relacionado por el **ID único del evento**.

---

## 📊 Qué incluye el dashboard

- **Dashboard:** 9 tarjetas KPI, porcentaje de cumplimiento con semáforo, pendientes de verificación, agenda de hoy, próximas 7 días, distribución por tipo y estado.
- **Agenda:** vistas mes / semana / día / lista, con colores por tipo y estado, y panel de detalle al hacer clic.
- **Solicitudes:** tabla completa con buscador, orden por columnas, filtros (estado, tipo, programa, lugar, rango de fechas) y exportación a CSV/Excel.
- **Cubrimientos / Piezas gráficas / Videos:** módulos con sub-KPIs y bandejas propias; los cubrimientos incluyen "lugares con más cubrimientos".
- **Pendientes de verificación:** lista con acciones rápidas ✓ / ✕ / Cancelar.
- **Análisis:** gráficos por programa, tipo, mes, día de la semana, estado y cumplimiento; análisis por programa; carga de trabajo ponderada con semáforo; y 7 tipos de alertas.
- **Informes:** semanal / mensual / trimestral / anual con exportación a CSV, Excel y PDF.
- **Configuración:** modo, URL del API, token, auto-sincronización y ponderaciones de carga.

---

## 🔍 Checklist de verificación

- [x] Conexión con Google Calendar mediante Apps Script (`pruebaConexion`).
- [x] Solicitudes cargadas y convertidas en registros estructurados.
- [x] Sin duplicados (deduplicación por ID de evento en backend y frontend).
- [x] Descripción extraída con parser tolerante ("No registrado" cuando falta).
- [x] Estados internos guardados en Google Sheets por ID.
- [x] Transición automática a "Pendiente de verificación" al pasar la fecha.
- [x] Marcado manual como Realizada / No realizada / Cancelada.
- [x] KPIs, gráficos, filtros y exportaciones funcionando.
- [x] Diseño responsive (computador, tablet, celular).
- [x] Modo DEMO y modo PRODUCCIÓN claramente separados.

---

## ❓ Solución de problemas

- **"No hay URL de API configurada":** estás en modo producción sin `API_URL`. Ve a Configuración y pégala, o vuelve a modo demo.
- **No cargan las solicitudes / error de red:** confirma que la Web App esté implementada con acceso *"Cualquier persona"* y que copiaste la URL `/exec` de la última versión.
- **Cambié el código y no se refleja:** crea una **Nueva versión** en *Gestionar implementaciones*.
- **Faltan datos en una solicitud:** revisa el formato de la descripción en Calendly; el parser mostrará "No registrado" en lo que no encuentre.
