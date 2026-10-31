"""Assemble a cutout rig from its part sheets into the rest pose, to check the parts against the reference painting.

    python art/tools/assemble_rig.py art/kael_rig/kael_rig.json --out preview.png

Each part names its sheet, its number on the sheet (see extract_parts.py), two anchor points on the sheet (`from`: a joint
such as the shoulder, then a second one such as the elbow) and the two joints of the skeleton they land on (`to`). The part
is turned and scaled so its anchors meet those joints; `squash` narrows it across that axis (a shield seen from the side),
`flip` mirrors it across the axis, and a `hidden` part (another drawing of a part, e.g. a face) is left out. The preview shows the assembled rig beside the reference, with the joints marked.
"""
import argparse
import json
import os

import numpy as np
from PIL import Image, ImageDraw

from extract_parts import parts_of


def affine(part):
    (ax, ay), (bx, by) = np.array(part['from'], dtype=float)
    (tx, ty), (ux, uy) = np.array(part['to'], dtype=float)

    source = np.array([ bx - ax, by - ay ])
    target = np.array([ ux - tx, uy - ty ])
    scale = np.linalg.norm(target) / np.linalg.norm(source)

    along_source = source / np.linalg.norm(source)
    across_source = np.array([ -along_source[1], along_source[0] ])
    along_target = target / np.linalg.norm(target)
    across_target = np.array([ -along_target[1], along_target[0] ])
    across = part.get('squash', 1) * (-1 if part.get('flip') else 1)

    #  target = A + scale * (along_t * (p-a).along_s + across * across_t * (p-a).across_s)
    linear = scale * (np.outer(along_target, along_source) + across * np.outer(across_target, across_source))
    offset = np.array([ tx, ty ]) - linear @ np.array([ ax, ay ])

    return linear, offset


def place(layer, part, size):
    linear, offset = affine(part)
    inverse = np.linalg.inv(linear)
    shift = -inverse @ offset

    #  PIL maps each output pixel back to the input: (a, b, c, d, e, f) with x_in = a x + b y + c
    coefficients = (inverse[0, 0], inverse[0, 1], shift[0], inverse[1, 0], inverse[1, 1], shift[1])

    return layer.transform(size, Image.AFFINE, coefficients, resample=Image.BICUBIC)


def assemble(rig, root):
    size = tuple(rig['size'])
    canvas = Image.new('RGBA', size, (0, 0, 0, 0))
    sheets = {}

    for part in sorted((part for part in rig['parts'] if not part.get('hidden')), key=lambda item: item['z']):
        sheet = part['sheet']

        if sheet not in sheets:
            image = Image.open(os.path.join(root, sheet))
            sheets[sheet] = (image.size, parts_of(image))

        sheet_size, found = sheets[sheet]
        box, crop = found[part['part'] - 1]
        layer = Image.new('RGBA', sheet_size, (0, 0, 0, 0))
        layer.paste(crop, box[:2])
        canvas.alpha_composite(place(layer, part, size))

    return canvas


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('rig')
    parser.add_argument('--out', required=True)
    parser.add_argument('--joints', action='store_true')
    args = parser.parse_args()

    with open(args.rig, encoding='utf-8') as file:
        rig = json.load(file)

    root = os.path.dirname(args.rig)
    hero = assemble(rig, root)
    size = hero.size
    background = (58, 74, 52, 255)

    left = Image.new('RGBA', size, background)
    left.alpha_composite(hero)

    if args.joints:
        draw = ImageDraw.Draw(left)

        for part in rig['parts']:
            for x, y in part['to']:
                draw.ellipse((x - 4, y - 4, x + 4, y + 4), outline=(0, 255, 255), width=2)

    right = Image.new('RGBA', size, background)

    if rig.get('reference'):
        reference = Image.open(os.path.join(root, rig['reference'])).convert('RGB').resize(size)
        right = Image.fromarray(np.asarray(reference)).convert('RGBA')

    preview = Image.new('RGBA', (size[0] * 2, size[1]))
    preview.paste(left, (0, 0))
    preview.paste(right, (size[0], 0))
    preview.convert('RGB').save(args.out)
    print(args.out)


if __name__ == '__main__':
    main()
