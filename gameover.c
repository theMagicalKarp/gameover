#include "LIB/neslib.h"
#include "LIB/nesdoug.h"


#pragma bss-name(push, "ZEROPAGE")

unsigned char FISH_TRACK_INDEX = 0;
unsigned char FISH_ANIMATION = 0;
const unsigned char FISH_TRACK[] = {
    4, 3, 3, 2, 2, 1, 0, 0, 0, 0, 0, 1, 1, 2, 3, 3
};

const unsigned char FISH[4][9]= {
    {
        0, 0,0xB8,0,
        8, 0,0xB9,0,
        128
    },
    {
        0, 0,0xB8,1,
        8, 0,0xB9,1,
        128
    },
    {
        0, 0,0xB8,2,
        8, 0,0xB9,2,
        128
    },
    {
        0,  0,0xB8,3,
        8,  0,0xB9,3,
        128
    },
};

unsigned char spritex[] = {
    3,   8,   45, 30,
    83,  95,  105, 115,
    170, 174, 192, 205
};
unsigned char spritexvel[] = {
    2, 3, 2, 1,
    2, 2, 1, 3,
    2, 1, 3, 1,
};
unsigned char spritey[] = {
    60, 74, 84, 94,
    139, 159, 180, 179,
    214, 244, 254, 0
};
unsigned char spriteyvel[] = {
    3, 2, 1, 2,
    1, 3, 1, 2,
    1, 2, 2, 3,
};

// 0=ring; 1=diamond; 2=heart
unsigned char spriteimg[] = {
    0, 0, 0, 0,
    1, 1, 1, 1,
    2, 2, 2, 2
};

unsigned char spriteanimation[] = {
    0, 1, 2, 3,
    0, 1, 2, 3,
    0, 1, 2, 3,
};

const unsigned char RING[4][17] = {
    {
        0, 0,0x10,1,
        8, 0,0x11,1,
        0, 8,0x18,1,
        8, 8,0x19,1,
        128
    },
    {
        0, 0,0x12,1,
        8, 0,0x13,1,
        0, 8,0x1a,1,
        8, 8,0x1b,1,
        128
    },
    {
        8, 0,0x10,1|OAM_FLIP_H,
        0, 0,0x11,1|OAM_FLIP_H,
        8, 8,0x18,1|OAM_FLIP_H,
        0, 8,0x19,1|OAM_FLIP_H,
        128
    },
    {
        0, 0,0x14,1,
        8, 0,0x15,1,
        0, 8,0x1c,1,
        8, 8,0x1d,1,
        128
    }
};

const unsigned char DIAMOND[4][17] = {
    {
        0, 0,0x00,2,
        8, 0,0x01,2,
        0, 8,0x08,2,
        8, 8,0x09,2,
        128
    },
    {
        0, 0,0x02,2,
        8, 0,0x03,2,
        0, 8,0x0a,2,
        8, 8,0x0b,2,
        128
    },
    {
        8, 0,0x00,2|OAM_FLIP_H,
        0, 0,0x01,2|OAM_FLIP_H,
        8, 8,0x08,2|OAM_FLIP_H,
        0, 8,0x09,2|OAM_FLIP_H,
        128
    },
    {
        0, 0,0x02,2,
        8, 0,0x03,2,
        0, 8,0x0a,2,
        8, 8,0x0b,2,
        128
    },
};

const unsigned char HEART[4][17] = {
    {
        0, 0,0x80,3,
        8, 0,0x81,3,
        0, 8,0x88,3,
        8, 8,0x89,3,
        128
    }, {
        0, 0,0x82,3,
        8, 0,0x83,3,
        0, 8,0x8a,3,
        8, 8,0x8b,3,
        128
    }, {
        0, 0,0x84,3,
        8, 0,0x85,3,
        0, 8,0x8c,3,
        8, 8,0x8d,3,
        128
    }, {
        0, 0,0x86,3,
        8, 0,0x87,3,
        0, 8,0x8e,3,
        8, 8,0x8f,3,
        128
    }
};

const unsigned char N0[]={
    1, 
    0, 1, 44, 37, 
    0, 1, 39, 42, 
    0, 1, 50, 33, 
    0, 1, 38, 42, 
    0, 1, 36, 36, 
    0, 1, 63, 36, 
    0, 1, 45, 36, 
    0, 1, 47, 43, 
    0, 1, 40, 38, 
    0, 1, 44, 36, 
    0, 1, 61, 33, 
    0, 1, 61, 38, 
    0, 1, 37, 40, 
    0, 1, 48, 39, 
    0, 1, 48, 48, 49,  50,  51, 
    0, 1, 46, 36, 
    0, 1, 48, 40, 
    0, 1, 41, 41, 
    0, 1, 61, 42, 
    1,  0
};

const unsigned char N1[]={
    1, 
    0,  1,  64, 32,
    0,  1,  40, 33,
    0,  1,  55, 37,
    0,  1,  45, 33,
    0,  1,  63, 34,
    0,  1,  49, 39,
    0,  1,  60, 39,
    0,  1,  50, 42,
    0,  1,  42, 42,
    56, 57, 58,
    0,  1,  28,
    64, 65, 66,
    0,  1,  28,
    72, 73, 74,
    0,  1,  61, 42,
    0,  1,  57, 32,
    0,  1,  52, 42,
    0,  1,  44, 32,
    0,  1,  55, 37,
    0,  1,  41, 42,
    1,  0
};

const unsigned char COS[256]={
    208, 207, 207, 207, 207, 207, 206, 206, 206, 205, 205, 204, 203, 203, 202,
    201, 200, 199, 198, 197, 196, 195, 194, 193, 191, 190, 189, 187, 186, 184,
    183, 181, 179, 178, 176, 174, 172, 170, 168, 167, 165, 163, 161, 159, 157,
    154, 152, 150, 148, 146, 144, 141, 139, 137, 134, 132, 130, 128, 125, 123,
    121, 118, 116, 113, 111, 109, 106, 104, 102, 99, 97, 95, 92, 90, 88, 85,
    83, 81, 79, 76, 74, 72, 70, 68, 66, 64, 62, 60, 58, 56, 54, 52, 50, 48,
    47, 45, 43, 42, 40, 38, 37, 35, 34, 33, 31, 30, 29, 28, 27, 25, 24, 23,
    23, 22, 21, 20, 19, 19, 18, 18, 17, 17, 16, 16, 16, 16, 16, 16, 16, 16, 16,
    16, 16, 16, 17, 17, 18, 18, 19, 19, 20, 21, 21, 22, 23, 24, 25, 26, 27, 28,
    30, 31, 32, 34, 35, 36, 38, 39, 41, 43, 44, 46, 48, 50, 51, 53, 55, 57, 59,
    61, 63, 65, 67, 69, 71, 74, 76, 78, 80, 82, 85, 87, 89, 92, 94, 96, 99,
    101,103, 106, 108, 110, 113, 115, 117, 120, 122, 124, 127, 129, 131, 134,
    136, 138, 141, 143, 145, 147, 149, 152, 154, 156, 158, 160, 162, 164, 166,
    168, 170, 172, 173, 175, 177, 179, 180, 182, 184, 185, 187, 188, 189, 191,
    192, 193, 195, 196, 197, 198, 199, 200, 201, 202, 202, 203, 204, 204, 205,
    205, 206, 206, 207, 207, 207, 207, 207, 207
};

const unsigned char GAME[]="GAME";
const unsigned char OVER[]="OVER";
const unsigned char PALETTE_BG[]={
    0x0f, 0x11, 0x21, 0x31,
    0,0,0,0,
    0,0,0,0,
    0,0,0,0
}; 
const unsigned char PALETTE_SP[]={
    0x0f, 0x00, 0x10, 0x30,
    0x0f, 0x28, 0x18, 0x08,
    0x0f, 0x23, 0x13, 0x03,
    0x0f, 0x26, 0x16, 0x06,
}; 

unsigned int scroll_x;
unsigned int scroll_y;
unsigned char move_shift;
unsigned char animation_shift;
unsigned char t;
unsigned char i;
unsigned char j;

#pragma bss-name(push, "BSS")

void main (void) {
    ppu_off();

    pal_bg(PALETTE_BG);
    pal_spr(PALETTE_SP);
    bank_spr(1);

    vram_adr(NAMETABLE_A);
    vram_unrle(N0);

    vram_adr(NAMETABLE_B);
    vram_unrle(N1);

    music_play(0);
    ppu_on_all();
    set_music_speed(10);

    while (1) {
        ppu_wait_nmi();

        move_shift = (t&0x1) == 0;
        animation_shift = (t&0xf) == 0;

        scroll_x += 2;
        if (move_shift) {
            scroll_y = sub_scroll_y(1, scroll_y);
        }

        set_scroll_x(scroll_x);
        set_scroll_y(scroll_y);

        oam_clear();

        ++t;

        oam_spr(124, 133, 0xBA, 1);

        if (animation_shift) {
            FISH_ANIMATION = (FISH_ANIMATION + 1)&0x3;
        }
        if (move_shift) {
            FISH_TRACK_INDEX = (FISH_TRACK_INDEX + 1)&0xF;
        }

        oam_meta_spr(120, 140+FISH_TRACK[FISH_TRACK_INDEX], FISH[FISH_ANIMATION]);

        for (i=0; i< 12; ++i) {
            switch (spriteimg[i]) {
                case 0:
                    oam_meta_spr(COS[spritex[i]]+8, COS[spritey[i]], RING[spriteanimation[i]]);
                    break;
                case 1:
                    oam_meta_spr(COS[spritex[i]]+8, COS[spritey[i]], DIAMOND[spriteanimation[i]]);
                    break;
                case 2:
                    oam_meta_spr(COS[spritex[i]]+8, COS[spritey[i]], HEART[spriteanimation[i]]);
                    break;
            }

            if (move_shift) {
                spritex[i] = spritex[i] + spritexvel[i];
                spritey[i] = spritey[i] + spriteyvel[i];
            }

            if (animation_shift) {
                spriteanimation[i] = (spriteanimation[i]+1)&0x3;
            }
        }

        i = 0;
        j = 104;
        while(GAME[i]){
            oam_spr(j, 102, GAME[i], 0);
            ++i;
            j = j + 8;
        }

        i = 0;
        j = 112;
        while(OVER[i]){
            oam_spr(j, 110, OVER[i], 0);
            ++i;
            j = j + 8;
        }
    }
}
