# GAME OVER
This was a project to better understand how the NES works and understanding of the 6502 processor.
The ROM artifact is nothing more than a visual and audio demo of some basic NES capabilities.

Demo: [sheehy.network/nes](sheehy.network/nes)

![](https://i.imgur.com/6zYA5SY.gif)

## Build
Use docker to generate an image containing the NES rom.

```
docker build -t gameover:latest .
```
Then extract the artifict ROM.

```
docker cp $(docker create gameover:latest):/build/gameover.nes gameover.nes
```

## Thanks

A huge shoutout to https://nesdoug.com/. Without his tutorial and libraries this would not have been possible.