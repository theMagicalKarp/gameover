// Shared between the main thread (speakers.ts) and the audio thread
// (nes-audio-processor.ts). Kept in its own module so the worklet doesn't have
// to import anything that touches the window, and vice versa.

export const PROCESSOR_NAME = "nes-audio";

/** Main thread -> worklet: one Float32Array of samples per channel. */
export type SampleMessage = [left: Float32Array, right: Float32Array];

/** Worklet -> main thread: total samples output or dropped so far. */
export type RetiredMessage = number;
