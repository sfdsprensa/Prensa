/**
 * Conexión con la API de Apps Script.
 *
 * Usa fetch POST con el cuerpo en texto plano: es una "petición simple" para el navegador,
 * así que no dispara preflight CORS y Apps Script la acepta desde GitHub Pages.
 *
 * Expone la misma interfaz que google.script.run para que las páginas
 * funcionen igual dentro o fuera de Apps Script:
 *   google.script.run.withSuccessHandler(fn).withFailureHandler(fn).accion(args...)
 */
(function () {
  const URL_API = window.PAUTA_API_URL || '';

  async function llamar(accion, args) {
    if (!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(URL_API)) {
      throw new Error('Falta configurar la URL de la API en assets/config.js');
    }
    let res;
    try {
      res = await fetch(URL_API, {
        method: 'POST',
        body: JSON.stringify({ accion: accion, args: args || [] }),
        redirect: 'follow'
      });
    } catch (e) {
      throw new Error('No hay conexión con el servidor. Revise su internet e intente de nuevo.');
    }
    let j;
    try { j = await res.json(); }
    catch (e) { throw new Error('El servidor respondió algo inesperado. Verifique que la implementación de Apps Script tenga acceso "Cualquier persona".'); }
    if (!j.ok) throw new Error(j.error || 'Error desconocido');
    return j.data;
  }

  window.llamarApi = llamar;

  window.cargarConfig = async function () {
    try {
      return await llamar('config', []);
    } catch (e) {
      const aviso = document.createElement('div');
      aviso.setAttribute('role', 'alert');
      aviso.style.cssText = 'position:fixed;inset:auto 16px 16px 16px;z-index:99;background:#b42318;color:#fff;padding:14px 16px;border-radius:8px;font:500 14px system-ui,sans-serif;max-width:640px;margin:auto';
      aviso.textContent = 'No se pudo cargar el sistema: ' + e.message;
      document.body.appendChild(aviso);
      throw e;
    }
  };

  window.google = window.google || {};
  window.google.script = {
    get run() {
      let ok = function () {}, ko = function (e) { console.error(e); };
      let proxy;
      const base = {
        withSuccessHandler(f) { ok = f; return proxy; },
        withFailureHandler(f) { ko = f; return proxy; }
      };
      proxy = new Proxy(base, {
        get(t, k) {
          if (k in t) return t[k];
          return function () { llamar(k, Array.prototype.slice.call(arguments)).then(ok, ko); };
        }
      });
      return proxy;
    }
  };
})();
