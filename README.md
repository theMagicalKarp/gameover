# GAME OVER

This was a project to better understand how the NES and 6502 processor works.
The ROM artifact is nothing more than a visual and audio demo of some basic NES
capabilities.

Demo: [https://nes.sheehy.network/](https://nes.sheehy.network/)

![](https://i.imgur.com/6zYA5SY.gif)

## Build

Use docker to generate an image containing the NES rom.

```
docker build -t gameover:latest .
```

Then extract the ROM.

```
docker cp $(docker create gameover:latest):/build/gameover.nes gameover.nes
```

## Web

`web/` is a small [Vite](https://vite.dev/) + TypeScript page that runs
`build/gameover.nes` in the browser using the
[jsnes](https://github.com/bfirsh/jsnes) emulator.

```
cd web
npm install
npm run dev
```

Then open the URL it prints. The page loads `build/gameover.nes` straight from
the repo, so rebuilding the ROM is enough to update the demo — nothing needs to
be copied into `web/`.

To produce a static bundle in `web/dist/` (the ROM is emitted alongside the
JS/CSS, and paths are relative so it can be served from any sub-path):

```
npm run build
npm run preview
```

## Thanks

A huge shoutout to https://nesdoug.com/. Without his tutorial and libraries this
would not have been possible.
