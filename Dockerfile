FROM ubuntu:26.04

RUN apt-get update && \
  apt-get install -y --no-install-recommends cc65 && \
  rm -rf /var/lib/apt/lists/*

WORKDIR /build
COPY . /build

RUN cc65 -Oirs gameover.c --add-source
RUN ca65 crt0.s
RUN ca65 gameover.s -g
RUN ld65 -C nrom_32k_vert.cfg -o gameover.nes crt0.o gameover.o nes.lib -Ln labels.txt
