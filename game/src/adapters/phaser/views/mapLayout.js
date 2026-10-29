//  Where the stops of the chapter map sit, in percent of the map (origin at the top left), and the trail between them. The numbers are the ones
//  `PROMPTS_ASSETS_UI.md` asks the painter for; the painted map will not hit them exactly, so they are recalibrated once the image exists.
export const MAP_SIZE = { width: 880, height: 495 };

export const MAP_IMAGE = 'assets/boss-map.jpg';

//  The 10 minibosses and the chapter boss
export const MAP_STOPS = {
    'miniboss-1': { x: 10, y: 84 },
    'miniboss-2': { x: 28, y: 88 },
    'miniboss-3': { x: 46, y: 84 },
    'miniboss-4': { x: 64, y: 88 },
    'miniboss-5': { x: 80, y: 62 },
    'miniboss-6': { x: 58, y: 56 },
    'miniboss-7': { x: 36, y: 60 },
    'miniboss-8': { x: 20, y: 30 },
    'miniboss-9': { x: 40, y: 24 },
    'miniboss-10': { x: 60, y: 30 },
    'chapter-boss': { x: 84, y: 16 }
};

//  The two bends of the road, where it climbs to the next row: no stop sits there, the fallback trail passes through them
const BEND_RIGHT = { x: 88, y: 76 };
const BEND_LEFT = { x: 12, y: 48 };

//  The trail in path order: stops 1 to 4, the right bend, stops 5 to 7, the left bend, stops 8 to 10 and the chapter boss
export const MAP_TRAIL = [
    MAP_STOPS['miniboss-1'], MAP_STOPS['miniboss-2'], MAP_STOPS['miniboss-3'], MAP_STOPS['miniboss-4'], BEND_RIGHT,
    MAP_STOPS['miniboss-5'], MAP_STOPS['miniboss-6'], MAP_STOPS['miniboss-7'], BEND_LEFT,
    MAP_STOPS['miniboss-8'], MAP_STOPS['miniboss-9'], MAP_STOPS['miniboss-10'], MAP_STOPS['chapter-boss']
];
