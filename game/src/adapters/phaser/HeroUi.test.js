import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HeroUi } from './HeroUi';
import { ApiError } from '../../application/ApiError';
import { createFarmSession } from '../../application/farm/farmSession';
import { createHeroCollection } from '../../application/heroes/heroCollection';

const flush = () => new Promise((resolve) => setTimeout(resolve));

const skills = (...unlocked) => unlocked.map((open, index) => ({
    slot: index + 1, name: `Skill ${index + 1}`, type: 'Ataque', effect: `Effect ${index + 1}`, cooldownSeconds: 10, image: `art_${index + 1}`, unlocked: open
}));

const hero = (id, copies = {}, extra = {}) => {
    const stars = [ 3, 2, 1 ].find((level) => (copies[level] ?? 0) > 0) ?? 0;
    const owned = Object.values(copies).some((n) => n > 0);

    return {
        id, name: `Hero ${id}`, heroClass: 'Guerreiro', element: 'FIRE', leaderBonus: 'Bonus', portrait: `${id}_position`, chapter: 1,
        owned, stars, copies: { 0: 0, 1: 0, 2: 0, 3: 0, ...copies }, skills: skills(stars >= 1, stars >= 2, stars >= 3), ...extra
    };
};

const catalog = () => ({
    leaderId: 'kael',
    heroes: [ hero('kael', { 0: 3 }), hero('lyra', { 0: 1 }), hero('orina'), hero('seraphine'), hero('vex') ]
});

const farmState = () => ({ bosses: [ { kind: 'MINIBOSS', stage: 1 }, { kind: 'CHAPTER_BOSS' } ], chapterBossWinsLeft: 10 });

const createUi = ({ list = catalog(), farmGet = farmState(), pause = true } = {}) => {
    const heroesGateway = {
        list: vi.fn(() => (list instanceof Error ? Promise.reject(list) : Promise.resolve(list))),
        fuse: vi.fn(),
        setLeader: vi.fn()
    };
    const farmGateway = { get: vi.fn(() => (farmGet instanceof Error ? Promise.reject(farmGet) : Promise.resolve(farmGet))), win: vi.fn() };
    const timers = [];
    const scene = {
        add: {
            dom: vi.fn(() => {
                const element = {};

                element.createFromHTML = (html) => {
                    const root = document.createElement('div');

                    root.innerHTML = html;
                    element.node = root;
                    return element;
                };
                element.updateSize = vi.fn();
                return element;
            })
        },
        time: { delayedCall: vi.fn((delay, callback) => { timers.push({ delay, callback }); }) }
    };
    const hooks = { pause: vi.fn(() => pause), resume: vi.fn(), startFarm: vi.fn() };
    const heroes = createHeroCollection({ gateway: heroesGateway });
    const farm = createFarmSession({ gateway: farmGateway });
    const ui = new HeroUi(scene, { heroes, farm, ...hooks });
    const root = scene.add.dom.mock.results.map((result) => result.value.node);
    const query = (selector) => root.map((node) => node.querySelector(selector)).find(Boolean) ?? null;
    const testid = (id) => query(`[data-testid="${id}"]`);

    return { ui, scene, heroes, farm, heroesGateway, farmGateway, hooks, timers, query, testid, root };
};

const open = async (ctx, screen) => {
    ctx.testid(`hud-${screen}`).click();
    await flush();
};

describe('HeroUi HUD', () => {
    it('shows the five buttons Heróis, Mochila, Fusão, Líder and Rever chefes', () => {
        const { testid } = createUi();

        expect([ 'heroes', 'bag', 'fusion', 'leader', 'farm' ].map((id) => testid(`hud-${id}`).textContent)).toEqual([
            'Heróis', 'Mochila', 'Fusão', 'Líder', 'Rever chefes'
        ]);
    });

    it('keeps the panel hidden until a button is pressed', () => {
        const { query } = createUi();

        expect(query('.hero-panel').hidden).toBe(true);
    });
});

describe('HeroUi pause', () => {
    it('opening a panel pauses the fight and closing it resumes', async () => {
        const ctx = createUi();

        await open(ctx, 'heroes');

        expect(ctx.hooks.pause).toHaveBeenCalledTimes(1);
        expect(ctx.query('.hero-panel').hidden).toBe(false);
        expect(ctx.ui.isOpen).toBe(true);

        ctx.testid('hero-close').click();

        expect(ctx.hooks.resume).toHaveBeenCalledTimes(1);
        expect(ctx.query('.hero-panel').hidden).toBe(true);
        expect(ctx.ui.isOpen).toBe(false);
    });

    it('switching screens keeps one pause and one resume', async () => {
        const ctx = createUi();

        await open(ctx, 'heroes');
        ctx.ui.show('bag');
        await flush();
        ctx.ui.close();

        expect(ctx.hooks.pause).toHaveBeenCalledTimes(1);
        expect(ctx.hooks.resume).toHaveBeenCalledTimes(1);
    });

    it('does not resume a fight that was already paused when the panel opened', async () => {
        const ctx = createUi({ pause: false });

        await open(ctx, 'heroes');
        ctx.ui.close();

        expect(ctx.hooks.resume).not.toHaveBeenCalled();
    });

    it('close without an open panel does nothing', () => {
        const { ui, hooks } = createUi();

        ui.close();

        expect(hooks.resume).not.toHaveBeenCalled();
    });
});

describe('HeroUi Heróis', () => {
    it('loads the heroes and shows the catalog with the owned hero in colour and the others grey', async () => {
        const ctx = createUi();

        await open(ctx, 'heroes');

        expect(ctx.heroesGateway.list).toHaveBeenCalledTimes(1);
        expect(ctx.query('.hero-title').textContent).toBe('Heróis');
        expect(ctx.root[1].querySelectorAll('.hero-card')).toHaveLength(5);
        expect(ctx.root[1].querySelectorAll('.hero-card.is-grey')).toHaveLength(3);
    });

    it('shows the detail of a grey hero with three locked skills and goes back to the catalog', async () => {
        const ctx = createUi();
        await open(ctx, 'heroes');

        ctx.testid('hero-card-vex').click();

        expect(ctx.testid('hero-detail')).not.toBeNull();
        expect(ctx.root[1].querySelectorAll('.skill-row')).toHaveLength(3);
        expect(ctx.root[1].querySelectorAll('.skill-row.is-locked')).toHaveLength(3);
        expect(ctx.testid('hero-back').hidden).toBe(false);

        ctx.testid('hero-back').click();

        expect(ctx.testid('hero-grid')).not.toBeNull();
        expect(ctx.testid('hero-detail')).toBeNull();
    });

    it('shows an error line and no grid when the heroes cannot be loaded', async () => {
        const ctx = createUi({ list: new ApiError('Cannot reach the server. Try again later.') });

        await open(ctx, 'heroes');

        expect(ctx.query('.hero-error').textContent).toBe('Não foi possível carregar.');
        expect(ctx.query('.hero-error').hidden).toBe(false);
        expect(ctx.testid('hero-grid')).toBeNull();
        expect(ctx.ui.isOpen).toBe(true);
    });

    it('ignores a load that finishes after the panel was closed', async () => {
        const ctx = createUi();
        let resolve;
        ctx.heroesGateway.list.mockImplementation(() => new Promise((done) => { resolve = done; }));

        ctx.testid('hud-heroes').click();
        ctx.ui.close();
        resolve(catalog());
        await flush();

        expect(ctx.testid('hero-grid')).toBeNull();
    });
});

describe('HeroUi Mochila', () => {
    it('lists the cards, shows an entry and opens Fusão with that entry selected', async () => {
        const ctx = createUi();
        await open(ctx, 'bag');

        expect(ctx.testid('bag-entry-kael-0')).not.toBeNull();
        expect(ctx.testid('bag-entry-lyra-0')).not.toBeNull();
        expect(ctx.testid('bag-entry-orina-0')).toBeNull();

        ctx.testid('bag-entry-kael-0').click();

        expect(ctx.testid('bag-entry-detail')).not.toBeNull();
        expect(ctx.root[1].querySelectorAll('.skill-row')).toHaveLength(3);

        ctx.testid('bag-go-fusion').click();
        await flush();

        expect(ctx.query('.hero-title').textContent).toBe('Fusão');
        expect(ctx.testid('fusion-row-kael-0').classList.contains('is-selected')).toBe(true);
    });
});

describe('HeroUi Fusão', () => {
    it('fuses, shows the new card, updates the screen and lights the first skill of the leader on the bar', async () => {
        const ctx = createUi();
        const fused = hero('kael', { 1: 1 });
        ctx.heroesGateway.fuse.mockResolvedValue(fused);
        await open(ctx, 'fusion');
        expect(ctx.testid('fusion-button-kael-0')).not.toBeNull();
        expect(ctx.root[2].querySelectorAll('.skill-slot.is-locked')).toHaveLength(3);

        ctx.testid('fusion-button-kael-0').click();
        await flush();

        expect(ctx.heroesGateway.fuse).toHaveBeenCalledWith('kael', 0);
        expect(ctx.testid('fusion-result').textContent).toBe('Nova carta: Hero kael 1★');
        expect(ctx.testid('fusion-row-kael-0')).toBeNull();
        expect(ctx.testid('fusion-empty').textContent).toBe('Nenhuma fusão disponível');
        expect(ctx.testid('skill-slot-1').getAttribute('data-unlocked')).toBe('true');
        expect(ctx.testid('skill-slot-2').getAttribute('data-unlocked')).toBe('false');
    });

    it('shows a Portuguese error line and leaves the bag unchanged when the fusion fails', async () => {
        const ctx = createUi();
        ctx.heroesGateway.fuse.mockRejectedValue(new ApiError('Fewer than 3 cards', { status: 409, code: 'NOT_ENOUGH_CARDS' }));
        await open(ctx, 'fusion');
        const before = ctx.heroes.heroes();

        ctx.testid('fusion-button-kael-0').click();
        await flush();

        expect(ctx.query('.hero-error').textContent).toBe('Não foi possível fundir as cartas.');
        expect(ctx.heroes.heroes()).toEqual(before);
        expect(ctx.testid('fusion-result')).toBeNull();
        expect(ctx.testid('fusion-list')).not.toBeNull();
    });
});

describe('HeroUi Líder', () => {
    it('lists the owned heroes, changes the leader and replaces the three skills on the bar', async () => {
        const ctx = createUi({ list: { leaderId: 'kael', heroes: [ hero('kael', { 0: 1 }), hero('lyra', { 1: 1 }) ] } });
        ctx.heroesGateway.setLeader.mockResolvedValue({ leaderId: 'lyra' });
        await open(ctx, 'leader');

        expect(ctx.testid('leader-entry-kael').classList.contains('is-current')).toBe(true);
        expect(ctx.testid('skill-slot-1').getAttribute('data-unlocked')).toBe('false');

        ctx.testid('leader-entry-lyra').click();
        await flush();

        expect(ctx.heroesGateway.setLeader).toHaveBeenCalledWith('lyra');
        expect(ctx.testid('leader-entry-lyra').classList.contains('is-current')).toBe(true);
        expect(ctx.testid('skill-slot-1').getAttribute('data-unlocked')).toBe('true');
    });

    it('shows a Portuguese error line and keeps the leader when the change fails', async () => {
        const ctx = createUi({ list: { leaderId: 'kael', heroes: [ hero('kael', { 0: 1 }), hero('lyra', { 0: 1 }) ] } });
        ctx.heroesGateway.setLeader.mockRejectedValue(new ApiError('Hero is not owned', { status: 409 }));
        await open(ctx, 'leader');

        ctx.testid('leader-entry-lyra').click();
        await flush();

        expect(ctx.query('.hero-error').textContent).toBe('Não foi possível trocar o líder.');
        expect(ctx.heroes.leaderId()).toBe('kael');
    });
});

describe('HeroUi Rever chefes', () => {
    it('loads the farm state and lists the bosses with the wins left', async () => {
        const ctx = createUi();

        await open(ctx, 'farm');

        expect(ctx.farmGateway.get).toHaveBeenCalledTimes(1);
        expect(ctx.testid('farm-entry-miniboss-1')).not.toBeNull();
        expect(ctx.testid('farm-entry-chapter-boss').textContent).toContain('10 vitórias restantes hoje');
    });

    it('closes the panel, resumes the fight and starts the farm fight of the chosen boss', async () => {
        const ctx = createUi();
        await open(ctx, 'farm');

        ctx.testid('farm-entry-miniboss-1').click();

        expect(ctx.hooks.resume).toHaveBeenCalledTimes(1);
        expect(ctx.hooks.startFarm).toHaveBeenCalledWith({ kind: 'MINIBOSS', stage: 1 });
        expect(ctx.ui.isOpen).toBe(false);
    });

    it('shows an error line when the farm state cannot be loaded', async () => {
        const ctx = createUi({ farmGet: new ApiError('Cannot reach the server. Try again later.') });

        await open(ctx, 'farm');

        expect(ctx.query('.hero-error').textContent).toBe('Não foi possível carregar.');
        expect(ctx.testid('farm-list')).toBeNull();
    });
});

describe('HeroUi skill bar', () => {
    it('is empty until the heroes load and then shows the three slots of the leader', async () => {
        const ctx = createUi();

        expect(ctx.root[2].querySelectorAll('.skill-slot')).toHaveLength(0);

        await ctx.heroes.load();

        expect(ctx.root[2].querySelectorAll('.skill-slot')).toHaveLength(3);
        expect(ctx.testid('skill-slot-2').querySelector('.skill-slot-name').textContent).toBe('Skill 2');
    });

    it('updates the lock marks when the leader gets stars without reloading', async () => {
        const ctx = createUi();
        await ctx.heroes.load();
        ctx.heroesGateway.fuse.mockResolvedValue(hero('kael', { 2: 1 }));

        await ctx.heroes.fuse('kael', 1);

        expect(ctx.root[2].querySelectorAll('.skill-slot.is-locked')).toHaveLength(1);
    });
});

describe('HeroUi Fusão without fusions', () => {
    it('says no fusion is available when no hero has 3 copies', async () => {
        const ctx = createUi({ list: { leaderId: 'kael', heroes: [ hero('kael', { 0: 2 }), hero('lyra') ] } });

        await open(ctx, 'fusion');

        expect(ctx.testid('fusion-empty').textContent).toBe('Nenhuma fusão disponível');
        expect(ctx.testid('fusion-list')).toBeNull();
    });
});

describe('HeroUi bag badge', () => {
    it('has no red dot until a card drops', () => {
        const { testid } = createUi();

        expect(testid('bag-badge').hidden).toBe(true);
    });

    it('a dropped card lights the red dot on the bag button and opening the bag clears it', async () => {
        const ctx = createUi();

        ctx.ui.showDrop({ heroId: 'lyra', heroName: 'Lyra Folhaveloz', stars: 0 });

        expect(ctx.testid('bag-badge').hidden).toBe(false);
        expect(ctx.testid('hud-bag').contains(ctx.testid('bag-badge'))).toBe(true);

        await open(ctx, 'bag');

        expect(ctx.testid('bag-badge').hidden).toBe(true);
    });

    it('a card that drops while the bag is open leaves the dot off', async () => {
        const ctx = createUi();
        await open(ctx, 'bag');

        ctx.ui.showDrop({ heroId: 'lyra', heroName: 'Lyra Folhaveloz', stars: 0 });

        expect(ctx.testid('bag-badge').hidden).toBe(true);
    });

    it('a card that drops over another screen lights the dot', async () => {
        const ctx = createUi();
        await open(ctx, 'heroes');

        ctx.ui.showDrop({ heroId: 'lyra', heroName: 'Lyra Folhaveloz', stars: 0 });

        expect(ctx.testid('bag-badge').hidden).toBe(false);
    });
});

describe('HeroUi card notice', () => {
    it('shows "Carta: <nome>" for 3 s', () => {
        const { ui, testid, timers } = createUi();

        ui.showDrop({ heroId: 'lyra', heroName: 'Lyra Folhaveloz', stars: 0 });

        expect(testid('card-notice').textContent).toBe('Carta: Lyra Folhaveloz');
        expect(testid('card-notice').hidden).toBe(false);
        expect(timers.map((timer) => timer.delay)).toEqual([ 3000 ]);

        timers[0].callback();

        expect(testid('card-notice').hidden).toBe(true);
    });

    it('a newer card replaces the notice and the older timer does not hide it', () => {
        const { ui, testid, timers } = createUi();

        ui.showDrop({ heroId: 'lyra', heroName: 'Lyra Folhaveloz', stars: 0 });
        ui.showDrop({ heroId: 'kael', heroName: 'Kael Raizférrea', stars: 0 });
        timers[0].callback();

        expect(testid('card-notice').textContent).toBe('Carta: Kael Raizférrea');
        expect(testid('card-notice').hidden).toBe(false);

        timers[1].callback();

        expect(testid('card-notice').hidden).toBe(true);
    });
});

beforeEach(() => {
    vi.restoreAllMocks();
});
