/**
 * SVGMouthRenderer — Procedural SVG mouth animation driven by viseme shape parameters.
 *
 * Renders an animated mouth using SVG path elements, driven by the
 * {open, width, round} shape parameters from the FrequencyAnalyzer.
 *
 * No sprite sheet required — fully procedural.
 *
 * @module SVGMouthRenderer
 *
 * @example
 *   const mouth = new SVGMouthRenderer(svgContainer, {
 *     width: 120,
 *     height: 80,
 *     lipColor: '#d44',
 *     teethColor: '#fff',
 *   });
 *
 *   engine.on('viseme', (frame) => mouth.render(frame));
 */

export class SVGMouthRenderer {
  /**
   * @param {HTMLElement} container - DOM element to append the SVG into.
   * @param {Object} [options]
   * @param {number} [options.width=120]
   * @param {number} [options.height=80]
   * @param {string} [options.lipColor='#cc4444']
   * @param {string} [options.innerColor='#3a1111']
   * @param {string} [options.teethColor='#ffffff']
   * @param {boolean} [options.showTeeth=true]
   * @param {number} [options.lipThickness=3]
   */
  constructor(container, options = {}) {
    this.container = container;
    this.opts = {
      width: 120,
      height: 80,
      lipColor: '#cc4444',
      innerColor: '#3a1111',
      teethColor: '#ffffff',
      showTeeth: true,
      lipThickness: 3,
      ...options,
    };

    this._createSVG();
    this._lastShape = { open: 0, width: 0.5, round: 0 };
  }

  /** @private Create the SVG structure. */
  _createSVG() {
    const ns = 'http://www.w3.org/2000/svg';
    const { width, height } = this.opts;

    this.svg = document.createElementNS(ns, 'svg');
    this.svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    this.svg.setAttribute('width', width);
    this.svg.setAttribute('height', height);
    this.svg.style.overflow = 'visible';

    // Inner mouth (dark cavity)
    this.innerPath = document.createElementNS(ns, 'path');
    this.innerPath.setAttribute('fill', this.opts.innerColor);

    // Teeth (upper row)
    this.teethPath = document.createElementNS(ns, 'path');
    this.teethPath.setAttribute('fill', this.opts.teethColor);
    this.teethPath.setAttribute('opacity', '0.9');

    // Lip outline
    this.lipPath = document.createElementNS(ns, 'path');
    this.lipPath.setAttribute('fill', 'none');
    this.lipPath.setAttribute('stroke', this.opts.lipColor);
    this.lipPath.setAttribute('stroke-width', this.opts.lipThickness);
    this.lipPath.setAttribute('stroke-linecap', 'round');
    this.lipPath.setAttribute('stroke-linejoin', 'round');

    this.svg.appendChild(this.innerPath);
    if (this.opts.showTeeth) {
      this.svg.appendChild(this.teethPath);
    }
    this.svg.appendChild(this.lipPath);

    this.container.appendChild(this.svg);

    // Initial render (closed mouth)
    this._renderShape({ open: 0, width: 0.5, round: 0 });
  }

  /**
   * Render a viseme frame.
   * @param {import('../analyzers/FrequencyAnalyzer.js').VisemeFrame} frame
   */
  render(frame) {
    if (!frame.shape) return;
    this._renderShape(frame.shape, frame.intensity);
  }

  /**
   * Directly set mouth shape parameters.
   * @param {{open: number, width: number, round: number}} shape
   * @param {number} [intensity=0.5]
   */
  _renderShape(shape, intensity = 0.5) {
    const { width: svgW, height: svgH } = this.opts;
    const cx = svgW / 2;
    const cy = svgH / 2;

    // Map shape params to pixel dimensions
    const mouthWidth = svgW * 0.3 + svgW * 0.5 * shape.width * (1 - shape.round * 0.4);
    const mouthHeight = Math.max(1, svgH * 0.7 * shape.open);
    const cornerRadius = shape.round * mouthWidth * 0.4;

    const halfW = mouthWidth / 2;
    const halfH = mouthHeight / 2;

    // Control points for bezier curves
    const cpx = halfW * (0.6 + shape.round * 0.3); // horizontal control
    const cpy = halfH * (0.8 + shape.open * 0.2);  // vertical control

    // Upper lip path
    const upperLip = [
      `M ${cx - halfW} ${cy}`,
      `C ${cx - cpx} ${cy - cpy}, ${cx + cpx} ${cy - cpy}, ${cx + halfW} ${cy}`,
    ].join(' ');

    // Lower lip path
    const lowerLip = [
      `M ${cx - halfW} ${cy}`,
      `C ${cx - cpx} ${cy + cpy}, ${cx + cpx} ${cy + cpy}, ${cx + halfW} ${cy}`,
    ].join(' ');

    // Combined lip outline
    this.lipPath.setAttribute('d', `${upperLip} ${lowerLip}`);

    // Inner mouth (filled cavity)
    if (shape.open > 0.02) {
      const innerScale = 0.85;
      const iHalfW = halfW * innerScale;
      const iHalfH = halfH * innerScale;
      const icpx = cpx * innerScale;
      const icpy = cpy * innerScale;

      const innerD = [
        `M ${cx - iHalfW} ${cy}`,
        `C ${cx - icpx} ${cy - icpy}, ${cx + icpx} ${cy - icpy}, ${cx + iHalfW} ${cy}`,
        `C ${cx + icpx} ${cy + icpy}, ${cx - icpx} ${cy + icpy}, ${cx - iHalfW} ${cy}`,
        'Z',
      ].join(' ');
      this.innerPath.setAttribute('d', innerD);
      this.innerPath.setAttribute('opacity', Math.min(1, shape.open * 2));
    } else {
      this.innerPath.setAttribute('d', '');
      this.innerPath.setAttribute('opacity', '0');
    }

    // Teeth
    if (this.opts.showTeeth && shape.open > 0.1) {
      const teethW = halfW * 0.7;
      const teethH = Math.min(halfH * 0.3, 8);
      const teethY = cy - halfH * 0.3;
      const teethD = [
        `M ${cx - teethW} ${teethY}`,
        `Q ${cx} ${teethY + teethH}, ${cx + teethW} ${teethY}`,
        `L ${cx + teethW} ${teethY + teethH * 0.5}`,
        `Q ${cx} ${teethY + teethH * 1.3}, ${cx - teethW} ${teethY + teethH * 0.5}`,
        'Z',
      ].join(' ');
      this.teethPath.setAttribute('d', teethD);
      this.teethPath.setAttribute('opacity', Math.min(0.9, shape.open * 1.5));
    } else {
      this.teethPath.setAttribute('d', '');
      this.teethPath.setAttribute('opacity', '0');
    }

    this._lastShape = { ...shape };
  }

  /**
   * Update renderer options dynamically.
   * @param {Object} opts
   */
  updateOptions(opts) {
    Object.assign(this.opts, opts);
    if (opts.lipColor) this.lipPath.setAttribute('stroke', opts.lipColor);
    if (opts.innerColor) this.innerPath.setAttribute('fill', opts.innerColor);
    if (opts.teethColor) this.teethPath.setAttribute('fill', opts.teethColor);
    if (opts.lipThickness) this.lipPath.setAttribute('stroke-width', opts.lipThickness);
  }

  /** Remove SVG from DOM and clean up. */
  destroy() {
    this.svg?.remove();
    this.svg = null;
  }
}
