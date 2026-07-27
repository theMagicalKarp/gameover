import { NES } from "jsnes";
import romUrl from "../../build/gameover.nes?url";
import "./style.css";
import { Screen } from "./screen";
import { Speakers } from "./speakers";

/** NTSC field rate. The PPU emits a frame every 29780.5 CPU cycles. */
const FPS = 60.098;
const FRAME_INTERVAL = 1000 / FPS;

// FRAME PACING
//
// Emulator frames have to be produced at the rate the sound card consumes
// them, not the rate the display refreshes: they are the same nominal 60Hz but
// they run off different crystals, and a fraction of a percent of drift is
// enough to empty or overflow the audio buffer within a minute. So the audio
// queue is the clock. Each animation frame we generate however many frames it
// takes to bring the queue back to TARGET_FRAMES' worth, which self-corrects
// for drift, for refresh rates that aren't 60Hz, and for a machine that can't
// quite keep up.
//
// TARGET_FRAMES is the latency/robustness tradeoff: it is how far ahead of the
// speakers the emulator runs, so it is both the input lag and the length of
// hitch the buffer can absorb without an audible gap.
const TARGET_FRAMES = 3;

// A backstop against catch-up spirals. Without it, anything that stops
// animation frames from firing -- switching tabs, sleeping the machine -- comes
// back to a drained buffer and a demand for every missed frame at once, which
// either fast-forwards the ROM or wedges the page generating frames it can
// never catch up on. Capping the burst means time spent hidden is simply time
// the emulator was paused.
const MAX_FRAMES_PER_TICK = 4;

function required<T extends Element>(selector: string): T {
  const el = document.querySelector<T>(selector);
  if (!el) throw new Error(`Missing element: ${selector}`);
  return el;
}

const canvas = required<HTMLCanvasElement>("#screen");
const startButton = required<HTMLButtonElement>("#start");
const errorEl = required<HTMLParagraphElement>("#error");

function fail(message: string) {
  errorEl.textContent = message;
  errorEl.hidden = false;
  startButton.hidden = true;
}

async function main() {
  const response = await fetch(romUrl);
  if (!response.ok) {
    fail(
      `Could not load the ROM (HTTP ${response.status}). Has it been built at build/gameover.nes?`,
    );
    return;
  }
  // NES.loadROM takes a Uint8Array directly.
  const rom = new Uint8Array(await response.arrayBuffer());

  const screen = new Screen(canvas);

  startButton.hidden = false;
  startButton.addEventListener(
    "click",
    () => {
      startButton.hidden = true;
      // Synchronous, so the AudioContext is constructed inside the gesture
      // that opened it and therefore starts running rather than suspended.
      const speakers = window.AudioContext ? new Speakers() : null;
      run(rom, screen, speakers);
      // The worklet has to load before anything can be heard, but frames can
      // start being generated in the meantime; the samples are just discarded.
      speakers?.start().catch((error: unknown) => {
        console.error("Audio unavailable:", error);
      });
    },
    { once: true },
  );
}

function run(rom: Uint8Array, screen: Screen, speakers: Speakers | null) {
  // The APU generates samples per emulated CPU cycle, so it has to be built
  // for the device's real rate. Handing it 44100 when the device runs at 48000
  // makes it underfill the buffer by 8% forever.
  const sampleRate = speakers?.sampleRate ?? 48000;
  const samplesPerFrame = sampleRate / FPS;

  const nes = new NES({
    onFrame: screen.setFrame,
    onAudioSample: speakers?.writeSample,
    emulateSound: speakers !== null,
    sampleRate,
  });

  // The ROM is a non-interactive demo, so the controllers are left unread.
  nes.loadROM(rom);

  // Only used when there is no audio clock to pace against.
  let accumulator = 0;
  let previous = 0;

  function framesToRun(now: number): number {
    const elapsed = previous === 0 ? FRAME_INTERVAL : now - previous;
    previous = now;

    if (speakers?.running) {
      accumulator = 0;
      const deficit = TARGET_FRAMES * samplesPerFrame - speakers.queued;
      const frames = Math.round(deficit / samplesPerFrame);
      return Math.min(Math.max(frames, 0), MAX_FRAMES_PER_TICK);
    }

    accumulator = Math.min(
      accumulator + elapsed,
      MAX_FRAMES_PER_TICK * FRAME_INTERVAL,
    );
    const frames = Math.floor(accumulator / FRAME_INTERVAL);
    accumulator -= frames * FRAME_INTERVAL;
    return frames;
  }

  function tick(now: number) {
    const handle = requestAnimationFrame(tick);

    const frames = framesToRun(now);
    try {
      for (let i = 0; i < frames; i++) nes.frame();
    } catch (error) {
      cancelAnimationFrame(handle);
      speakers?.close();
      fail(`Emulator crashed: ${error instanceof Error ? error.message : String(error)}`);
      return;
    }
    speakers?.flush();

    // Intermediate frames were generated but never shown; only the newest one
    // reaches the canvas, which is all a 60Hz display could show anyway.
    if (frames > 0) screen.writeFrame();
  }

  requestAnimationFrame(tick);
}

main().catch((error: unknown) => {
  fail(error instanceof Error ? error.message : String(error));
});
