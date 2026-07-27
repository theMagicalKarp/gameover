// ?worker&url makes Vite bundle the processor as its own standalone script and
// hand back a URL, which is exactly what addModule() wants. A worklet can't be
// part of the main chunk -- it runs in a different global -- so it has to be a
// separate build entry either way.
import processorUrl from "./nes-audio-processor.ts?worker&url";
import { PROCESSOR_NAME } from "./audio-protocol";
import type { RetiredMessage, SampleMessage } from "./audio-protocol";

// Big enough for several frames of samples, so a slow animation frame that
// runs a few emulator frames back to back still posts them in one message.
const BATCH_SIZE = 4096;

/**
 * Plays the samples jsnes produces, and reports how much audio is still queued
 * so the caller can pace itself against the sound card's clock.
 */
export class Speakers {
  /** The output device's real rate. The APU has to be built to match it. */
  readonly sampleRate: number;

  private readonly context: AudioContext;
  private node: AudioWorkletNode | null = null;

  private readonly batchL = new Float32Array(BATCH_SIZE);
  private readonly batchR = new Float32Array(BATCH_SIZE);
  private batchPos = 0;

  private written = 0;
  private retired = 0;

  /**
   * Constructing this creates the AudioContext, so it has to happen inside a
   * user gesture -- otherwise the context starts suspended and stays that way.
   */
  constructor() {
    this.context = new AudioContext({ latencyHint: "interactive" });
    this.sampleRate = this.context.sampleRate;
  }

  /** Loads the worklet. Samples written before this resolves are dropped. */
  async start(): Promise<void> {
    await this.context.audioWorklet.addModule(processorUrl);

    const node = new AudioWorkletNode(this.context, PROCESSOR_NAME, {
      outputChannelCount: [2],
    });
    node.port.onmessage = (event: MessageEvent<RetiredMessage>) => {
      this.retired = event.data;
    };
    node.connect(this.context.destination);
    this.node = node;
  }

  /**
   * Whether audio is actually playing. If it isn't there is no audio clock to
   * pace against and the caller has to fall back to wall time.
   */
  get running(): boolean {
    return this.node !== null && this.context.state === "running";
  }

  /**
   * Samples sent but not yet played. Lags by up to one report interval, which
   * a control loop with a few frames of slack absorbs.
   */
  get queued(): number {
    return Math.max(0, this.written - this.retired);
  }

  /** jsnes calls this once per sample, so it stays cheap and just buffers. */
  writeSample = (left: number, right: number): void => {
    this.batchL[this.batchPos] = left;
    this.batchR[this.batchPos] = right;
    this.batchPos++;
    if (this.batchPos === BATCH_SIZE) this.flush();
  };

  /** Hands the batched samples to the worklet. Call after generating frames. */
  flush(): void {
    if (this.batchPos === 0) return;
    const count = this.batchPos;
    this.batchPos = 0;
    if (!this.node) return;
    // slice() because the batch arrays get reused immediately.
    const message: SampleMessage = [
      this.batchL.slice(0, count),
      this.batchR.slice(0, count),
    ];
    this.node.port.postMessage(message);
    this.written += count;
  }

  close(): void {
    this.node?.disconnect();
    this.node = null;
    void this.context.close();
  }
}
