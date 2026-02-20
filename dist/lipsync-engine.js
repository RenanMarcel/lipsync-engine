var __typeError = (msg) => {
  throw TypeError(msg);
};
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var _listeners;
class EventEmitter {
  constructor() {
    /** @type {Map<string, Set<Function>>} */
    __privateAdd(this, _listeners, /* @__PURE__ */ new Map());
  }
  /**
   * Subscribe to an event.
   * @param {string} event - Event name, or '*' for all events.
   * @param {Function} fn - Callback receiving (...args).
   * @returns {() => void} Unsubscribe function.
   */
  on(event, fn) {
    if (!__privateGet(this, _listeners).has(event)) {
      __privateGet(this, _listeners).set(event, /* @__PURE__ */ new Set());
    }
    __privateGet(this, _listeners).get(event).add(fn);
    return () => this.off(event, fn);
  }
  /**
   * Subscribe to an event once.
   * @param {string} event
   * @param {Function} fn
   * @returns {() => void}
   */
  once(event, fn) {
    const wrapper = (...args) => {
      this.off(event, wrapper);
      fn(...args);
    };
    wrapper._original = fn;
    return this.on(event, wrapper);
  }
  /**
   * Unsubscribe from an event.
   * @param {string} event
   * @param {Function} fn
   */
  off(event, fn) {
    const set = __privateGet(this, _listeners).get(event);
    if (!set) return;
    set.delete(fn);
    for (const listener of set) {
      if (listener._original === fn) {
        set.delete(listener);
      }
    }
    if (set.size === 0) __privateGet(this, _listeners).delete(event);
  }
  /**
   * Emit an event.
   * @param {string} event
   * @param  {...any} args
   */
  emit(event, ...args) {
    const set = __privateGet(this, _listeners).get(event);
    if (set) {
      for (const fn of set) fn(...args);
    }
    const wildcard = __privateGet(this, _listeners).get("*");
    if (wildcard) {
      for (const fn of wildcard) fn(event, ...args);
    }
  }
  /** Remove all listeners, optionally for a specific event. */
  removeAllListeners(event) {
    if (event) {
      __privateGet(this, _listeners).delete(event);
    } else {
      __privateGet(this, _listeners).clear();
    }
  }
  /** Number of listeners for an event. */
  listenerCount(event) {
    var _a;
    return ((_a = __privateGet(this, _listeners).get(event)) == null ? void 0 : _a.size) ?? 0;
  }
}
_listeners = new WeakMap();
function int16ToFloat32(int16) {
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / 32768;
  }
  return float32;
}
function float32ToInt16(float32) {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = s < 0 ? s * 32768 : s * 32767;
  }
  return int16;
}
function base64ToInt16(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Int16Array(bytes.buffer);
}
function int16ToBase64(int16) {
  const bytes = new Uint8Array(int16.buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
function calculateRMS(data, isByte = false) {
  let sumSquares = 0;
  const len = data.length;
  if (len === 0) return 0;
  for (let i = 0; i < len; i++) {
    const value = isByte ? (data[i] - 128) / 128 : data[i];
    sumSquares += value * value;
  }
  return Math.sqrt(sumSquares / len);
}
function zeroCrossingRate(data) {
  if (data.length < 2) return 0;
  let crossings = 0;
  for (let i = 1; i < data.length; i++) {
    if (data[i] >= 0 && data[i - 1] < 0 || data[i] < 0 && data[i - 1] >= 0) {
      crossings++;
    }
  }
  return crossings / (data.length - 1);
}
function extractBandEnergies(frequencyData, sampleRate, bands) {
  const defaultBands = bands || [
    { name: "sub", min: 20, max: 200 },
    // Fundamental freq, voiced sounds
    { name: "low", min: 200, max: 800 },
    // First formant region
    { name: "mid", min: 800, max: 2500 },
    // Second formant region
    { name: "high", min: 2500, max: 5500 },
    // Fricatives, sibilants
    { name: "veryHigh", min: 5500, max: 12e3 }
    // Plosive bursts, high sibilants
  ];
  const binCount = frequencyData.length;
  const nyquist = sampleRate / 2;
  const binWidth = nyquist / binCount;
  const result = {};
  for (const band of defaultBands) {
    const startBin = Math.max(0, Math.floor(band.min / binWidth));
    const endBin = Math.min(binCount - 1, Math.floor(band.max / binWidth));
    if (startBin >= endBin) {
      result[band.name] = 0;
      continue;
    }
    let sum = 0;
    let count = 0;
    for (let i = startBin; i <= endBin; i++) {
      sum += frequencyData[i] / 255;
      count++;
    }
    result[band.name] = count > 0 ? sum / count : 0;
  }
  return result;
}
function smoothValue(current, target, factor) {
  return current + (target - current) * (1 - factor);
}
function lerp(a, b, t) {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
function resample(input, fromRate, toRate) {
  if (fromRate === toRate) return input;
  const ratio = fromRate / toRate;
  const outputLength = Math.round(input.length / ratio);
  const output = new Float32Array(outputLength);
  for (let i = 0; i < outputLength; i++) {
    const srcIndex = i * ratio;
    const low = Math.floor(srcIndex);
    const high = Math.min(low + 1, input.length - 1);
    const frac = srcIndex - low;
    output[i] = input[low] * (1 - frac) + input[high] * frac;
  }
  return output;
}
const EXTENDED_VISEMES = (
  /** @type {const} */
  {
    sil: { label: "Silent", description: "Mouth closed, neutral" },
    PP: { label: "P/B/M", description: "Lips pressed together" },
    FF: { label: "F/V", description: "Lower lip to upper teeth" },
    TH: { label: "TH", description: "Tongue between teeth" },
    DD: { label: "D/T/N/L", description: "Tongue to upper palate" },
    kk: { label: "K/G", description: "Back of tongue raised" },
    CH: { label: "CH/SH/J", description: "Lips pursed forward" },
    SS: { label: "S/Z", description: "Teeth close, slight smile" },
    nn: { label: "N/NG", description: "Mouth slightly open, nasal" },
    RR: { label: "R", description: "Lips slightly rounded" },
    aa: { label: "AA/AH", description: "Wide open mouth" },
    E: { label: "EH/AE", description: "Mouth open, slight smile" },
    I: { label: "IH/IY", description: "Small opening, smile" },
    O: { label: "OH/AO", description: "Rounded, medium open" },
    U: { label: "UW/OW", description: "Small rounded opening" }
  }
);
const EXTENDED_VISEME_KEYS = Object.keys(EXTENDED_VISEMES);
const SIMPLE_VISEMES = (
  /** @type {const} */
  {
    A: { label: "Rest / M/B/P closed", extendedMap: ["sil"] },
    B: { label: "M / B / P", extendedMap: ["PP", "nn"] },
    C: { label: "EE / S / soft sounds", extendedMap: ["E", "I", "SS"] },
    D: { label: "AH / wide open", extendedMap: ["aa", "DD", "kk"] },
    E: { label: "OH / round", extendedMap: ["O", "RR", "CH"] },
    F: { label: "OO / F / V / tight", extendedMap: ["FF", "TH", "U"] }
  }
);
const SIMPLE_VISEME_KEYS = Object.keys(SIMPLE_VISEMES);
const EXTENDED_TO_SIMPLE = {};
for (const [simpleKey, def] of Object.entries(SIMPLE_VISEMES)) {
  for (const ext of def.extendedMap) {
    EXTENDED_TO_SIMPLE[ext] = simpleKey;
  }
}
const PHONEME_TO_VISEME = (
  /** @type {const} */
  {
    // Vowels
    AA: "aa",
    AE: "E",
    AH: "aa",
    AO: "O",
    AW: "aa",
    AY: "aa",
    EH: "E",
    ER: "RR",
    EY: "E",
    IH: "I",
    IY: "I",
    OW: "O",
    OY: "O",
    UH: "U",
    UW: "U",
    // Consonants
    B: "PP",
    CH: "CH",
    D: "DD",
    DH: "TH",
    F: "FF",
    G: "kk",
    HH: "aa",
    JH: "CH",
    K: "kk",
    L: "DD",
    M: "PP",
    N: "nn",
    NG: "nn",
    P: "PP",
    R: "RR",
    S: "SS",
    SH: "CH",
    T: "DD",
    TH: "TH",
    V: "FF",
    W: "U",
    Y: "I",
    Z: "SS",
    ZH: "CH"
  }
);
const ARPABET_PHONEMES = Object.keys(PHONEME_TO_VISEME);
const TRANSITION_WEIGHTS = {
  sil: { aa: 0.3, E: 0.3, I: 0.3, O: 0.3, U: 0.3, PP: 0.2, FF: 0.2 },
  aa: { sil: 0.4, E: 0.5, O: 0.6, I: 0.5, PP: 0.3, SS: 0.3 },
  PP: { aa: 0.2, sil: 0.2, E: 0.3, FF: 0.4 },
  FF: { aa: 0.3, PP: 0.4, sil: 0.2 },
  SS: { sil: 0.2, aa: 0.3, CH: 0.6 }
};
function getTransitionWeight(from, to) {
  var _a;
  return ((_a = TRANSITION_WEIGHTS[from]) == null ? void 0 : _a[to]) ?? 0.35;
}
const VISEME_SHAPES = {
  sil: { open: 0, width: 0.5, round: 0 },
  PP: { open: 0, width: 0.4, round: 0 },
  FF: { open: 0.05, width: 0.55, round: 0 },
  TH: { open: 0.1, width: 0.5, round: 0 },
  DD: { open: 0.2, width: 0.5, round: 0 },
  kk: { open: 0.25, width: 0.45, round: 0 },
  CH: { open: 0.15, width: 0.35, round: 0.6 },
  SS: { open: 0.05, width: 0.6, round: 0 },
  nn: { open: 0.15, width: 0.5, round: 0 },
  RR: { open: 0.2, width: 0.4, round: 0.4 },
  aa: { open: 0.9, width: 0.6, round: 0 },
  E: { open: 0.5, width: 0.65, round: 0 },
  I: { open: 0.25, width: 0.7, round: 0 },
  O: { open: 0.6, width: 0.4, round: 0.8 },
  U: { open: 0.2, width: 0.3, round: 0.9 }
};
function interpolateShapes(fromViseme, toViseme, t) {
  const a = VISEME_SHAPES[fromViseme] || VISEME_SHAPES.sil;
  const b = VISEME_SHAPES[toViseme] || VISEME_SHAPES.sil;
  const clampT = Math.max(0, Math.min(1, t));
  return {
    open: a.open + (b.open - a.open) * clampT,
    width: a.width + (b.width - a.width) * clampT,
    round: a.round + (b.round - a.round) * clampT
  };
}
const DEFAULTS$1 = {
  fftSize: 256,
  silenceThreshold: 0.015,
  smoothingFactor: 0.35,
  holdFrames: 2,
  // Minimum frames to hold a viseme before switching
  intensitySmoothing: 0.2,
  energySmoothing: 0.5
  // AnalyserNode smoothingTimeConstant
};
class FrequencyAnalyzer {
  /**
   * @param {AnalyserNode} analyserNode - Connected AnalyserNode.
   * @param {number} sampleRate - AudioContext sample rate.
   * @param {Object} [options]
   */
  constructor(analyserNode, sampleRate, options = {}) {
    this.analyser = analyserNode;
    this.sampleRate = sampleRate;
    this.opts = { ...DEFAULTS$1, ...options };
    this.analyser.fftSize = this.opts.fftSize;
    this.analyser.smoothingTimeConstant = this.opts.energySmoothing;
    this.timeDomainData = new Uint8Array(this.analyser.fftSize);
    this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
    this._currentViseme = "sil";
    this._currentIntensity = 0;
    this._holdCounter = 0;
    this._smoothedAmplitude = 0;
    this._smoothedBands = { sub: 0, low: 0, mid: 0, high: 0, veryHigh: 0 };
    this._previousViseme = "sil";
    this._transitionProgress = 1;
    this._frameCount = 0;
  }
  /**
   * Analyze the current audio frame and return viseme data.
   * Call this once per animation frame (~60fps) or at your desired analysis rate.
   *
   * @returns {VisemeFrame}
   */
  analyze() {
    this._frameCount++;
    this.analyser.getByteTimeDomainData(this.timeDomainData);
    this.analyser.getByteFrequencyData(this.frequencyData);
    const rawAmplitude = calculateRMS(this.timeDomainData, true);
    this._smoothedAmplitude = smoothValue(
      this._smoothedAmplitude,
      rawAmplitude,
      this.opts.smoothingFactor
    );
    const rawBands = extractBandEnergies(this.frequencyData, this.sampleRate);
    for (const key of Object.keys(rawBands)) {
      this._smoothedBands[key] = smoothValue(
        this._smoothedBands[key] || 0,
        rawBands[key],
        this.opts.smoothingFactor
      );
    }
    const bands = this._smoothedBands;
    if (this._smoothedAmplitude < this.opts.silenceThreshold) {
      return this._emitViseme("sil", 0, bands);
    }
    const intensity = clamp(this._smoothedAmplitude * 3, 0, 1);
    const { viseme, confidence } = this._classifyViseme(bands, intensity);
    if (viseme !== this._currentViseme) {
      this._holdCounter++;
      if (this._holdCounter < this.opts.holdFrames) {
        return this._emitViseme(this._currentViseme, intensity, bands);
      }
      this._holdCounter = 0;
    } else {
      this._holdCounter = 0;
    }
    return this._emitViseme(viseme, intensity, bands, confidence);
  }
  /**
   * Classify the current audio frame into a viseme.
   * @private
   */
  _classifyViseme(bands, intensity) {
    const { sub, low, mid, high, veryHigh } = bands;
    const totalEnergy = sub + low + mid + high + veryHigh;
    if (totalEnergy < 0.01) {
      return { viseme: "sil", confidence: 0.9 };
    }
    const sibilantScore = (high + veryHigh) / (totalEnergy + 1e-3);
    if (sibilantScore > 0.55 && high > 0.15) {
      if (veryHigh > high * 0.8) {
        return { viseme: "SS", confidence: sibilantScore };
      }
      return { viseme: "CH", confidence: sibilantScore * 0.85 };
    }
    const fricativeScore = (mid + high) / (totalEnergy + 1e-3);
    if (fricativeScore > 0.5 && high > 0.1 && low < 0.15) {
      return { viseme: "FF", confidence: fricativeScore * 0.8 };
    }
    const flatness = 1 - Math.abs(high - low) / (totalEnergy + 1e-3);
    if (intensity > 0.6 && flatness > 0.7 && this._smoothedAmplitude > 0.08) {
      if (low > mid) {
        return { viseme: "PP", confidence: 0.6 };
      }
      return { viseme: "DD", confidence: 0.6 };
    }
    if (sub > 0.2 && low > 0.15 && high < 0.08 && mid < low * 0.7) {
      return { viseme: "nn", confidence: 0.65 };
    }
    if (low > 0.2 && mid > 0.15 && intensity > 0.5) {
      return { viseme: "aa", confidence: 0.7 };
    }
    if (mid > low && mid > 0.15 && intensity > 0.3) {
      return { viseme: "E", confidence: 0.65 };
    }
    if (sub > mid && low > mid && intensity > 0.3) {
      return { viseme: "O", confidence: 0.6 };
    }
    if (mid > 0.1 && high > low * 0.5 && intensity > 0.2) {
      return { viseme: "I", confidence: 0.55 };
    }
    if (sub > 0.15 && high < 0.05) {
      return { viseme: "U", confidence: 0.5 };
    }
    if (intensity > 0.5) return { viseme: "aa", confidence: 0.4 };
    if (intensity > 0.3) return { viseme: "E", confidence: 0.35 };
    if (intensity > 0.15) return { viseme: "I", confidence: 0.3 };
    return { viseme: "sil", confidence: 0.5 };
  }
  /**
   * Build and return the viseme frame, updating transitions.
   * @private
   */
  _emitViseme(viseme, intensity, bands, confidence = 0.5) {
    if (viseme !== this._currentViseme) {
      this._previousViseme = this._currentViseme;
      this._currentViseme = viseme;
      this._transitionProgress = 0;
    } else {
      const weight = getTransitionWeight(this._previousViseme, this._currentViseme);
      this._transitionProgress = Math.min(1, this._transitionProgress + (1 - weight) * 0.3);
    }
    this._currentIntensity = smoothValue(
      this._currentIntensity,
      intensity,
      this.opts.intensitySmoothing
    );
    const prevShape = VISEME_SHAPES[this._previousViseme] || VISEME_SHAPES.sil;
    const currShape = VISEME_SHAPES[this._currentViseme] || VISEME_SHAPES.sil;
    const t = this._transitionProgress;
    return {
      viseme: this._currentViseme,
      simpleViseme: EXTENDED_TO_SIMPLE[this._currentViseme] || "A",
      intensity: this._currentIntensity,
      confidence,
      amplitude: this._smoothedAmplitude,
      bands: { ...this._smoothedBands },
      shape: {
        open: prevShape.open + (currShape.open - prevShape.open) * t,
        width: prevShape.width + (currShape.width - prevShape.width) * t,
        round: prevShape.round + (currShape.round - prevShape.round) * t
      },
      transition: {
        from: this._previousViseme,
        to: this._currentViseme,
        progress: this._transitionProgress
      },
      frame: this._frameCount
    };
  }
  /** Reset analyzer state. */
  reset() {
    this._currentViseme = "sil";
    this._currentIntensity = 0;
    this._holdCounter = 0;
    this._smoothedAmplitude = 0;
    this._smoothedBands = { sub: 0, low: 0, mid: 0, high: 0, veryHigh: 0 };
    this._previousViseme = "sil";
    this._transitionProgress = 1;
    this._frameCount = 0;
  }
}
const DEFAULTS = {
  // Audio pipeline
  sampleRate: 24e3,
  // Expected input sample rate
  fftSize: 256,
  // FFT window size (power of 2)
  analyserSmoothing: 0.5,
  // AnalyserNode smoothingTimeConstant
  // Viseme detection
  silenceThreshold: 0.015,
  // RMS below this = silence
  smoothingFactor: 0.35,
  // Viseme transition smoothing (0-1)
  holdFrames: 2,
  // Min frames before viseme switch
  intensitySmoothing: 0.2,
  // Intensity EMA factor
  // Playback
  volume: 1,
  startThresholdMs: 50,
  // Buffer ms before auto-play
  bufferSeconds: 5,
  // Ring buffer capacity
  // Analysis timing
  analysisMode: "raf",
  // 'raf' (requestAnimationFrame) or 'interval'
  analysisIntervalMs: 16,
  // Only used when analysisMode = 'interval'
  // Worklet
  workletUrl: null,
  // Custom worklet URL (auto-detected if null)
  disablePlayback: false
  // If true, analyze only (no audio output)
};
class LipSyncEngine extends EventEmitter {
  /**
   * @param {Partial<typeof DEFAULTS>} options
   */
  constructor(options = {}) {
    super();
    this.opts = { ...DEFAULTS, ...options };
    this.audioContext = null;
    this.workletNode = null;
    this.analyserNode = null;
    this.gainNode = null;
    this.analyzer = null;
    this._mediaSource = null;
    this._elementSource = null;
    this._initialized = false;
    this._analyzing = false;
    this._animFrameId = null;
    this._intervalId = null;
    this._inputMode = null;
    this._playbackTimeMs = 0;
    this._bufferLevel = 0;
    this._destroyed = false;
  }
  // ════════════════════════════════════════════════════════════════
  //  INITIALIZATION
  // ════════════════════════════════════════════════════════════════
  /**
   * Initialize the audio pipeline. Must be called after a user gesture (browser policy).
   * @param {AudioContext} [existingContext] - Optionally reuse an existing AudioContext.
   * @returns {Promise<void>}
   */
  async init(existingContext) {
    if (this._initialized) return;
    if (this._destroyed) throw new Error("Engine has been destroyed");
    this.audioContext = existingContext || new AudioContext({
      sampleRate: this.opts.sampleRate
    });
    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }
    const workletUrl = this.opts.workletUrl || this._resolveWorkletUrl();
    await this.audioContext.audioWorklet.addModule(workletUrl);
    this.workletNode = new AudioWorkletNode(
      this.audioContext,
      "streaming-processor",
      {
        processorOptions: {
          sampleRate: this.opts.sampleRate,
          bufferSeconds: this.opts.bufferSeconds,
          startThresholdMs: this.opts.startThresholdMs
        }
      }
    );
    this.analyserNode = this.audioContext.createAnalyser();
    this.analyserNode.fftSize = this.opts.fftSize;
    this.analyserNode.smoothingTimeConstant = this.opts.analyserSmoothing;
    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = this.opts.volume;
    this.workletNode.connect(this.analyserNode);
    if (!this.opts.disablePlayback) {
      this.analyserNode.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);
    }
    this.analyzer = new FrequencyAnalyzer(
      this.analyserNode,
      this.audioContext.sampleRate,
      {
        fftSize: this.opts.fftSize,
        silenceThreshold: this.opts.silenceThreshold,
        smoothingFactor: this.opts.smoothingFactor,
        holdFrames: this.opts.holdFrames,
        intensitySmoothing: this.opts.intensitySmoothing
      }
    );
    this.workletNode.port.onmessage = (e) => this._onWorkletMessage(e.data);
    this._initialized = true;
    this._inputMode = "stream";
    this.emit("initialized");
  }
  /**
   * Try to resolve the worklet URL automatically.
   * @private
   */
  _resolveWorkletUrl() {
    const candidates = [
      "./streaming-processor.js",
      "./worklet/streaming-processor.js",
      "./dist/worklet/streaming-processor.js",
      "/streaming-processor.js"
    ];
    return candidates[0];
  }
  // ════════════════════════════════════════════════════════════════
  //  INPUT SOURCES
  // ════════════════════════════════════════════════════════════════
  /**
   * Feed PCM audio chunks for streaming playback + analysis.
   * This is the primary method for TTS API integration.
   *
   * @param {Int16Array|Float32Array|ArrayBuffer} samples - Audio samples.
   * @param {number} [inputSampleRate] - Override sample rate for this chunk.
   */
  feedAudio(samples, inputSampleRate) {
    this._ensureInitialized();
    let float32;
    if (samples instanceof Int16Array) {
      float32 = int16ToFloat32(samples);
    } else if (samples instanceof Float32Array) {
      float32 = samples;
    } else if (samples instanceof ArrayBuffer) {
      float32 = int16ToFloat32(new Int16Array(samples));
    } else if (ArrayBuffer.isView(samples)) {
      float32 = int16ToFloat32(new Int16Array(samples.buffer));
    } else {
      throw new TypeError("feedAudio expects Int16Array, Float32Array, or ArrayBuffer");
    }
    const srcRate = inputSampleRate || this.opts.sampleRate;
    if (srcRate !== this.audioContext.sampleRate) {
      float32 = resample(float32, srcRate, this.audioContext.sampleRate);
    }
    this.workletNode.port.postMessage(
      { type: "audio", samples: float32 },
      [float32.buffer]
      // Transfer ownership for zero-copy
    );
  }
  /**
   * Attach a MediaStream (e.g., microphone) for analysis.
   * Audio is analyzed but NOT played back (to avoid feedback).
   *
   * @param {MediaStream} stream
   */
  attachStream(stream) {
    this._ensureInitialized();
    this._disconnectSources();
    this._mediaSource = this.audioContext.createMediaStreamSource(stream);
    this._mediaSource.connect(this.analyserNode);
    this._inputMode = "media";
    this.emit("sourceAttached", { type: "stream" });
  }
  /**
   * Attach an HTML audio/video element for analysis.
   *
   * @param {HTMLMediaElement} element
   */
  attachElement(element) {
    this._ensureInitialized();
    this._disconnectSources();
    this._elementSource = this.audioContext.createMediaElementSource(element);
    this._elementSource.connect(this.analyserNode);
    this.analyserNode.connect(this.audioContext.destination);
    this._inputMode = "element";
    this.emit("sourceAttached", { type: "element" });
  }
  /**
   * Disconnect any attached media sources.
   * @private
   */
  _disconnectSources() {
    if (this._mediaSource) {
      try {
        this._mediaSource.disconnect();
      } catch {
      }
      this._mediaSource = null;
    }
    if (this._elementSource) {
      try {
        this._elementSource.disconnect();
      } catch {
      }
      this._elementSource = null;
    }
  }
  // ════════════════════════════════════════════════════════════════
  //  ANALYSIS LOOP
  // ════════════════════════════════════════════════════════════════
  /**
   * Start the viseme analysis loop.
   * Emits 'viseme' events at the configured rate.
   */
  startAnalysis() {
    if (this._analyzing) return;
    this._ensureInitialized();
    this._analyzing = true;
    if (this.opts.analysisMode === "raf") {
      this._startRAFLoop();
    } else {
      this._startIntervalLoop();
    }
    this.emit("analysisStarted");
  }
  /** Stop the viseme analysis loop. */
  stopAnalysis() {
    this._analyzing = false;
    if (this._animFrameId !== null) {
      cancelAnimationFrame(this._animFrameId);
      this._animFrameId = null;
    }
    if (this._intervalId !== null) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
    this.emit("analysisStopped");
  }
  /** @private */
  _startRAFLoop() {
    const tick = () => {
      if (!this._analyzing) return;
      this._analyzeFrame();
      this._animFrameId = requestAnimationFrame(tick);
    };
    this._animFrameId = requestAnimationFrame(tick);
  }
  /** @private */
  _startIntervalLoop() {
    this._intervalId = setInterval(() => {
      if (!this._analyzing) return;
      this._analyzeFrame();
    }, this.opts.analysisIntervalMs);
  }
  /** @private */
  _analyzeFrame() {
    const frame = this.analyzer.analyze();
    frame.timeMs = this._playbackTimeMs;
    frame.bufferLevel = this._bufferLevel;
    this.emit("viseme", frame);
  }
  // ════════════════════════════════════════════════════════════════
  //  WORKLET COMMUNICATION
  // ════════════════════════════════════════════════════════════════
  /** @private */
  _onWorkletMessage(data) {
    switch (data.type) {
      case "position":
        this._playbackTimeMs = data.timeMs;
        this._bufferLevel = data.bufferLevel;
        this.emit("position", {
          timeMs: data.timeMs,
          bufferLevel: data.bufferLevel,
          bufferMs: data.bufferMs,
          isPlaying: data.isPlaying
        });
        break;
      case "playbackStarted":
        this.emit("playbackStarted");
        break;
      case "playbackEnded":
        this.emit("playbackEnded");
        break;
      case "bufferUnderrun":
        this.emit("bufferUnderrun", { timeMs: data.timeMs });
        break;
      case "bufferOverflow":
        this.emit("bufferOverflow", { dropped: data.dropped });
        break;
      case "ready":
        this.emit("workletReady");
        break;
    }
  }
  // ════════════════════════════════════════════════════════════════
  //  CONTROLS
  // ════════════════════════════════════════════════════════════════
  /**
   * Set playback volume.
   * @param {number} value - Volume [0, 1].
   */
  setVolume(value) {
    var _a;
    const v = Math.max(0, Math.min(1, value));
    if (this.gainNode) {
      this.gainNode.gain.setTargetAtTime(v, this.audioContext.currentTime, 0.02);
    }
    (_a = this.workletNode) == null ? void 0 : _a.port.postMessage({ type: "setVolume", value: v });
  }
  /** Clear the audio buffer (stops playback of buffered audio). */
  clearBuffer() {
    var _a;
    (_a = this.workletNode) == null ? void 0 : _a.port.postMessage({ type: "clear" });
  }
  /** Start playback (if paused). */
  play() {
    var _a;
    (_a = this.workletNode) == null ? void 0 : _a.port.postMessage({ type: "start" });
  }
  /** Pause playback. */
  pause() {
    var _a;
    (_a = this.workletNode) == null ? void 0 : _a.port.postMessage({ type: "stop" });
  }
  /** Reset all state (buffer, position, analyzer). */
  reset() {
    var _a, _b;
    (_a = this.workletNode) == null ? void 0 : _a.port.postMessage({ type: "reset" });
    (_b = this.analyzer) == null ? void 0 : _b.reset();
    this._playbackTimeMs = 0;
    this._bufferLevel = 0;
    this.emit("reset");
  }
  // ════════════════════════════════════════════════════════════════
  //  STATE QUERIES
  // ════════════════════════════════════════════════════════════════
  /** Whether the engine has been initialized. */
  get initialized() {
    return this._initialized;
  }
  /** Whether analysis is currently running. */
  get analyzing() {
    return this._analyzing;
  }
  /** Current playback position in milliseconds. */
  get playbackTimeMs() {
    return this._playbackTimeMs;
  }
  /** Current buffer fill level (0..1). */
  get bufferLevel() {
    return this._bufferLevel;
  }
  /** Current input mode: 'stream', 'media', or 'element'. */
  get inputMode() {
    return this._inputMode;
  }
  /**
   * Get a snapshot of current engine state.
   * @returns {Object}
   */
  getState() {
    var _a, _b;
    return {
      initialized: this._initialized,
      analyzing: this._analyzing,
      inputMode: this._inputMode,
      playbackTimeMs: this._playbackTimeMs,
      bufferLevel: this._bufferLevel,
      sampleRate: (_a = this.audioContext) == null ? void 0 : _a.sampleRate,
      volume: (_b = this.gainNode) == null ? void 0 : _b.gain.value
    };
  }
  // ════════════════════════════════════════════════════════════════
  //  LIFECYCLE
  // ════════════════════════════════════════════════════════════════
  /**
   * Destroy the engine and release all resources.
   */
  destroy() {
    var _a, _b, _c, _d, _e;
    if (this._destroyed) return;
    this._destroyed = true;
    this.stopAnalysis();
    this._disconnectSources();
    try {
      (_a = this.workletNode) == null ? void 0 : _a.disconnect();
    } catch {
    }
    try {
      (_b = this.analyserNode) == null ? void 0 : _b.disconnect();
    } catch {
    }
    try {
      (_c = this.gainNode) == null ? void 0 : _c.disconnect();
    } catch {
    }
    if (((_d = this.audioContext) == null ? void 0 : _d.state) !== "closed") {
      (_e = this.audioContext) == null ? void 0 : _e.close().catch(() => {
      });
    }
    this.workletNode = null;
    this.analyserNode = null;
    this.gainNode = null;
    this.analyzer = null;
    this.audioContext = null;
    this._initialized = false;
    this.removeAllListeners();
    this.emit("destroyed");
  }
  /** @private */
  _ensureInitialized() {
    if (!this._initialized) {
      throw new Error("LipSyncEngine not initialized. Call init() first.");
    }
  }
}
class SVGMouthRenderer {
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
      lipColor: "#cc4444",
      innerColor: "#3a1111",
      teethColor: "#ffffff",
      showTeeth: true,
      lipThickness: 3,
      ...options
    };
    this._createSVG();
    this._lastShape = { open: 0, width: 0.5, round: 0 };
  }
  /** @private Create the SVG structure. */
  _createSVG() {
    const ns = "http://www.w3.org/2000/svg";
    const { width, height } = this.opts;
    this.svg = document.createElementNS(ns, "svg");
    this.svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    this.svg.setAttribute("width", width);
    this.svg.setAttribute("height", height);
    this.svg.style.overflow = "visible";
    this.innerPath = document.createElementNS(ns, "path");
    this.innerPath.setAttribute("fill", this.opts.innerColor);
    this.teethPath = document.createElementNS(ns, "path");
    this.teethPath.setAttribute("fill", this.opts.teethColor);
    this.teethPath.setAttribute("opacity", "0.9");
    this.lipPath = document.createElementNS(ns, "path");
    this.lipPath.setAttribute("fill", "none");
    this.lipPath.setAttribute("stroke", this.opts.lipColor);
    this.lipPath.setAttribute("stroke-width", this.opts.lipThickness);
    this.lipPath.setAttribute("stroke-linecap", "round");
    this.lipPath.setAttribute("stroke-linejoin", "round");
    this.svg.appendChild(this.innerPath);
    if (this.opts.showTeeth) {
      this.svg.appendChild(this.teethPath);
    }
    this.svg.appendChild(this.lipPath);
    this.container.appendChild(this.svg);
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
    const mouthWidth = svgW * 0.3 + svgW * 0.5 * shape.width * (1 - shape.round * 0.4);
    const mouthHeight = Math.max(1, svgH * 0.7 * shape.open);
    shape.round * mouthWidth * 0.4;
    const halfW = mouthWidth / 2;
    const halfH = mouthHeight / 2;
    const cpx = halfW * (0.6 + shape.round * 0.3);
    const cpy = halfH * (0.8 + shape.open * 0.2);
    const upperLip = [
      `M ${cx - halfW} ${cy}`,
      `C ${cx - cpx} ${cy - cpy}, ${cx + cpx} ${cy - cpy}, ${cx + halfW} ${cy}`
    ].join(" ");
    const lowerLip = [
      `M ${cx - halfW} ${cy}`,
      `C ${cx - cpx} ${cy + cpy}, ${cx + cpx} ${cy + cpy}, ${cx + halfW} ${cy}`
    ].join(" ");
    this.lipPath.setAttribute("d", `${upperLip} ${lowerLip}`);
    if (shape.open > 0.02) {
      const innerScale = 0.85;
      const iHalfW = halfW * innerScale;
      const icpx = cpx * innerScale;
      const icpy = cpy * innerScale;
      const innerD = [
        `M ${cx - iHalfW} ${cy}`,
        `C ${cx - icpx} ${cy - icpy}, ${cx + icpx} ${cy - icpy}, ${cx + iHalfW} ${cy}`,
        `C ${cx + icpx} ${cy + icpy}, ${cx - icpx} ${cy + icpy}, ${cx - iHalfW} ${cy}`,
        "Z"
      ].join(" ");
      this.innerPath.setAttribute("d", innerD);
      this.innerPath.setAttribute("opacity", Math.min(1, shape.open * 2));
    } else {
      this.innerPath.setAttribute("d", "");
      this.innerPath.setAttribute("opacity", "0");
    }
    if (this.opts.showTeeth && shape.open > 0.1) {
      const teethW = halfW * 0.7;
      const teethH = Math.min(halfH * 0.3, 8);
      const teethY = cy - halfH * 0.3;
      const teethD = [
        `M ${cx - teethW} ${teethY}`,
        `Q ${cx} ${teethY + teethH}, ${cx + teethW} ${teethY}`,
        `L ${cx + teethW} ${teethY + teethH * 0.5}`,
        `Q ${cx} ${teethY + teethH * 1.3}, ${cx - teethW} ${teethY + teethH * 0.5}`,
        "Z"
      ].join(" ");
      this.teethPath.setAttribute("d", teethD);
      this.teethPath.setAttribute("opacity", Math.min(0.9, shape.open * 1.5));
    } else {
      this.teethPath.setAttribute("d", "");
      this.teethPath.setAttribute("opacity", "0");
    }
    this._lastShape = { ...shape };
  }
  /**
   * Update renderer options dynamically.
   * @param {Object} opts
   */
  updateOptions(opts) {
    Object.assign(this.opts, opts);
    if (opts.lipColor) this.lipPath.setAttribute("stroke", opts.lipColor);
    if (opts.innerColor) this.innerPath.setAttribute("fill", opts.innerColor);
    if (opts.teethColor) this.teethPath.setAttribute("fill", opts.teethColor);
    if (opts.lipThickness) this.lipPath.setAttribute("stroke-width", opts.lipThickness);
  }
  /** Remove SVG from DOM and clean up. */
  destroy() {
    var _a;
    (_a = this.svg) == null ? void 0 : _a.remove();
    this.svg = null;
  }
}
class CanvasRenderer {
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
    this.ctx = canvas.getContext("2d");
    this.opts = {
      offsetX: 0,
      offsetY: 0,
      scale: 1,
      clearBeforeRender: true,
      ...options
    };
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
    } else if (typeof source === "string") {
      this.spriteSheet = new Image();
      this.spriteSheet.src = source;
      await new Promise((resolve, reject) => {
        this.spriteSheet.onload = resolve;
        this.spriteSheet.onerror = reject;
      });
      this._ready = true;
    }
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
      sx,
      sy,
      this.opts.frameWidth,
      this.opts.frameHeight,
      this.opts.offsetX,
      this.opts.offsetY,
      dw,
      dh
    );
  }
  /** Destroy and release canvas reference. */
  destroy() {
    this.spriteSheet = null;
    this._ready = false;
  }
}
class CSSClassRenderer {
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
      attribute: "data-viseme",
      classPrefix: "",
      useSimpleVisemes: false,
      intensityAttribute: "data-intensity",
      setIntensity: true,
      visemeClassMap: null,
      ...options
    };
    this._currentClass = null;
    this._currentViseme = null;
  }
  /**
   * Apply viseme state to the element.
   * @param {import('../analyzers/FrequencyAnalyzer.js').VisemeFrame} frame
   */
  render(frame) {
    var _a, _b, _c, _d;
    const viseme = this.opts.useSimpleVisemes ? frame.simpleViseme : frame.viseme;
    if (viseme !== this._currentViseme) {
      this.element.setAttribute(this.opts.attribute, viseme);
      if (this.opts.classPrefix) {
        if (this._currentClass) {
          this.element.classList.remove(this._currentClass);
        }
        const mapped = (_a = this.opts.visemeClassMap) == null ? void 0 : _a[viseme];
        this._currentClass = mapped || `${this.opts.classPrefix}${viseme}`;
        this.element.classList.add(this._currentClass);
      }
      this._currentViseme = viseme;
    }
    if (this.opts.setIntensity) {
      const level = Math.round(frame.intensity * 100);
      this.element.setAttribute(this.opts.intensityAttribute, level);
      this.element.style.setProperty("--lip-intensity", frame.intensity);
      this.element.style.setProperty("--lip-open", ((_b = frame.shape) == null ? void 0 : _b.open) ?? 0);
      this.element.style.setProperty("--lip-width", ((_c = frame.shape) == null ? void 0 : _c.width) ?? 0.5);
      this.element.style.setProperty("--lip-round", ((_d = frame.shape) == null ? void 0 : _d.round) ?? 0);
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
class RingBuffer {
  /**
   * @param {number} capacity - Maximum number of Float32 samples.
   */
  constructor(capacity) {
    this.buffer = new Float32Array(capacity);
    this.capacity = capacity;
    this.readPtr = 0;
    this.writePtr = 0;
    this.available = 0;
  }
  /** Number of samples that can be read. */
  get length() {
    return this.available;
  }
  /** Number of samples that can be written before overflow. */
  get free() {
    return this.capacity - this.available;
  }
  /** Whether the buffer is completely empty. */
  get empty() {
    return this.available === 0;
  }
  /** Whether the buffer is completely full. */
  get full() {
    return this.available === this.capacity;
  }
  /** Fill level as a fraction 0..1. */
  get level() {
    return this.available / this.capacity;
  }
  /**
   * Write samples into the buffer.
   * @param {Float32Array} samples
   * @returns {number} Number of samples actually written.
   */
  write(samples) {
    const toWrite = Math.min(samples.length, this.free);
    for (let i = 0; i < toWrite; i++) {
      this.buffer[this.writePtr] = samples[i];
      this.writePtr = (this.writePtr + 1) % this.capacity;
    }
    this.available += toWrite;
    return toWrite;
  }
  /**
   * Write samples, overwriting oldest data if full.
   * @param {Float32Array} samples
   * @returns {number} Number of samples overwritten.
   */
  writeOverflow(samples) {
    let overwritten = 0;
    for (let i = 0; i < samples.length; i++) {
      if (this.available >= this.capacity) {
        this.readPtr = (this.readPtr + 1) % this.capacity;
        overwritten++;
      } else {
        this.available++;
      }
      this.buffer[this.writePtr] = samples[i];
      this.writePtr = (this.writePtr + 1) % this.capacity;
    }
    return overwritten;
  }
  /**
   * Read samples from the buffer into the target array.
   * @param {Float32Array} target - Destination array.
   * @param {number} [offset=0] - Starting offset in target.
   * @param {number} [count] - Samples to read (defaults to target.length - offset).
   * @returns {number} Number of samples actually read.
   */
  read(target, offset = 0, count) {
    const toRead = Math.min(count ?? target.length - offset, this.available);
    for (let i = 0; i < toRead; i++) {
      target[offset + i] = this.buffer[this.readPtr];
      this.readPtr = (this.readPtr + 1) % this.capacity;
    }
    this.available -= toRead;
    return toRead;
  }
  /**
   * Read a single sample. Returns 0 if empty.
   * @returns {number}
   */
  readOne() {
    if (this.available === 0) return 0;
    const sample = this.buffer[this.readPtr];
    this.readPtr = (this.readPtr + 1) % this.capacity;
    this.available--;
    return sample;
  }
  /**
   * Peek at samples without consuming them.
   * @param {number} count
   * @returns {Float32Array}
   */
  peek(count) {
    const n = Math.min(count, this.available);
    const result = new Float32Array(n);
    let ptr = this.readPtr;
    for (let i = 0; i < n; i++) {
      result[i] = this.buffer[ptr];
      ptr = (ptr + 1) % this.capacity;
    }
    return result;
  }
  /** Discard all data. */
  clear() {
    this.readPtr = 0;
    this.writePtr = 0;
    this.available = 0;
  }
}
const VERSION = "1.0.0";
export {
  ARPABET_PHONEMES,
  CSSClassRenderer,
  CanvasRenderer,
  EXTENDED_TO_SIMPLE,
  EXTENDED_VISEMES,
  EXTENDED_VISEME_KEYS,
  EventEmitter,
  FrequencyAnalyzer,
  LipSyncEngine,
  PHONEME_TO_VISEME,
  RingBuffer,
  SIMPLE_VISEMES,
  SIMPLE_VISEME_KEYS,
  SVGMouthRenderer,
  TRANSITION_WEIGHTS,
  VERSION,
  VISEME_SHAPES,
  base64ToInt16,
  calculateRMS,
  clamp,
  extractBandEnergies,
  float32ToInt16,
  getTransitionWeight,
  int16ToBase64,
  int16ToFloat32,
  interpolateShapes,
  lerp,
  resample,
  smoothValue,
  zeroCrossingRate
};
//# sourceMappingURL=lipsync-engine.js.map
