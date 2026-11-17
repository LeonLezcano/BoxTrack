/**
 * Sanitizer Zero-Sink DOM
 * Directiva Mandatoria AiAppFactory Standard
 */
const SAFE_RASTER_DATA_URI = /^data:image\/(png|jpe?g|webp);base64,[a-z0-9+/=]+$/i;

export const Sanitizer = {
  escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  safeSetInnerHTML(element, rawHTML) {
    if (!element) return;
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHTML, 'text/html');

    // Remover elementos potencialmente peligrosos
    const scripts = doc.querySelectorAll('script, iframe, object, embed');
    scripts.forEach(s => s.remove());

    // Sanitizar atributos inline peligrosos
    const all = doc.querySelectorAll('*');
    all.forEach(el => {
      Array.from(el.attributes).forEach(attr => {
        if (attr.name.startsWith('on')) {
          el.removeAttribute(attr.name);
        }
        if (['href', 'src', 'action'].includes(attr.name)) {
          const val = attr.value.trim();
          const lower = val.toLowerCase();
          if (lower.startsWith('javascript:') || lower.startsWith('vbscript:')) {
            el.removeAttribute(attr.name);
          } else if (lower.startsWith('data:')) {
            if (!(attr.name === 'src' && el.tagName === 'IMG' && SAFE_RASTER_DATA_URI.test(val))) {
              el.removeAttribute(attr.name);
            }
          }
        }
      });
    });

    element.replaceChildren(...Array.from(doc.body.childNodes));
  },

  sanitizeURL(url) {
    if (!url) return '';
    const clean = String(url).trim();
    const lower = clean.toLowerCase();
    if (lower.startsWith('javascript:') || lower.startsWith('vbscript:')) {
      return '#';
    }
    if (lower.startsWith('data:') && !SAFE_RASTER_DATA_URI.test(clean)) {
      return '#';
    }
    return clean;
  }
};
