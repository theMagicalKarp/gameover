FROM ubuntu:latest

RUN apt update && apt install -y wget gnupg

# see http://software.opensuse.org/download.html?project=home%3Astrik&package=cc65
RUN wget http://download.opensuse.org/repositories/home:strik/Debian_8.0/Release.key -O /tmp/opensuse.key
RUN apt-key add - < /tmp/opensuse.key
RUN echo 'deb http://download.opensuse.org/repositories/home:/strik/Debian_8.0/ /' >> /etc/apt/sources.list.d/cc65.list
RUN apt update && apt install -y --allow-unauthenticated cc65

WORKDIR /build
COPY . /build

RUN cc65 -Oirs gameover.c --add-source
RUN ca65 crt0.s
RUN ca65 gameover.s -g
RUN ld65 -C nrom_32k_vert.cfg -o gameover.nes crt0.o gameover.o nes.lib -Ln labels.txt
