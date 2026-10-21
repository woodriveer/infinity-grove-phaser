import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HeroUi } from './HeroUi';
import { ApiError } from '../../application/ApiError';
import { createEquipmentCollection } from '../../application/equipment/equipmentCollection';
import { createFarmSession } from '../../application/farm/farmSession';
import { createHeroCollection } from '../../application/heroes/heroCollection';
import { createTalentCollection } from '../../application/talents/talentCollection';

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

const createUi = ({ list = catalog(), farmGet = farmState(), pause = true, equipmentList = { capacity: 100, pieces: [] }, wallet = 1_000_000, skillState, talentList = { talents: [] } } = {}) => {
    const talentGateway = {
        list: vi.fn(() => (talentList instanceof Error ? Promise.reject(talentList) : Promise.resolve(talentList))),
        upgrade: vi.fn()
    };
    const heroesGateway = {
        list: vi.fn(() => (list instanceof Error ? Promise.reject(list) : Promise.resolve(list))),
        fuse: vi.fn(),
        setLeader: vi.fn()
    };
    const equipmentGateway = {
        list: vi.fn(() => (equipmentList instanceof Error ? Promise.reject(equipmentList) : Promise.resolve(equipmentList))),
        equip: vi.fn(),
        unequip: vi.fn(),
        refine: vi.fn(),
        reroll: vi.fn(),
        sell: vi.fn()
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
                element.setDepth = vi.fn(() => element);
                return element;
            })
        },
        time: { delayedCall: vi.fn((delay, callback) => { timers.push({ delay, callback }); }) }
    };
    const hooks = { pause: vi.fn(() => pause), resume: vi.fn(), startFarm: vi.fn(), walletCopper: vi.fn(() => wallet), useSkill: vi.fn(), skillState };
    const heroes = createHeroCollection({ gateway: heroesGateway });
    const farm = createFarmSession({ gateway: farmGateway });
    const equipment = createEquipmentCollection({ gateway: equipmentGateway });
    const talents = createTalentCollection({ gateway: talentGateway });
    const ui = new HeroUi(scene, { heroes, equipment, talents, farm, ...hooks });
    const root = scene.add.dom.mock.results.map((result) => result.value.node);
    const query = (selector) => root.map((node) => node.querySelector(selector)).find(Boolean) ?? null;
    const testid = (id) => query(`[data-testid="${id}"]`);

    return { ui, scene, heroes, equipment, talents, farm, heroesGateway, equipmentGateway, talentGateway, farmGateway, hooks, timers, query, testid, root };
};

const open = async (ctx, screen) => {
    ctx.testid(`hud-${screen}`).click();
    await flush();
};

describe('HeroUi HUD', () => {
    it('shows the seven buttons Heróis, Mochila, Fusão, Líder, Equipamento, Talentos and Rever chefes', () => {
        const { testid } = createUi();

        expect([ 'heroes', 'bag', 'fusion', 'leader', 'equipment', 'talents', 'farm' ].map((id) => testid(`hud-${id}`).textContent)).toEqual([
            'Heróis', 'Mochila', 'Fusão', 'Líder', 'Equipamento', 'Talentos', 'Rever chefes'
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

const talentTree = (levels = {}) => [
    [ 'MINIBOSS_TIME', 'TIME', 'Tempo do miniboss', 's', 2 ], [ 'BOSS_TIME', 'TIME', 'Tempo do chefe do capítulo', 's', 3 ],
    [ 'PHYSICAL_BREAK', 'BREAK', 'Quebra de defesa física', 'points', 1 ], [ 'MAGICAL_BREAK', 'BREAK', 'Quebra de defesa mágica', 'points', 1 ],
    [ 'CRIT_RESIST_BREAK', 'BREAK', 'Quebra de resistência a crítico', 'points', 1 ],
    [ 'CLICK_DAMAGE', 'POWER', 'Dano de clique', '%', 3 ], [ 'CRIT_CHANCE', 'POWER', 'Chance de crítico', 'points', 1 ], [ 'CRIT_DAMAGE', 'POWER', 'Dano crítico', '%', 5 ]
].map(([ id, branch, label, unit, perLevel ]) => {
    const level = levels[id] ?? 0;

    return { id, branch, label, unit, perLevel, maxLevel: 10, level, value: level * perLevel, nextCost: level >= 10 ? null : Math.round(300 * 1.6 ** level) };
});

describe('HeroUi Talentos', () => {
    it('opens the window titled Talentos with the three columns and pauses the fight', async () => {
        const ctx = createUi({ talentList: { talents: talentTree() } });

        await open(ctx, 'talents');

        expect(ctx.query('.hero-title').textContent).toBe('Talentos');
        expect(ctx.root.flatMap((node) => [ ...node.querySelectorAll('.talent-branch-title') ]).map((node) => node.textContent)).toEqual([ 'Tempo', 'Quebra de defesa', 'Poder do clique' ]);
        expect(ctx.hooks.pause).toHaveBeenCalledTimes(1);
    });

    it('sends the upgrade with fromLevel 0, shows Nível 1/10 and the new wallet state', async () => {
        const ctx = createUi({ talentList: { talents: talentTree() }, wallet: 300 });
        ctx.talentGateway.upgrade.mockResolvedValue({ talents: talentTree({ CLICK_DAMAGE: 1 }), wallet: { gold: 0, silver: 0, copper: 0 } });

        await open(ctx, 'talents');
        ctx.hooks.walletCopper.mockReturnValue(0);
        ctx.testid('talent-upgrade-CLICK_DAMAGE').click();
        await flush();

        expect(ctx.talentGateway.upgrade).toHaveBeenCalledWith('CLICK_DAMAGE', 0);
        expect(ctx.testid('talent-level-CLICK_DAMAGE').textContent).toBe('Nível 1/10');
        expect(ctx.testid('talent-effect-CLICK_DAMAGE').textContent).toBe('Efeito: +3%');
        expect(ctx.testid('talent-upgrade-CLICK_DAMAGE').disabled).toBe(true);
    });

    it('disables every Melhorar button while the request runs and enables them after', async () => {
        const ctx = createUi({ talentList: { talents: talentTree() } });
        let finish;

        ctx.talentGateway.upgrade.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
        await open(ctx, 'talents');
        ctx.testid('talent-upgrade-CLICK_DAMAGE').click();

        expect(ctx.root.flatMap((node) => [ ...node.querySelectorAll('.talent-upgrade') ]).every((button) => button.disabled)).toBe(true);

        finish({ talents: talentTree({ CLICK_DAMAGE: 1 }), wallet: { gold: 0, silver: 0, copper: 0 } });
        await flush();

        expect(ctx.testid('talent-upgrade-CRIT_CHANCE').disabled).toBe(false);
    });

    it('says Moedas insuficientes on NOT_ENOUGH_COPPER and shows the tree the backend answered', async () => {
        const ctx = createUi({ talentList: { talents: talentTree() } });

        ctx.talentGateway.upgrade.mockRejectedValue(new ApiError('Not enough', { status: 409, code: 'NOT_ENOUGH_COPPER' }));
        await open(ctx, 'talents');
        ctx.talentGateway.list.mockResolvedValue({ talents: talentTree({ CLICK_DAMAGE: 2 }) });
        ctx.testid('talent-upgrade-CLICK_DAMAGE').click();
        await flush();

        expect(ctx.query('.hero-error').textContent).toBe('Moedas insuficientes');
        expect(ctx.query('.hero-error').hidden).toBe(false);
        expect(ctx.testid('talent-level-CLICK_DAMAGE').textContent).toBe('Nível 2/10');
        expect(ctx.testid('talent-upgrade-CLICK_DAMAGE').disabled).toBe(false);
    });

    it('says Não foi possível melhorar o talento. on any other failure and reloads after a 409', async () => {
        const mismatch = createUi({ talentList: { talents: talentTree() } });

        mismatch.talentGateway.upgrade.mockRejectedValue(new ApiError('Mismatch', { status: 409, code: 'TALENT_LEVEL_MISMATCH' }));
        await open(mismatch, 'talents');
        mismatch.testid('talent-upgrade-CLICK_DAMAGE').click();
        await flush();

        expect(mismatch.query('.hero-error').textContent).toBe('Não foi possível melhorar o talento.');
        expect(mismatch.talentGateway.list).toHaveBeenCalledTimes(2);

        const down = createUi({ talentList: { talents: talentTree() } });

        down.talentGateway.upgrade.mockRejectedValue(new ApiError('down', { status: 500 }));
        await open(down, 'talents');
        down.testid('talent-upgrade-CLICK_DAMAGE').click();
        await flush();

        expect(down.query('.hero-error').textContent).toBe('Não foi possível melhorar o talento.');
        expect(down.talentGateway.list).toHaveBeenCalledTimes(1);
    });

    it('clears the error line after the next successful upgrade', async () => {
        const ctx = createUi({ talentList: { talents: talentTree() } });

        ctx.talentGateway.upgrade.mockRejectedValueOnce(new ApiError('down', { status: 500 }));
        await open(ctx, 'talents');
        ctx.testid('talent-upgrade-CLICK_DAMAGE').click();
        await flush();
        ctx.talentGateway.upgrade.mockResolvedValue({ talents: talentTree({ CLICK_DAMAGE: 1 }), wallet: { gold: 0, silver: 0, copper: 0 } });
        ctx.testid('talent-upgrade-CLICK_DAMAGE').click();
        await flush();

        expect(ctx.query('.hero-error').hidden).toBe(true);
    });

    it('says Talentos indisponíveis when the tree cannot be loaded', async () => {
        const ctx = createUi({ talentList: new ApiError('down', { status: 500 }) });

        await open(ctx, 'talents');

        expect(ctx.testid('talents-unavailable').textContent).toBe('Talentos indisponíveis');
    });

    it('does not draw the screen again after it was closed while a request ran', async () => {
        const ctx = createUi({ talentList: { talents: talentTree() } });
        let finish;

        ctx.talentGateway.upgrade.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
        await open(ctx, 'talents');
        ctx.testid('talent-upgrade-CLICK_DAMAGE').click();
        ctx.ui.close();
        finish({ talents: talentTree({ CLICK_DAMAGE: 1 }), wallet: { gold: 0, silver: 0, copper: 0 } });
        await flush();

        expect(ctx.query('.hero-body').childElementCount).toBe(0);
    });
});

describe('HeroUi equipment badge', () => {
    it('has no red dot until a piece drops', () => {
        const { testid } = createUi();

        expect(testid('equipment-badge').hidden).toBe(true);
    });

    it('a dropped piece lights the red dot on the Equipamento button and opening the screen clears it', async () => {
        const ctx = createUi({ equipmentList: { capacity: 100, pieces: [ piece() ] } });

        ctx.ui.showEquipmentDrop({ piece: piece(), sold: false });

        expect(ctx.testid('equipment-badge').hidden).toBe(false);
        expect(ctx.testid('hud-equipment').contains(ctx.testid('equipment-badge'))).toBe(true);

        await open(ctx, 'equipment');

        expect(ctx.testid('equipment-badge').hidden).toBe(true);
    });

    it('a piece that drops while Equipamento is open leaves the dot off', async () => {
        const ctx = createUi({ equipmentList: { capacity: 100, pieces: [ piece() ] } });
        await open(ctx, 'equipment');

        ctx.ui.showEquipmentDrop({ piece: piece(), sold: false });

        expect(ctx.testid('equipment-badge').hidden).toBe(true);
    });

    it('a piece that drops over another screen lights the dot', async () => {
        const ctx = createUi();
        await open(ctx, 'heroes');

        ctx.ui.showEquipmentDrop({ piece: piece(), sold: false });

        expect(ctx.testid('equipment-badge').hidden).toBe(false);
    });

    it('a piece sold on arrival because the bag is full leaves the dot off', () => {
        const { ui, testid } = createUi();

        ui.showEquipmentDrop({ piece: piece(), sold: true });

        expect(testid('equipment-badge').hidden).toBe(true);
    });

    it('does not touch the bag red dot, and a card does not light the equipment one', () => {
        const { ui, testid } = createUi();

        ui.showEquipmentDrop({ piece: piece(), sold: false });
        expect(testid('bag-badge').hidden).toBe(true);

        ui.showDrop({ heroId: 'lyra', heroName: 'Lyra Folhaveloz', stars: 0 });
        expect(testid('bag-badge').hidden).toBe(false);
        expect(testid('equipment-badge').hidden).toBe(false);
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

const piece = (extra = {}) => ({
    id: 'r1', slot: 'RING', rarity: 'COMMON', refine: 0, heroId: null, sellPrice: 100, refineCost: 500, rerollCost: null,
    affixes: [ { type: 'CLICK_DAMAGE_PCT', value: 7 } ], ...extra
});

describe('HeroUi Equipamento', () => {
    it('loads the heroes and the pieces, pauses the fight and lists the slots and the bag', async () => {
        const ctx = createUi({ equipmentList: { capacity: 100, pieces: [ piece(), piece({ id: 'w1', slot: 'WEAPON', clickDamage: 3, heroId: 'kael' }) ] } });

        await open(ctx, 'equipment');

        expect(ctx.hooks.pause).toHaveBeenCalledTimes(1);
        expect(ctx.equipmentGateway.list).toHaveBeenCalledTimes(1);
        expect(ctx.query('.hero-title').textContent).toBe('Equipamento');
        expect(ctx.testid('equip-hero-kael')).not.toBeNull();
        expect(ctx.testid('equip-slot-kael-WEAPON').textContent).toBe('ArmaComum Arma +0');
        expect(ctx.testid('equip-piece-r1').textContent).toBe('Comum Anel +0');
    });

    it('says there is no equipment yet', async () => {
        const ctx = createUi();

        await open(ctx, 'equipment');

        expect(ctx.testid('equipment-empty').textContent).toBe('Nenhum equipamento ainda. Vença chefes para encontrar peças.');
    });

    it('says the equipment is unavailable when it cannot be loaded', async () => {
        const ctx = createUi({ equipmentList: new ApiError('down', { status: 500 }) });

        await open(ctx, 'equipment');

        expect(ctx.testid('equipment-unavailable').textContent).toBe('Equipamento indisponível');
        expect(ctx.testid('equip-hero-kael')).toBeNull();
    });

    it('shows the detail of a piece with a way back to the list', async () => {
        const ctx = createUi({ equipmentList: { capacity: 100, pieces: [ piece() ] } });

        await open(ctx, 'equipment');
        ctx.testid('equip-piece-r1').click();

        expect(ctx.testid('piece-detail')).not.toBeNull();
        expect(ctx.testid('piece-refine').textContent).toBe('Refinar (5 prata)');
        expect(ctx.testid('hero-back').hidden).toBe(false);

        ctx.testid('hero-back').click();

        expect(ctx.testid('equipment-list')).not.toBeNull();
        expect(ctx.testid('hero-back').hidden).toBe(true);
    });

    it('equips the piece on a hero and shows it worn', async () => {
        const ctx = createUi({ equipmentList: { capacity: 100, pieces: [ piece() ] } });
        ctx.equipmentGateway.equip.mockResolvedValue({ capacity: 100, pieces: [ piece({ heroId: 'lyra' }) ] });

        await open(ctx, 'equipment');
        ctx.testid('equip-piece-r1').click();
        ctx.testid('piece-equip-lyra').click();
        await flush();

        expect(ctx.equipmentGateway.equip).toHaveBeenCalledWith('r1', 'lyra');
        expect(ctx.testid('piece-worn').textContent).toBe('Equipado em Hero lyra');
    });

    it('refines the piece and shows the new level and cost', async () => {
        const ctx = createUi({ equipmentList: { capacity: 100, pieces: [ piece() ] } });
        ctx.equipmentGateway.refine.mockResolvedValue({
            equipment: { capacity: 100, pieces: [ piece({ refine: 1, refineCost: 850 }) ] }, wallet: { gold: 0, silver: 1, copper: 0 }
        });

        await open(ctx, 'equipment');
        ctx.testid('equip-piece-r1').click();
        ctx.testid('piece-refine').click();
        await flush();

        expect(ctx.equipmentGateway.refine).toHaveBeenCalledWith('r1');
        expect(ctx.query('.hero-name').textContent).toBe('Comum Anel +1');
        expect(ctx.testid('piece-refine').textContent).toBe('Refinar (8 prata 50 cobre)');
    });

    it('disables Refinar when the wallet of the scene holds less than the cost', async () => {
        const ctx = createUi({ equipmentList: { capacity: 100, pieces: [ piece() ] }, wallet: 499 });

        await open(ctx, 'equipment');
        ctx.testid('equip-piece-r1').click();

        expect(ctx.testid('piece-refine').disabled).toBe(true);
    });

    it('rerolls an affix of a piece at plus 5', async () => {
        const ctx = createUi({ equipmentList: { capacity: 100, pieces: [ piece({ refine: 5, rerollCost: 5000 }) ] } });
        ctx.equipmentGateway.reroll.mockResolvedValue({
            equipment: { capacity: 100, pieces: [ piece({ refine: 5, rerollCost: 5000, affixes: [ { type: 'CRIT_CHANCE', value: 3 } ] }) ] },
            wallet: { gold: 0, silver: 0, copper: 0 }
        });

        await open(ctx, 'equipment');
        ctx.testid('equip-piece-r1').click();
        ctx.testid('piece-reroll-0').click();
        await flush();

        expect(ctx.equipmentGateway.reroll).toHaveBeenCalledWith('r1', 0);
        expect(ctx.testid('piece-line-0').textContent).toBe('Chance de crítico +3%');
    });

    it('sells the piece and goes back to the list without it', async () => {
        const ctx = createUi({ equipmentList: { capacity: 100, pieces: [ piece(), piece({ id: 'r2' }) ] } });
        ctx.equipmentGateway.sell.mockResolvedValue({ equipment: { capacity: 100, pieces: [ piece({ id: 'r2' }) ] }, wallet: { gold: 0, silver: 1, copper: 0 } });

        await open(ctx, 'equipment');
        ctx.testid('equip-piece-r1').click();
        ctx.testid('piece-sell').click();
        await flush();

        expect(ctx.equipmentGateway.sell).toHaveBeenCalledWith('r1');
        expect(ctx.testid('equipment-list')).not.toBeNull();
        expect(ctx.testid('equip-piece-r1')).toBeNull();
        expect(ctx.testid('equip-piece-r2')).not.toBeNull();
    });

    it('shows a Portuguese error line and keeps the piece when an action is refused', async () => {
        const ctx = createUi({ equipmentList: { capacity: 100, pieces: [ piece() ] } });
        ctx.equipmentGateway.refine.mockRejectedValue(new ApiError('no copper', { status: 409, code: 'NOT_ENOUGH_COPPER' }));

        await open(ctx, 'equipment');
        ctx.testid('equip-piece-r1').click();
        ctx.testid('piece-refine').click();
        await flush();

        expect(ctx.query('.hero-error').textContent).toBe('Não foi possível concluir a ação.');
        expect(ctx.query('.hero-error').hidden).toBe(false);
        expect(ctx.testid('piece-detail')).not.toBeNull();
    });

    it('ignores an answer that arrives after the panel was closed', async () => {
        const ctx = createUi({ equipmentList: { capacity: 100, pieces: [ piece() ] } });
        ctx.equipmentGateway.sell.mockResolvedValue({ equipment: { capacity: 100, pieces: [] }, wallet: { gold: 0, silver: 0, copper: 0 } });

        await open(ctx, 'equipment');
        ctx.testid('equip-piece-r1').click();
        ctx.testid('piece-sell').click();
        ctx.ui.close();
        await flush();

        expect(ctx.query('.hero-body').childElementCount).toBe(0);
    });
});

describe('HeroUi equipment notice', () => {
    it('shows "Equipamento encontrado: <raridade> <slot>" for 3 s', () => {
        const { ui, testid, timers } = createUi();

        ui.showEquipmentDrop({ piece: piece({ rarity: 'RARE', slot: 'WEAPON' }), sold: false });

        expect(testid('card-notice').textContent).toBe('Equipamento encontrado: Raro Arma');
        expect(testid('card-notice').hidden).toBe(false);
        expect(timers.map((timer) => timer.delay)).toEqual([ 3000 ]);

        timers[0].callback();

        expect(testid('card-notice').hidden).toBe(true);
    });

    it('a newer notice replaces it and the older timer does not hide it', () => {
        const { ui, testid, timers } = createUi();

        ui.showEquipmentDrop({ piece: piece({ rarity: 'RARE', slot: 'WEAPON' }), sold: false });
        ui.showDrop({ heroId: 'lyra', heroName: 'Lyra Folhaveloz', stars: 0 });
        timers[0].callback();

        expect(testid('card-notice').textContent).toBe('Carta: Lyra Folhaveloz');
        expect(testid('card-notice').hidden).toBe(false);
    });

    it('a card then a piece: the notice of the piece shows, lasts 3 s from its own start and the card timer does not hide it', () => {
        const { ui, testid, timers } = createUi();

        ui.showDrop({ heroId: 'lyra', heroName: 'Lyra Folhaveloz', stars: 0 });
        ui.showEquipmentDrop({ piece: piece({ rarity: 'RARE', slot: 'WEAPON' }), sold: false });

        expect(timers.map((timer) => timer.delay)).toEqual([ 3000, 3000 ]);
        expect(testid('card-notice').textContent).toBe('Equipamento encontrado: Raro Arma');

        timers[0].callback();
        expect(testid('card-notice').hidden).toBe(false);

        timers[1].callback();
        expect(testid('card-notice').hidden).toBe(true);
    });

    it('does not light the bag red dot', () => {
        const { ui, testid } = createUi();

        ui.showEquipmentDrop({ piece: piece(), sold: false });

        expect(testid('bag-badge').hidden).toBe(true);
    });
});

beforeEach(() => {
    vi.restoreAllMocks();
});

describe('HeroUi skill bar hooks', () => {
    const ownedKael = () => ({ leaderId: 'kael', heroes: [ hero('kael', { 2: 1 }), hero('lyra', { 1: 1 }) ] });

    it('calls useSkill with the slot when an unlocked slot is clicked and not for a locked slot', async () => {
        const ctx = createUi({ list: ownedKael() });
        await ctx.heroes.load();

        ctx.testid('skill-slot-1').click();
        ctx.testid('skill-slot-2').click();
        ctx.testid('skill-slot-3').click();

        expect(ctx.hooks.useSkill.mock.calls).toEqual([ [ 1 ], [ 2 ] ]);
    });

    it('writes the state of each slot from skillState on refreshSkills', async () => {
        const states = { 1: { state: 'cooling', seconds: 7 }, 2: { state: 'ready', seconds: 0 }, 3: { state: 'locked', seconds: 0 } };
        const ctx = createUi({ list: ownedKael(), skillState: (slot) => states[slot] });
        await ctx.heroes.load();

        ctx.ui.refreshSkills();

        expect(ctx.testid('skill-slot-1').getAttribute('data-state')).toBe('cooling');
        expect(ctx.testid('skill-slot-1').querySelector('.skill-slot-cooldown').textContent).toBe('7s');
        expect(ctx.testid('skill-slot-2').getAttribute('data-state')).toBe('ready');
    });

    it('shows the slots of a new leader with their states at once', async () => {
        const ctx = createUi({ list: ownedKael(), skillState: (slot) => (slot === 1 ? { state: 'cooling', seconds: 4 } : { state: 'locked', seconds: 0 }) });
        ctx.heroesGateway.setLeader.mockResolvedValue({ leaderId: 'lyra' });
        await ctx.heroes.load();

        await ctx.heroes.setLeader('lyra');

        expect(ctx.testid('skill-slot-1').getAttribute('data-state')).toBe('cooling');
        expect(ctx.testid('skill-slot-1').querySelector('.skill-slot-cooldown').textContent).toBe('4s');
    });

    it('refreshes nothing without a skillState hook or a leader', () => {
        const ctx = createUi({ list: ownedKael() });

        expect(() => ctx.ui.refreshSkills()).not.toThrow();
    });
});
