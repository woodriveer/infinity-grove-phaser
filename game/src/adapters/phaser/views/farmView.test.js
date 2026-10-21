import { describe, expect, it, vi } from 'vitest';
import { renderFarm } from './farmView';
import { MAP_STOPS } from './mapLayout';

const minibosses = (...stages) => stages.map((stage) => ({ kind: 'MINIBOSS', stage }));
//  Stage 4 of the chapter: the minibosses 1 to 3 are beaten
const AT_STAGE_4 = { chapter: 2, stage: 4, kind: 'PHASE', stageCount: 10, completed: false };
const AT_BOSS = { chapter: 1, stage: 10, kind: 'CHAPTER_BOSS', stageCount: 10, completed: false };

const show = (bosses = minibosses(1, 2, 3), winsLeft = 10, extra = {}) => renderFarm(bosses, winsLeft, { onPick: vi.fn(), map: AT_STAGE_4, ...extra });
const find = (screen, id) => screen.querySelector(`[data-testid="${id}"]`);
const stops = (screen) => [ ...screen.querySelectorAll('.farm-map .map-node') ];

describe('renderFarm', () => {
    it('is titled Caminho do Capítulo <n> with the chapter of the player', () => {
        expect(find(show(), 'farm-map-title').textContent).toBe('Caminho do Capítulo 2');
        expect(find(renderFarm([], 10, { onPick: vi.fn(), map: AT_BOSS }), 'farm-map-title').textContent).toBe('Caminho do Capítulo 1');
    });

    it('shows 10 numbered minibosses and the chapter boss in path order', () => {
        const nodes = stops(show());

        expect(nodes).toHaveLength(11);
        expect(nodes.map((node) => node.querySelector('.map-node-label').textContent)).toEqual([ '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Chefe' ]);
        expect(nodes.at(-1).classList.contains('is-boss')).toBe(true);
    });

    it('names each stop for assistive tech: Miniboss <n> and Chefe do capítulo', () => {
        const nodes = stops(show());

        expect(nodes[0].getAttribute('aria-label')).toBe('Miniboss 1');
        expect(nodes[9].getAttribute('aria-label')).toBe('Miniboss 10');
        expect(nodes[10].getAttribute('aria-label')).toBe('Chefe do capítulo');
    });

    it('at stage 4 with 3 minibosses beaten: three defeated, one current and the rest locked', () => {
        const states = stops(show()).map((node) => node.getAttribute('data-state'));

        expect(states).toEqual([ 'defeated', 'defeated', 'defeated', 'current', ...Array(7).fill('locked') ]);
    });

    it('at the chapter boss with the 10 minibosses beaten: stops 1 to 10 defeated and the chapter boss current', () => {
        const screen = renderFarm(minibosses(1, 2, 3, 4, 5, 6, 7, 8, 9, 10), 10, { onPick: vi.fn(), map: AT_BOSS });

        expect(stops(screen).map((node) => node.getAttribute('data-state'))).toEqual([ ...Array(10).fill('defeated'), 'current' ]);
    });

    it('makes only a defeated stop a button, with the test id of the old row', () => {
        const screen = show();

        expect(find(screen, 'farm-entry-miniboss-2').tagName).toBe('BUTTON');
        expect(find(screen, 'map-node-miniboss-4').tagName).toBe('DIV');
        expect(find(screen, 'map-node-miniboss-5').tagName).toBe('DIV');
        expect(find(screen, 'farm-entry-miniboss-4')).toBeNull();
        expect(find(screen, 'map-node-chapter-boss').getAttribute('aria-disabled')).toBe('true');
    });

    it('marks a locked stop with fog and a lock and no other stop', () => {
        const screen = show();

        expect(find(screen, 'map-node-miniboss-5').querySelector('.map-lock')).not.toBeNull();
        expect(find(screen, 'map-node-miniboss-4').querySelector('.map-lock')).toBeNull();
        expect(find(screen, 'farm-entry-miniboss-1').querySelector('.map-lock')).toBeNull();
    });

    it('calls onPick with the kind and stage of a defeated miniboss and of the chapter boss', () => {
        const onPick = vi.fn();
        const screen = renderFarm([ ...minibosses(1, 2), { kind: 'CHAPTER_BOSS' } ], 10, { onPick, map: AT_BOSS });

        find(screen, 'farm-entry-miniboss-2').click();
        find(screen, 'farm-entry-chapter-boss').click();

        expect(onPick.mock.calls).toEqual([ [ { kind: 'MINIBOSS', stage: 2 } ], [ { kind: 'CHAPTER_BOSS' } ] ]);
    });

    it('does not call onPick for the current stop or a locked one', () => {
        const onPick = vi.fn();
        const screen = renderFarm(minibosses(1, 2, 3), 10, { onPick, map: AT_STAGE_4 });

        find(screen, 'map-node-miniboss-4').click();
        find(screen, 'map-node-miniboss-8').click();

        expect(onPick).not.toHaveBeenCalled();
    });

    it('shows the wins left of a beaten chapter boss and disables it at 0', () => {
        const beaten = [ ...minibosses(1, 2, 3, 4, 5, 6, 7, 8, 9, 10), { kind: 'CHAPTER_BOSS' } ];
        const some = renderFarm(beaten, 1, { onPick: vi.fn(), map: { ...AT_BOSS, completed: true } });
        const none = renderFarm(beaten, 0, { onPick: vi.fn(), map: { ...AT_BOSS, completed: true } });

        expect(find(some, 'farm-entry-chapter-boss').querySelector('.farm-wins').textContent).toBe('1 vitórias restantes hoje');
        expect(find(some, 'farm-entry-chapter-boss').disabled).toBe(false);
        expect(find(none, 'farm-entry-chapter-boss').querySelector('.farm-wins').textContent).toBe('0 vitórias restantes hoje');
        expect(find(none, 'farm-entry-chapter-boss').disabled).toBe(true);
        expect(find(none, 'farm-entry-miniboss-1').disabled).toBe(false);
    });

    it('does not call onPick for the disabled chapter boss', () => {
        const onPick = vi.fn();
        const screen = renderFarm([ { kind: 'CHAPTER_BOSS' } ], 0, { onPick, map: AT_BOSS });

        find(screen, 'farm-entry-chapter-boss').click();

        expect(onPick).not.toHaveBeenCalled();
    });

    it('shows the map and says no boss was beaten when the list is empty: stop 1 current, the others locked', () => {
        const screen = renderFarm([], 10, { onPick: vi.fn(), map: { chapter: 1, stage: 1, kind: 'PHASE', stageCount: 10, completed: false } });

        expect(find(screen, 'farm-empty').textContent).toBe('Nenhum chefe derrotado ainda.');
        expect(stops(screen).map((node) => node.getAttribute('data-state'))).toEqual([ 'current', ...Array(10).fill('locked') ]);
    });

    it('shows no empty text when a boss was beaten', () => {
        expect(find(show(), 'farm-empty')).toBeNull();
    });

    it('puts every stop at its position of the layout table, in percent of the map', () => {
        const nodes = stops(show());
        const ids = [ ...Array.from({ length: 10 }, (_, index) => `miniboss-${index + 1}`), 'chapter-boss' ];

        nodes.forEach((node, index) =>
        {
            expect([ node.style.left, node.style.top ]).toEqual([ `${MAP_STOPS[ids[index]].x}%`, `${MAP_STOPS[ids[index]].y}%` ]);
        });
        expect(nodes[0].style.left).toBe('10%');
        expect(nodes[10].style.left).toBe('84%');
        expect(nodes[10].style.top).toBe('16%');
    });

    it('uses assets/ui/boss-map.jpg as the background and draws no trail while it loads', () => {
        const screen = show();

        expect(screen.querySelector('.farm-map-image').getAttribute('src')).toBe('assets/ui/boss-map.jpg');
        expect(find(screen, 'farm-map').classList.contains('is-fallback')).toBe(false);
    });

    it('shows the gradient and the dashed trail through the 13 points when the image fails to load', () => {
        const screen = show();

        screen.querySelector('.farm-map-image').dispatchEvent(new Event('error'));

        expect(find(screen, 'farm-map').classList.contains('is-fallback')).toBe(true);
        expect(screen.querySelector('.farm-map-image')).toBeNull();
        expect(screen.querySelector('.farm-trail polyline').getAttribute('points').split(' ')).toHaveLength(13);
        expect(screen.querySelector('.farm-trail polyline').getAttribute('points').split(' ')[0]).toBe('10,84');
        expect(screen.querySelector('.farm-trail polyline').getAttribute('points').split(' ').at(-1)).toBe('84,16');
    });

    it('lists a stage without a position as a plain button below the map', () => {
        const screen = renderFarm(minibosses(1, 11), 10, { onPick: vi.fn(), map: { ...AT_STAGE_4, stageCount: 12 } });

        expect(stops(screen)).toHaveLength(11);
        expect(screen.querySelector('.farm-extra [data-testid="farm-entry-miniboss-11"]').tagName).toBe('BUTTON');
        expect(screen.querySelector('.farm-extra [data-testid="map-node-miniboss-12"]')).not.toBeNull();
        expect(screen.querySelector('.farm-map [data-testid="farm-entry-miniboss-11"]')).toBeNull();
    });

    it('lets that extra stage start the farm like any beaten stop', () => {
        const onPick = vi.fn();
        const screen = renderFarm(minibosses(11), 10, { onPick, map: { ...AT_STAGE_4, stageCount: 12 } });

        screen.querySelector('[data-testid="farm-entry-miniboss-11"]').click();

        expect(onPick).toHaveBeenCalledWith({ kind: 'MINIBOSS', stage: 11 });
    });

    it('shows no extra list when every stage has a position', () => {
        expect(show().querySelector('.farm-extra')).toBeNull();
    });
});
