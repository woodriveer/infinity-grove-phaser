//  Where the stops of the chapter map sit, in percent of the map (origin at the top left), and the trail between them. The stops are calibrated
//  on the painted stones of boss-map.jpg, already corrected for the cover crop of the 16:9 frame. The first painted stone (27%, 82%) stays
//  empty as the trailhead, at the glowing tree bottom left; the chapter boss takes the last stone, next to the castle.
export const MAP_SIZE = { width: 880, height: 495 };

export const MAP_IMAGE = 'assets/boss-map.jpg';

//  The 10 minibosses and the chapter boss
export const MAP_STOPS = {
    'miniboss-1': { x: 45, y: 82 },
    'miniboss-2': { x: 63, y: 82 },
    'miniboss-3': { x: 81, y: 82 },
    'miniboss-4': { x: 88, y: 63 },
    'miniboss-5': { x: 70, y: 51 },
    'miniboss-6': { x: 51, y: 51 },
    'miniboss-7': { x: 33, y: 51 },
    'miniboss-8': { x: 17, y: 34 },
    'miniboss-9': { x: 33, y: 19 },
    'miniboss-10': { x: 51, y: 19 },
    'chapter-boss': { x: 70, y: 21 }
};

//  The two bends of the road, where it climbs to the next row: no stop sits there, the fallback trail passes through them
const BEND_RIGHT = { x: 90, y: 74 };
const BEND_LEFT = { x: 16, y: 46 };

//  The trail in path order: stops 1 to 3, the right bend, stops 4 to 7, the left bend, stops 8 to 10 and the chapter boss
export const MAP_TRAIL = [
    MAP_STOPS['miniboss-1'], MAP_STOPS['miniboss-2'], MAP_STOPS['miniboss-3'], BEND_RIGHT, MAP_STOPS['miniboss-4'],
    MAP_STOPS['miniboss-5'], MAP_STOPS['miniboss-6'], MAP_STOPS['miniboss-7'], BEND_LEFT,
    MAP_STOPS['miniboss-8'], MAP_STOPS['miniboss-9'], MAP_STOPS['miniboss-10'], MAP_STOPS['chapter-boss']
];
