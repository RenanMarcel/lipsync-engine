/**
 * @beer-digital/lipsync-engine
 *
 * Production-grade, renderer-agnostic streaming lip-sync engine for
 * browser-based 2D animation. Real-time viseme detection from streaming
 * audio via AudioWorklet + Web Audio API.
 *
 * @example
 *   import {
 *     LipSyncEngine,
 *     SVGMouthRenderer,
 *     base64ToInt16,
 *   } from '@beer-digital/lipsync-engine';
 *
 *   const engine = new LipSyncEngine({ sampleRate: 24000 });
 *   const mouth = new SVGMouthRenderer(document.getElementById('mouth'));
 *
 *   await engine.init();
 *   engine.on('viseme', (frame) => mouth.render(frame));
 *   engine.startAnalysis();
 *
 *   // Feed audio from TTS API
 *   engine.feedAudio(base64ToInt16(audioChunk));
 *
 * @module @beer-digital/lipsync-engine
 */

// ── Core ─────────────────────────────────────────────────────────
export { LipSyncEngine } from './core/LipSyncEngine.js';

// ── Analyzers ────────────────────────────────────────────────────
export { FrequencyAnalyzer } from './analyzers/FrequencyAnalyzer.js';

// ── Renderers ────────────────────────────────────────────────────
export { SVGMouthRenderer } from './renderers/SVGMouthRenderer.js';
export { CanvasRenderer } from './renderers/CanvasRenderer.js';
export { CSSClassRenderer } from './renderers/CSSClassRenderer.js';

// ── Viseme data ──────────────────────────────────────────────────
export {
  EXTENDED_VISEMES,
  EXTENDED_VISEME_KEYS,
  SIMPLE_VISEMES,
  SIMPLE_VISEME_KEYS,
  EXTENDED_TO_SIMPLE,
  PHONEME_TO_VISEME,
  ARPABET_PHONEMES,
  VISEME_SHAPES,
  TRANSITION_WEIGHTS,
  getTransitionWeight,
  interpolateShapes,
} from './core/visemes.js';

// ── Utilities ────────────────────────────────────────────────────
export {
  int16ToFloat32,
  float32ToInt16,
  base64ToInt16,
  int16ToBase64,
  calculateRMS,
  zeroCrossingRate,
  extractBandEnergies,
  smoothValue,
  lerp,
  clamp,
  resample,
} from './utils/audio-utils.js';

export { EventEmitter } from './utils/EventEmitter.js';
export { RingBuffer } from './utils/RingBuffer.js';

// ── Version ──────────────────────────────────────────────────────
export const VERSION = '1.0.0';
