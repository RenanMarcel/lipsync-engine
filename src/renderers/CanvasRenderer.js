/**
 * CanvasRenderer — Renders lip-sync visemes using a sprite sheet on Canvas 2D.
 *
 * Expects a sprite sheet image where each viseme is a fixed-size frame
 * arranged in a grid or strip.
 *
 * @module CanvasRenderer
 *
 * @example
 *   const renderer = new CanvasRenderer(canvas, {
 *     spriteSheet: mouthSprites,       // Image or URL
 *     frameWidth: 128,
 *     frameHeight: 128,
 *     visemeMap: { sil: 0, PP: 1, FF: 2, ... }
 *   });
 *
 *   engine.on('viseme', (frame) => renderer.render(frame));
 */

export class CanvasRenderer {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {Object} options
   * @param {HTMLImageElement|string} options.spriteSheet - Sprite sheet image or URL.
   * @param {number} options.frameWidth - Width of each frame in the sprite sheet.
   * @param {number} options.frameHeight - Height of each frame.
   * @param {Object<string, number>} options.visemeMap - Maps viseme keys to frame indices.
   * @param {number} [options.columns] - Columns in sprite sheet (auto-calculated if omitted).
   * @param {number} [options.offsetX=0] - X offset for rendering on canvas.
   * @param {number} [options.offsetY=0] - Y offset for rendering on canvas.
   * @param {number} [options.scale=1] - Render scale.
   * @param {boolean} [options.clearBeforeRender=true]
   */
  constructor(canvas, options) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.opts = {
      offsetX: 0,
      offsetY: 0,
      scale: 1,
      clearBeforeRender: true,
      ...options,
    };

    /** @type {HTMLImageElement|null} */
    this.spriteSheet = null;
    this._ready = false;
    this._currentFrame = 0;
    this._targetFrame = 0;
    this._blendProgress = 1;

    this._loadSpriteSheet(options.spriteSheet);
  }

  /** @private */
  async _loadSpriteSheet(source) {
    if (source instanceof HTMLImageElement) {
      this.spriteSheet = source;
      if (source.complete) {
        this._ready = true;
      } else {
        await new Promise((resolve) => {
          source.onload = resolve;
        });
        this._ready = true;
      }
    } else if (typeof source === 'string') {
      this.spriteSheet = new Image();
      this.spriteSheet.src = source;
      await new Promise((resolve, reject) => {
        this.spriteSheet.onload = resolve;
        this.spriteSheet.onerror = reject;
      });
      this._ready = true;
    }

    // Auto-detect columns
    if (!this.opts.columns && this.spriteSheet) {
      this.opts.columns = Math.floor(
        this.spriteSheet.naturalWidth / this.opts.frameWidth
      );
    }
  }

  /**
   * Render a viseme frame to the canvas.
   * @param {import('../analyzers/FrequencyAnalyzer.js').VisemeFrame} frame
   */
  render(frame) {
    if (!this._ready || !this.spriteSheet) return;

    const frameIndex = this.opts.visemeMap[frame.viseme] ?? this.opts.visemeMap.sil ?? 0;
    const cols = this.opts.columns || 1;
    const row = Math.floor(frameIndex / cols);
    const col = frameIndex % cols;

    const sx = col * this.opts.frameWidth;
    const sy = row * this.opts.frameHeight;

    if (this.opts.clearBeforeRender) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    const dw = this.opts.frameWidth * this.opts.scale;
    const dh = this.opts.frameHeight * this.opts.scale;

    this.ctx.drawImage(
      this.spriteSheet,
      sx, sy, this.opts.frameWidth, this.opts.frameHeight,
      this.opts.offsetX, this.opts.offsetY, dw, dh
    );
  }

  /** Destroy and release canvas reference. */
  destroy() {
    this.spriteSheet = null;
    this._ready = false;
  }
}
