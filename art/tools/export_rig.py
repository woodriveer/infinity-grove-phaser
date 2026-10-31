"""Export a cutout rig (see assemble_rig.py) for the game: one atlas PNG with every part and a JSON with bones and parts.

    python art/tools/export_rig.py art/kael_rig/kael_rig.json game/public/assets/heroes/kael_rig

writes kael_rig.png and kael_rig.json. Coordinates in the JSON are rig pixels, y down, as in the rig file:
  bounds  the box of the assembled hero in the rest pose
  bones   name, parent and pivot (the joint the bone turns about)
  parts   the bone it rides on, its drawing order `z`, its rectangle `rect` in the atlas and the four `corners` of that rectangle
          in the rest pose (top-left, top-right, bottom-right, bottom-left), plus `axis`, its two joints
"""
import argparse
import json
import os

import numpy as np
from PIL import Image

from assemble_rig import affine, assemble
from extract_parts import parts_of

GAP = 2


def pack(images):
    """Shelf packing, tallest first: returns the atlas size and the top-left corner of each image."""
    order = sorted(range(len(images)), key=lambda index: -images[index].height)
    width = max(1024, max(image.width for image in images) + GAP)
    spots = [ None ] * len(images)
    x = y = shelf = 0

    for index in order:
        image = images[index]

        if x + image.width > width:
            x, y, shelf = 0, y + shelf + GAP, 0

        spots[index] = (x, y)
        x += image.width + GAP
        shelf = max(shelf, image.height)

    return (width, y + shelf), spots


def bounds(rig, root):
    alpha = np.asarray(assemble(rig, root))[..., 3] > 16
    ys, xs = np.nonzero(alpha)

    return { 'left': int(xs.min()), 'top': int(ys.min()), 'right': int(xs.max()) + 1, 'bottom': int(ys.max()) + 1 }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('rig')
    parser.add_argument('target', help='path without extension: writes <target>.png and <target>.json')
    args = parser.parse_args()

    with open(args.rig, encoding='utf-8') as file:
        rig = json.load(file)

    root = os.path.dirname(args.rig)
    sheets = {}
    crops = []

    for part in rig['parts']:
        if part['sheet'] not in sheets:
            sheets[part['sheet']] = parts_of(Image.open(os.path.join(root, part['sheet'])))

        crops.append(sheets[part['sheet']][part['part'] - 1])

    size, spots = pack([ crop for _, crop in crops ])
    atlas = Image.new('RGBA', size, (0, 0, 0, 0))
    parts = []

    for part, (box, crop), spot in zip(rig['parts'], crops, spots):
        atlas.paste(crop, spot)
        linear, offset = affine(part)
        left, top, right, bottom = box
        corners = [ linear @ np.array(point, dtype=float) + offset for point in ((left, top), (right, top), (right, bottom), (left, bottom)) ]

        parts.append({
            'name': part['name'],
            'bone': part['bone'],
            'z': part['z'],
            **({ 'hidden': True } if part.get('hidden') else {}),
            **({ 'cloth': True } if part.get('cloth') else {}),
            'rect': [ spot[0], spot[1], crop.width, crop.height ],
            'corners': [ [ round(float(x), 2), round(float(y), 2) ] for x, y in corners ],
            'axis': part['to']
        })

    atlas.save(args.target + '.png', optimize=True)

    with open(args.target + '.json', 'w', encoding='utf-8') as file:
        json.dump({ 'atlas': list(size), 'bounds': bounds(rig, root), 'bones': rig['bones'], 'parts': parts }, file, indent=1)

    print(f'{args.target}.png {size[0]}x{size[1]}, {len(parts)} parts, {len(rig["bones"])} bones')


if __name__ == '__main__':
    main()
