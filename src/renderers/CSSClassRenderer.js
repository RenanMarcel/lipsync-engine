/**
 * CSSClassRenderer — Applies CSS classes to an element based on viseme state.
 *
 * Perfect for CSS sprite animations, Lottie triggers, or any framework
 * where you toggle classes/data-attributes to change mouth appearance.
 *
 * @module CSSClassRenderer
 *
 * @example
 *   // CSS:
 *   // .mouth[data-viseme="sil"] { background-position: 0 0; }
 *   // .mouth[data-viseme="aa"]  { background-position: -128px 0; }
 *
 *   const renderer = new CSSClassRenderer(mouthElement, {
 *     attribute: 'data-viseme',    // Set data attribute
 *     classPrefix: 'mouth-',       // Also toggle class: mouth-sil, mouth-aa, etc.
 *     useSimpleVisemes: true,      // Use A-F instead of extended set
 *   });
 *
 *   engine.on('viseme', (frame) => renderer.render(frame));
 */

export class CSSClassRenderer {
  /**
   * @param {HTMLElement} element - Target DOM element.
   * @param {Object} [options]
   * @param {string} [options.attribute='data-viseme'] - Data attribute to set.
   * @param {string} [options.classPrefix=''] - If set, toggles CSS classes.
   * @param {boolean} [options.useSimpleVisemes=false] - Use simple (A-F) viseme keys.
   * @param {string} [options.intensityAttribute='data-intensity'] - Attribute for intensity.
   * @param {boolean} [options.setIntensity=true] - Whether to set intensity attribute.
   * @param {Object<string, string>} [options.visemeClassMap] - Custom viseme → class mapping.
   */
  constructor(element, options = {}) {
    this.element = element;
    this.opts = {
      attribute: 'data-viseme',
      classPrefix: '',
      useSimpleVisemes: false,
      intensityAttribute: 'data-intensity',
      setIntensity: true,
      visemeClassMap: null,
      ...options,
    };

    this._currentClass = null;
    this._currentViseme = null;
  }

  /**
   * Apply viseme state to the element.
   * @param {import('../analyzers/FrequencyAnalyzer.js').VisemeFrame} frame
   */
  render(frame) {
    const viseme = this.opts.useSimpleVisemes ? frame.simpleViseme : frame.viseme;

    if (viseme !== this._currentViseme) {
      // Update attribute
      this.element.setAttribute(this.opts.attribute, viseme);

      // Update CSS class
      if (this.opts.classPrefix) {
        if (this._currentClass) {
          this.element.classList.remove(this._currentClass);
        }
        const mapped = this.opts.visemeClassMap?.[viseme];
        this._currentClass = mapped || `${this.opts.classPrefix}${viseme}`;
        this.element.classList.add(this._currentClass);
      }

      this._currentViseme = viseme;
    }

    // Update intensity
    if (this.opts.setIntensity) {
      const level = Math.round(frame.intensity * 100);
      this.element.setAttribute(this.opts.intensityAttribute, level);
      this.element.style.setProperty('--lip-intensity', frame.intensity);
      this.element.style.setProperty('--lip-open', frame.shape?.open ?? 0);
      this.element.style.setProperty('--lip-width', frame.shape?.width ?? 0.5);
      this.element.style.setProperty('--lip-round', frame.shape?.round ?? 0);
    }
  }

  /** Remove classes and attributes from element. */
  destroy() {
    if (this._currentClass) {
      this.element.classList.remove(this._currentClass);
    }
    this.element.removeAttribute(this.opts.attribute);
    this.element.removeAttribute(this.opts.intensityAttribute);
    this._currentViseme = null;
  }
}
