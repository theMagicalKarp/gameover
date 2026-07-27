// The audio-thread half of the audio path. Vite bundles this separately and
// hands speakers.ts a URL for it; see the ?worker&url import there.
//
// It holds a ring buffer that the main thread pushes into and the audio thread
// drains one render quantum at a time, and it reports back how many samples it
// has retired -- which is what main.ts uses as its clock.
import { PROCESSOR_NAME } from "./audio-protocol";
import type { SampleMessage } from "./audio-protocol";

// A worklet runs in AudioWorkletGlobalScope, not the window, and TypeScript's
// DOM lib doesn't describe that global. These are the parts used here.
declare abstract class AudioWorkletProcessor {
  readonly port: MessagePort;
  abstract process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>,
  ): boolean;
}

declare const registerProcessor: (
  name: string,
  processor: new () => AudioWorkletProcessor,
) => void;

/** ~170ms at 48kHz. Only ever a fraction full; the headroom is for bursts. */
const CAPACITY = 8192;

/** How often to report progress back, in samples. Two render quanta. */
const REPORT_INTERVAL = 256;

class NESAudioProcessor extends AudioWorkletProcessor {
  private readonly left = new Float32Array(CAPACITY);
  private readonly right = new Float32Array(CAPACITY);
  private readPos = 0;
  private writePos = 0;
  private buffered = 0;

  /**
   * Total samples that will never be played again, either because they were
   * output or because they were dropped. The main thread subtracts this from
   * what it has sent to learn how much audio is still queued.
   */
  private retired = 0;
  private sinceReport = 0;

  constructor() {
    super();
    this.port.onmessage = (event: MessageEvent<SampleMessage>) => {
      const [left, right] = event.data;
      // Overflowing means the emulator has run ahead of the audio clock. The
      // main thread throttles itself to prevent that, so this is a backstop.
      const count = Math.min(left.length, CAPACITY - this.buffered);
      this.retired += left.length - count;

      for (let i = 0; i < count; i++) {
        this.left[this.writePos] = left[i];
        this.right[this.writePos] = right[i];
        this.writePos = (this.writePos + 1) % CAPACITY;
      }
      this.buffered += count;
    };
  }

  process(_inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    const output = outputs[0];
    if (!output || output.length < 2) return true;
    const outL = output[0];
    const outR = output[1];
    const size = outL.length;

    const available = Math.min(size, this.buffered);
    for (let i = 0; i < available; i++) {
      outL[i] = this.left[this.readPos];
      outR[i] = this.right[this.readPos];
      this.readPos = (this.readPos + 1) % CAPACITY;
    }
    // Underrun. Pad with silence rather than repeating, and let the main
    // thread notice the empty buffer and generate more frames.
    for (let i = available; i < size; i++) {
      outL[i] = 0;
      outR[i] = 0;
    }
    this.buffered -= available;
    this.retired += available;

    this.sinceReport += size;
    if (this.sinceReport >= REPORT_INTERVAL) {
      this.sinceReport = 0;
      this.port.postMessage(this.retired);
    }
    return true;
  }
}

registerProcessor(PROCESSOR_NAME, NESAudioProcessor);
