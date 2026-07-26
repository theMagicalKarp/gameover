import { Browser, Controller } from "jsnes";
import romUrl from "../../build/gameover.nes?url";
import "./style.css";

// Standard NES pad on controller 1, keyed by keyCode. This replaces jsnes's
// default map, which also binds S and A to its turbo-fire buttons.
const KEYS: Record<number, [number, number, string]> = {
  88: [1, Controller.BUTTON_A, "X"],
  90: [1, Controller.BUTTON_B, "Z"],
  17: [1, Controller.BUTTON_SELECT, "Right Ctrl"],
  13: [1, Controller.BUTTON_START, "Enter"],
  38: [1, Controller.BUTTON_UP, "Up"],
  40: [1, Controller.BUTTON_DOWN, "Down"],
  37: [1, Controller.BUTTON_LEFT, "Left"],
  39: [1, Controller.BUTTON_RIGHT, "Right"],
};

// jsnes's Browser builds the APU before it creates the AudioContext, so it
// always passes Speakers.getSampleRate()'s 44100 fallback to the NES. On a
// 48kHz output device the worklet then drains faster than the APU can fill it,
// and Browser reacts to each underrun by running two extra frames -- which runs
// the whole emulator ~8.8% fast (65.4fps instead of 60.098). Correcting
// nes.opts.sampleRate before loadROM() rebuilds the APU at the real rate.
// opts is not in jsnes's type declarations, hence the cast.
type NESInternals = { opts: { sampleRate: number } };

/** The output device's real sample rate, or null if there's no Web Audio. */
function outputSampleRate(): number | null {
  if (!window.AudioContext) return null;
  const probe = new AudioContext();
  const rate = probe.sampleRate;
  void probe.close();
  return rate;
}

function required<T extends Element>(selector: string): T {
  const el = document.querySelector<T>(selector);
  if (!el) throw new Error(`Missing element: ${selector}`);
  return el;
}

const screenEl = required<HTMLDivElement>("#screen");
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

  // jsnes.Browser owns the canvas, the AudioWorklet, frame timing and input.
  const emulator = new Browser({
    container: screenEl,
    onError: (error) => fail(`Emulator crashed: ${error.message}`),
  });

  // Assigned rather than passed through setKeys(), which would persist the map
  // to localStorage; this keeps every load deterministic.
  emulator.keyboard.keys = KEYS;

  // fitInParent() measures the container, so re-run it on any resize.
  new ResizeObserver(() => emulator.fitInParent()).observe(screenEl);

  startButton.hidden = false;
  startButton.addEventListener(
    "click",
    () => {
      // Match the APU to the real output rate before loadROM() builds it,
      // otherwise the underrun handler runs the emulator fast. See above.
      const rate = outputSampleRate();
      if (rate !== null) {
        (emulator.nes as unknown as NESInternals).opts.sampleRate = rate;
      }

      // Stays synchronous so the AudioContext is created inside the click
      // gesture and therefore starts unsuspended.
      emulator.nes.loadROM(rom);
      emulator.start();
      startButton.hidden = true;
    },
    { once: true },
  );
}

main().catch((error: unknown) => {
  fail(error instanceof Error ? error.message : String(error));
});
