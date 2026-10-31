"""Cut a hero painted on a magenta background out to a transparent PNG, cropped to the hero.

    python art/tools/cutout_hero.py art/kael_position.jpg game/public/assets/heroes/kael_idle.png --height 720

The alpha comes from how magenta a pixel is (min(R, B) - G), so the soft JPEG edges fade out instead of
leaving a pink fringe, and the magenta that bled into the edge pixels is taken back out (despill).
"""
import argparse

import numpy as np
from PIL import Image

#  min(R, B) - G at or below KEEP is the hero, at or above DROP is background; between them the alpha ramps
KEEP, DROP = 40, 110
#  Blank pixels kept around the hero so the idle can sway inside the frame; none below, the feet stand on the bottom edge
MARGIN = { 'top': 0.03, 'side': 0.03 }


def cutout(source):
    rgb = np.asarray(source.convert('RGB')).astype(np.float32)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]

    magenta = np.minimum(r, b) - g
    alpha = 1 - np.clip((magenta - KEEP) / (DROP - KEEP), 0, 1)

    spill = np.clip(magenta, 0, None) * (1 - alpha * 0.5)
    rgb[..., 0] -= spill
    rgb[..., 2] -= spill

    rgba = np.dstack([ np.clip(rgb, 0, 255), alpha * 255 ]).astype(np.uint8)

    return Image.fromarray(rgba, 'RGBA')


def crop(hero):
    alpha = np.asarray(hero)[..., 3]
    rows = np.where(alpha.max(axis=1) > 16)[0]
    cols = np.where(alpha.max(axis=0) > 16)[0]
    top, bottom, left, right = rows[0], rows[-1] + 1, cols[0], cols[-1] + 1

    height = bottom - top
    pad_top = int(height * MARGIN['top'])
    pad_side = int(height * MARGIN['side'])

    box = (left - pad_side, top - pad_top, right + pad_side, bottom)

    return hero.crop(box)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('source')
    parser.add_argument('target')
    parser.add_argument('--height', type=int, default=720)
    args = parser.parse_args()

    hero = crop(cutout(Image.open(args.source)))
    width = round(hero.width * args.height / hero.height)
    hero = hero.resize((width, args.height), Image.LANCZOS)
    hero.save(args.target, optimize=True)

    print(f'{args.target}: {hero.width}x{hero.height}')


if __name__ == '__main__':
    main()
