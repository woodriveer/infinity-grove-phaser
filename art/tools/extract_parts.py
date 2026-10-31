"""Split rig sheets (parts painted on a magenta background) into one transparent PNG per part.

    python art/tools/extract_parts.py art/kael_rig/kael_sheet_*.jpg --out art/kael_rig/parts

Parts are numbered per sheet in reading order (top row first, left to right), e.g. kael_sheet_2_04.png, and an index image
with the numbers drawn on is written next to them. Text labels on the sheet (single lines of letters) are dropped.
"""
import argparse
import os
from collections import deque

import numpy as np
from PIL import Image, ImageDraw

from cutout_hero import cutout

#  Fragments closer than this many pixels belong to the same part (the tatters of a cape)
JOIN = 5
#  Parts smaller than this, in pixels, are specks
MIN_AREA = 1500
#  Text labels are single lines: blobs lower than this, in pixels, are text
TEXT_HEIGHT = 45
PADDING = 4


def dilate(mask, steps):
    grown = mask.copy()

    for _ in range(steps):
        shifted = grown.copy()
        shifted[1:, :] |= grown[:-1, :]
        shifted[:-1, :] |= grown[1:, :]
        shifted[:, 1:] |= grown[:, :-1]
        shifted[:, :-1] |= grown[:, 1:]
        grown = shifted

    return grown


def components(mask):
    labels = np.zeros(mask.shape, dtype=np.int32)
    height, width = mask.shape
    count = 0

    for y, x in zip(*np.nonzero(mask)):
        if labels[y, x]:
            continue

        count += 1
        labels[y, x] = count
        queue = deque([ (y, x) ])

        while queue:
            cy, cx = queue.popleft()

            for ny, nx in ((cy + 1, cx), (cy - 1, cx), (cy, cx + 1), (cy, cx - 1)):
                if 0 <= ny < height and 0 <= nx < width and mask[ny, nx] and not labels[ny, nx]:
                    labels[ny, nx] = count
                    queue.append((ny, nx))

    return labels, count


def parts_of(sheet):
    hero = np.asarray(cutout(sheet))
    alpha = hero[..., 3] > 32
    labels, count = components(dilate(alpha, JOIN))
    found = []

    for label in range(1, count + 1):
        region = (labels == label) & alpha

        if region.sum() < MIN_AREA:
            continue

        ys, xs = np.nonzero(region)

        if ys.max() - ys.min() < TEXT_HEIGHT:
            continue

        box = (xs.min() - PADDING, ys.min() - PADDING, xs.max() + 1 + PADDING, ys.max() + 1 + PADDING)
        part = hero.copy()
        part[..., 3] = np.where(region, part[..., 3], 0)
        found.append((box, Image.fromarray(part, 'RGBA').crop(box)))

    #  Reading order: rows of parts whose centres lie within a fifth of the sheet height, then left to right
    row = sheet.height / 5
    found.sort(key=lambda item: (round(((item[0][1] + item[0][3]) / 2) / row), item[0][0]))

    return found


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('sheets', nargs='+')
    parser.add_argument('--out', required=True)
    args = parser.parse_args()

    os.makedirs(args.out, exist_ok=True)

    for path in args.sheets:
        sheet = Image.open(path)
        name = os.path.splitext(os.path.basename(path))[0]
        index = sheet.convert('RGB')
        draw = ImageDraw.Draw(index)

        for number, (box, part) in enumerate(parts_of(sheet), start=1):
            part.save(os.path.join(args.out, f'{name}_{number:02d}.png'))
            draw.rectangle(box, outline=(0, 255, 255), width=2)
            draw.text((box[0] + 4, box[1] + 2), str(number), fill=(255, 255, 255))
            print(f'{name}_{number:02d}: {part.width}x{part.height} at {box[:2]}')

        index.save(os.path.join(args.out, f'{name}_index.png'))


if __name__ == '__main__':
    main()
