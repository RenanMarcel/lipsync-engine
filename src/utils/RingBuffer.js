/**
 * Lock-free ring buffer for Float32 audio samples.
 * Designed for use inside an AudioWorkletProcessor where
 * allocations must be avoided in the process() hot path.
 *
 * @module RingBuffer
 */
export class RingBuffer {
  /**
   * @param {number} capacity - Maximum number of Float32 samples.
   */
  constructor(capacity) {
    /** @type {Float32Array} */
    this.buffer = new Float32Array(capacity);
    /** @type {number} */
    this.capacity = capacity;
    /** @type {number} */
    this.readPtr = 0;
    /** @type {number} */
    this.writePtr = 0;
    /** @type {number} */
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
        // Overwrite oldest
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
    const toRead = Math.min(count ?? (target.length - offset), this.available);
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
