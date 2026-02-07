/**
 * TypeScript definitions for @beer-digital/lipsync-engine
 */

// ── Viseme Types ─────────────────────────────────────────────────

export type ExtendedViseme =
  | 'sil' | 'PP' | 'FF' | 'TH' | 'DD' | 'kk' | 'CH' | 'SS'
  | 'nn' | 'RR' | 'aa' | 'E' | 'I' | 'O' | 'U';

export type SimpleViseme = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export type ARPABETPhoneme =
  | 'AA' | 'AE' | 'AH' | 'AO' | 'AW' | 'AY'
  | 'B' | 'CH' | 'D' | 'DH'
  | 'EH' | 'ER' | 'EY'
  | 'F' | 'G' | 'HH'
  | 'IH' | 'IY'
  | 'JH' | 'K' | 'L' | 'M' | 'N' | 'NG'
  | 'OW' | 'OY'
  | 'P' | 'R' | 'S' | 'SH' | 'T' | 'TH'
  | 'UH' | 'UW'
  | 'V' | 'W' | 'Y' | 'Z' | 'ZH';

export interface MouthShape {
  open: number;   // 0..1 vertical opening
  width: number;  // 0..1 horizontal width
  round: number;  // 0..1 lip roundness
}

export interface VisemeFrame {
  viseme: ExtendedViseme;
  simpleViseme: SimpleViseme;
  intensity: number;
  confidence: number;
  amplitude: number;
  bands: BandEnergies;
  shape: MouthShape;
  transition: {
    from: ExtendedViseme;
    to: ExtendedViseme;
    progress: number;
  };
  frame: number;
  timeMs: number;
  bufferLevel: number;
}

export interface BandEnergies {
  sub: number;
  low: number;
  mid: number;
  high: number;
  veryHigh: number;
}

// ── Event Types ──────────────────────────────────────────────────

export interface LipSyncEngineEvents {
  initialized: () => void;
  viseme: (frame: VisemeFrame) => void;
  position: (data: PositionData) => void;
  playbackStarted: () => void;
  playbackEnded: () => void;
  bufferUnderrun: (data: { timeMs: number }) => void;
  bufferOverflow: (data: { dropped: number }) => void;
  workletReady: () => void;
  sourceAttached: (data: { type: 'stream' | 'media' | 'element' }) => void;
  analysisStarted: () => void;
  analysisStopped: () => void;
  reset: () => void;
  destroyed: () => void;
}

export interface PositionData {
  timeMs: number;
  bufferLevel: number;
  bufferMs: number;
  isPlaying: boolean;
}

// ── Engine Options ───────────────────────────────────────────────

export interface LipSyncEngineOptions {
  sampleRate?: number;
  fftSize?: number;
  analyserSmoothing?: number;
  silenceThreshold?: number;
  smoothingFactor?: number;
  holdFrames?: number;
  intensitySmoothing?: number;
  volume?: number;
  startThresholdMs?: number;
  bufferSeconds?: number;
  analysisMode?: 'raf' | 'interval';
  analysisIntervalMs?: number;
  workletUrl?: string | null;
  disablePlayback?: boolean;
}

// ── Core Classes ─────────────────────────────────────────────────

export class EventEmitter {
  on(event: string, fn: Function): () => void;
  once(event: string, fn: Function): () => void;
  off(event: string, fn: Function): void;
  emit(event: string, ...args: any[]): void;
  removeAllListeners(event?: string): void;
  listenerCount(event: string): number;
}

export class LipSyncEngine extends EventEmitter {
  constructor(options?: LipSyncEngineOptions);

  readonly audioContext: AudioContext | null;
  readonly analyserNode: AnalyserNode | null;
  readonly analyzer: FrequencyAnalyzer | null;
  readonly initialized: boolean;
  readonly analyzing: boolean;
  readonly playbackTimeMs: number;
  readonly bufferLevel: number;
  readonly inputMode: 'stream' | 'media' | 'element' | null;

  init(existingContext?: AudioContext): Promise<void>;
  feedAudio(samples: Int16Array | Float32Array | ArrayBuffer, inputSampleRate?: number): void;
  attachStream(stream: MediaStream): void;
  attachElement(element: HTMLMediaElement): void;
  startAnalysis(): void;
  stopAnalysis(): void;
  setVolume(value: number): void;
  clearBuffer(): void;
  play(): void;
  pause(): void;
  reset(): void;
  getState(): {
    initialized: boolean;
    analyzing: boolean;
    inputMode: string | null;
    playbackTimeMs: number;
    bufferLevel: number;
    sampleRate: number | undefined;
    volume: number | undefined;
  };
  destroy(): void;

  // Typed events
  on<K extends keyof LipSyncEngineEvents>(event: K, fn: LipSyncEngineEvents[K]): () => void;
  once<K extends keyof LipSyncEngineEvents>(event: K, fn: LipSyncEngineEvents[K]): () => void;
}

// ── Analyzers ────────────────────────────────────────────────────

export interface FrequencyAnalyzerOptions {
  fftSize?: number;
  silenceThreshold?: number;
  smoothingFactor?: number;
  holdFrames?: number;
  intensitySmoothing?: number;
  energySmoothing?: number;
}

export class FrequencyAnalyzer {
  constructor(analyserNode: AnalyserNode, sampleRate: number, options?: FrequencyAnalyzerOptions);
  analyze(): VisemeFrame;
  reset(): void;
}

// ── Renderers ────────────────────────────────────────────────────

export interface CanvasRendererOptions {
  spriteSheet: HTMLImageElement | string;
  frameWidth: number;
  frameHeight: number;
  visemeMap: Record<string, number>;
  columns?: number;
  offsetX?: number;
  offsetY?: number;
  scale?: number;
  clearBeforeRender?: boolean;
}

export class CanvasRenderer {
  constructor(canvas: HTMLCanvasElement, options: CanvasRendererOptions);
  render(frame: VisemeFrame): void;
  destroy(): void;
}

export interface SVGMouthRendererOptions {
  width?: number;
  height?: number;
  lipColor?: string;
  innerColor?: string;
  teethColor?: string;
  showTeeth?: boolean;
  lipThickness?: number;
}

export class SVGMouthRenderer {
  constructor(container: HTMLElement, options?: SVGMouthRendererOptions);
  render(frame: VisemeFrame): void;
  updateOptions(opts: Partial<SVGMouthRendererOptions>): void;
  destroy(): void;
}

export interface CSSClassRendererOptions {
  attribute?: string;
  classPrefix?: string;
  useSimpleVisemes?: boolean;
  intensityAttribute?: string;
  setIntensity?: boolean;
  visemeClassMap?: Record<string, string>;
}

export class CSSClassRenderer {
  constructor(element: HTMLElement, options?: CSSClassRendererOptions);
  render(frame: VisemeFrame): void;
  destroy(): void;
}

// ── Utilities ────────────────────────────────────────────────────

export class RingBuffer {
  constructor(capacity: number);
  readonly length: number;
  readonly free: number;
  readonly empty: boolean;
  readonly full: boolean;
  readonly level: number;
  write(samples: Float32Array): number;
  writeOverflow(samples: Float32Array): number;
  read(target: Float32Array, offset?: number, count?: number): number;
  readOne(): number;
  peek(count: number): Float32Array;
  clear(): void;
}

export function int16ToFloat32(int16: Int16Array): Float32Array;
export function float32ToInt16(float32: Float32Array): Int16Array;
export function base64ToInt16(base64: string): Int16Array;
export function int16ToBase64(int16: Int16Array): string;
export function calculateRMS(data: Float32Array | Uint8Array, isByte?: boolean): number;
export function zeroCrossingRate(data: Float32Array): number;
export function extractBandEnergies(
  frequencyData: Uint8Array,
  sampleRate: number,
  bands?: Array<{ name: string; min: number; max: number }>
): Record<string, number>;
export function smoothValue(current: number, target: number, factor: number): number;
export function lerp(a: number, b: number, t: number): number;
export function clamp(value: number, min: number, max: number): number;
export function resample(input: Float32Array, fromRate: number, toRate: number): Float32Array;
export function interpolateShapes(from: ExtendedViseme, to: ExtendedViseme, t: number): MouthShape;
export function getTransitionWeight(from: string, to: string): number;

// ── Constants ────────────────────────────────────────────────────

export const VERSION: string;
export const EXTENDED_VISEMES: Record<ExtendedViseme, { label: string; description: string }>;
export const EXTENDED_VISEME_KEYS: ExtendedViseme[];
export const SIMPLE_VISEMES: Record<SimpleViseme, { label: string; extendedMap: ExtendedViseme[] }>;
export const SIMPLE_VISEME_KEYS: SimpleViseme[];
export const EXTENDED_TO_SIMPLE: Record<ExtendedViseme, SimpleViseme>;
export const PHONEME_TO_VISEME: Record<ARPABETPhoneme, ExtendedViseme>;
export const ARPABET_PHONEMES: ARPABETPhoneme[];
export const VISEME_SHAPES: Record<ExtendedViseme, MouthShape>;
export const TRANSITION_WEIGHTS: Record<string, Record<string, number>>;
