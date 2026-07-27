export const SCREEN_WIDTH = 256;
export const SCREEN_HEIGHT = 240;

/**
 * Draws the NES framebuffer to a canvas.
 *
 * Frames arrive from the emulator faster than they need to be shown -- a slow
 * animation frame can leave several queued -- so setFrame() only updates an
 * offscreen buffer and writeFrame() is what actually touches the canvas.
 */
export class Screen {
  private readonly context: CanvasRenderingContext2D;
  private readonly image: ImageData;
  private readonly pixels: Uint32Array;

  constructor(canvas: HTMLCanvasElement) {
    canvas.width = SCREEN_WIDTH;
    canvas.height = SCREEN_HEIGHT;

    // alpha: false lets the compositor skip blending; every pixel is opaque.
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("Could not get a 2D canvas context");
    this.context = context;

    this.image = context.createImageData(SCREEN_WIDTH, SCREEN_HEIGHT);
    this.pixels = new Uint32Array(this.image.data.buffer);
    this.pixels.fill(0xff000000);
    this.writeFrame();
  }

  /**
   * jsnes hands over one word per pixel holding 0x00BBGGRR, which is already
   * the byte order a little-endian Uint32Array view of RGBA canvas data wants.
   * Only the alpha byte is missing.
   */
  setFrame = (buffer: Uint32Array): void => {
    for (let i = 0; i < buffer.length; i++) {
      this.pixels[i] = 0xff000000 | buffer[i];
    }
  };

  writeFrame = (): void => {
    this.context.putImageData(this.image, 0, 0);
  };
}
