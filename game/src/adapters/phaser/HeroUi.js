import { farmMapPosition } from '../../domain/campaign/bossMap';
import { bagPieces, selectedInBag, sellNotice as sellNoticeText, toggleRarity, toggleSelected } from '../../domain/equipment/bulkSell';
import { dropLabel, wornBy } from '../../domain/equipment/equipment';
import { leaderStats } from '../../domain/equipment/leaderStats';
import { raisedSkills } from '../../domain/heroes/bagCards';
import { activePassives } from '../../domain/heroes/team';
import { raisedSkillSlot, skillLevelOf } from '../../domain/skills/skillLevel';
import { renderBagCards } from './views/bagView';
import { renderCatalog, renderHeroDetail } from './views/catalogView';
import { renderEquipment, renderEquipmentUnavailable, renderLeaderStats, renderPieceDetail } from './views/equipmentView';
import { el } from './views/dom';
import { renderFarm } from './views/farmView';
import { renderBagHero, renderFuseAllResult } from './views/fusionLadderView';
import { renderFusionResult } from './views/fusionView';
import { renderLeaderPicker } from './views/leaderView';
import { refreshSkillBar, renderLeaderCard, renderSkillBar } from './views/skillBar';
import { renderTeam, teamModel } from './views/teamView';
import { renderTalents, renderTalentsUnavailable } from './views/talentsView';

const HUD = { x: 956, y: 370 };
const PANEL = { x: 512, y: 384 };
//  The leader and the skill bar share the cream battle bar along the bottom
const LEADER = { x: 154, y: 686 };
//  The skills sit 36 px further left so the round auto click and farm buttons fit at the right end of the bar (spec ui-redesign D1)
const SKILL_BAR = { x: 550, y: 686 };
const NOTICE = { x: 512, y: 120 };
const NOTICE_MS = 3000;

//  Lucide icons at stroke 2.75, one per hero button
const icon = (paths) => `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
const ICONS = {
    heroes: icon('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>'),
    bag: icon('<path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"></path><path d="M8 10h8"></path><path d="M8 18h8"></path><path d="M8 22v-6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v6"></path><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"></path>'),
    leader: icon('<path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"></path><path d="M5 21h14"></path>'),
    equipment: icon('<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path>'),
    talents: icon('<path d="M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3"></path><path d="M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4"></path><path d="M5 21h14"></path>'),
    team: icon('<path d="M14.5 17.5 3 6V3h3l11.5 11.5"></path><path d="m13 19 6-6"></path><path d="m16 16 4 4"></path><path d="m19 21 2-2"></path><path d="M14.5 6.5 18 3h3v3l-3.5 3.5"></path><path d="m5 14 4 4"></path><path d="m7 17-3 3"></path><path d="m3 19 2 2"></path>'),
    farm: icon('<path d="M15 22a1 1 0 0 0 1-1v-1a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20v1a1 1 0 0 0 1 1z"></path><circle cx="15" cy="12" r="1"></circle><circle cx="9" cy="12" r="1"></circle>')
};

const SCREENS = [
    { id: 'heroes', label: 'Heróis', title: 'Heróis' },
    { id: 'bag', label: 'Mochila', title: 'Mochila' },
    { id: 'leader', label: 'Líder', title: 'Líder' },
    { id: 'team', label: 'Equipe', title: 'Equipe' },
    { id: 'equipment', label: 'Equipamento', title: 'Equipamento' },
    { id: 'talents', label: 'Talentos', title: 'Talentos' },
    { id: 'farm', label: 'Rever chefes', title: 'Rever chefes' }
];

//  Where the map assumes the player stands while the campaign has not loaded
const DEFAULT_POSITION = { chapter: 1, stage: 1, kind: 'PHASE', stageCount: 10, completed: false };

const LOAD_FAILED = 'Não foi possível carregar.';
const FUSE_FAILED = 'Não foi possível fundir as cartas.';
const LEADER_FAILED = 'Não foi possível trocar o líder.';
const EQUIPMENT_FAILED = 'Não foi possível concluir a ação.';
const TALENT_FAILED = 'Não foi possível melhorar o talento.';
const TALENT_RESET_FAILED = 'Não foi possível reiniciar os talentos.';
const NOT_ENOUGH_COPPER = 'Moedas insuficientes';
const NOT_ENOUGH_TALENT_POINTS = 'Pontos de talento insuficientes';

//  The bag button carries a red dot while the bag holds a card the player has not looked at yet; the talents button carries one with the unspent points
//  and the Equipamento button while it holds a piece the player has not looked at yet
const BADGED = [ 'bag', 'equipment', 'talents' ];
const MAX_BADGE_COUNT = 9;
const badgeHtml = (id) => `<span class="hud-badge" data-testid="${id}-badge" hidden></span>`;
const buttonHtml = ({ id, label }) => `<button type="button" data-testid="hud-${id}">${ICONS[id]}${label}${BADGED.includes(id) ? badgeHtml(id) : ''}</button>`;
//  The Equipe button joins the rail only while the team is unlocked (refreshTeamButton), so the rail keeps six buttons for the others
const RAIL = SCREENS.filter(({ id }) => id !== 'team');
const HUD_HTML = `<div class="hero-hud">${RAIL.map(buttonHtml).join('')}</div>`;

const PANEL_HTML = '<div class="hero-panel" hidden><div class="hero-window">'
    + '<div class="hero-header"><span class="hero-title"></span><span>'
    + '<button type="button" class="hero-back" data-testid="hero-back" hidden>Voltar</button> '
    + '<button type="button" class="hero-close" data-testid="hero-close">Fechar</button></span></div>'
    + '<p class="hero-error" role="alert" hidden></p><div class="hero-body"></div></div></div>';

const BAR_HTML = '<div class="skill-bar-host"></div>';
const LEADER_HTML = '<div class="leader-host"></div>';
const NOTICE_HTML = '<div class="hud-box hud-notice"><div class="card-notice" data-testid="card-notice" hidden></div></div>';

//  The hero screens on top of the combat scene: seven HUD buttons at most (the Equipe button only while the team is unlocked), one panel
//  that shows the screen that was opened (Heróis, Mochila, Líder, Equipe, Equipamento, Talentos, Rever chefes), the skill bar of the leader and the "Carta: <nome>" and "Equipamento encontrado: <peça>" notices.
//  It is plain DOM placed with scene.add.dom.
//  Collaborators: heroes (heroCollection), equipment (equipmentCollection), talents (talentCollection), farm (farmSession) and the scene hooks
//    walletCopper() -> the copper the player holds, to disable what costs more;
//    startFarm(boss) starts the farm fight of the chosen boss;
//    useSkill(slot) uses a skill of the leader (optional); skillState(slot) -> { state, seconds } of a slot of the leader (optional);
//    mapPosition() -> { chapter, stage, kind, stageCount, completed } where the player stands, for the chapter map (optional).
export class HeroUi
{
    constructor (scene, { heroes, equipment, talents, farm, startFarm, walletCopper, useSkill, skillState, mapPosition })
    {
        this.scene = scene;
        this.heroes = heroes;
        this.equipment = equipment;
        this.talents = talents;
        this.talentBusy = false;
        this.equipBusy = false;
        this.sellMode = null;
        this.fusionBusy = false;
        //  The fusion request that runs: { heroId, target } where target is the star layer of a row fusion or 'all'; null when none runs
        this.fusionPending = null;
        this.bagHeroId = null;
        this.fuseAllAsking = false;
        this.farm = farm;
        this.hooks = { startFarm, walletCopper, useSkill, skillState, mapPosition };
        this.open = false;
        this.view = 0;
        this.noticeId = 0;
        this.farmBusy = false;
        //  The Equipe screen: the selected ally slot, a request running, the slot of the purchase question, the notice and the slot to flash
        this.teamSelected = null;
        this.teamBusy = false;
        this.teamAsking = null;
        this.teamNotice = null;
        this.teamFlash = null;

        this.hudElement = scene.add.dom(HUD.x, HUD.y).createFromHTML(HUD_HTML);

        const hud = this.hudElement.node;

        this.bagBadge = hud.querySelector('[data-testid="bag-badge"]');
        this.equipmentBadge = hud.querySelector('[data-testid="equipment-badge"]');
        this.talentsBadge = hud.querySelector('[data-testid="talents-badge"]');
        this.talents.onChange?.(() => this.refreshTalentsBadge());
        this.screen = null;

        RAIL.forEach(({ id }) => hud.querySelector(`[data-testid="hud-${id}"]`).addEventListener('click', () => this.show(id)));

        const holder = document.createElement('div');

        holder.innerHTML = buttonHtml(SCREENS.find(({ id }) => id === 'team'));
        this.teamButton = holder.firstElementChild;
        this.teamButton.addEventListener('click', () => this.show('team'));

        //  Above the HUD buttons, which are added first
        this.panelElement = scene.add.dom(PANEL.x, PANEL.y).createFromHTML(PANEL_HTML).setDepth(1);
        this.panel = this.panelElement.node.querySelector('.hero-panel');
        this.title = this.panel.querySelector('.hero-title');
        this.errorLine = this.panel.querySelector('.hero-error');
        this.body = this.panel.querySelector('.hero-body');
        this.backButton = this.panel.querySelector('.hero-back');
        this.panel.querySelector('.hero-close').addEventListener('click', () => this.close());
        this.backButton.addEventListener('click', () => this.goBack());
        this.goBack = () => {};

        //  Not click-through: a click on a skill slot must not reach the canvas and hit the monster
        this.barHost = this.createDom(SKILL_BAR, BAR_HTML).querySelector('.skill-bar-host');
        this.notice = this.createDom(NOTICE, NOTICE_HTML, false).querySelector('.card-notice');
        this.leaderHost = this.createDom(LEADER, LEADER_HTML, false).querySelector('.leader-host');

        heroes.onChange(() =>
        {
            this.updateSkillBar();
            this.refreshTeamButton();
        });
        this.updateSkillBar();
        this.refreshTeamButton();
    }

    //  The Equipe button is in the rail right after Líder while the team is unlocked, and absent otherwise (the rail keeps six buttons)
    refreshTeamButton ()
    {
        const unlocked = this.heroes.team().unlocked;
        const inRail = this.teamButton.parentNode !== null;

        if (unlocked && !inRail)
        {
            this.hudElement.node.querySelector('[data-testid="hud-leader"]').after(this.teamButton);
            this.hudElement.updateSize?.();
        }
        else if (!unlocked && inRail)
        {
            this.teamButton.remove();
            this.hudElement.updateSize?.();
        }
    }

    //  An element placed on the scene; the node returned holds the html. Click-through unless it is a control.
    createDom ({ x, y }, html, interactive = true)
    {
        const element = this.scene.add.dom(x, y).createFromHTML(html);

        if (!interactive)
        {
            element.pointerEvents = 'none';
        }

        return element.node;
    }

    get isOpen ()
    {
        return this.open;
    }

    //  Opens a screen by id; the fight keeps running behind it (spec background-fight)
    async show (screen, options = {})
    {
        const { title } = SCREENS.find(({ id }) => id === screen);
        const view = ++this.view;

        this.dropFarmLoad();

        if (!this.open)
        {
            this.open = true;
            this.panel.hidden = false;
            this.panelElement.updateSize?.();
        }

        this.screen = screen;
        this.sellMode = null;
        this.bagHeroId = null;
        this.fuseAllAsking = false;
        this.teamSelected = null;
        this.teamBusy = false;
        this.teamAsking = null;
        this.teamNotice = null;
        this.teamFlash = null;
        this.title.textContent = title;
        this.setError('');

        if (screen === 'bag')
        {
            this.bagBadge.hidden = true;
        }

        if (screen === 'equipment')
        {
            this.equipmentBadge.hidden = true;
        }
        this.body.replaceChildren();
        this.backButton.hidden = true;

        try
        {
            if (screen === 'farm')
            {
                await this.farm.load(options.chapter);
            }
            else if (screen === 'equipment' || screen === 'team')
            {
                await Promise.all([ this.heroes.load(), this.equipment.load() ]);
            }
            else if (screen === 'talents')
            {
                await this.talents.load();
            }
            else
            {
                await this.heroes.load();
            }
        }
        catch
        {
            if (view === this.view)
            {
                //  The equipment screen says so in the body: the fight keeps the attacker it had
                if (screen === 'equipment')
                {
                    this.body.replaceChildren(renderEquipmentUnavailable());
                }
                else if (screen === 'talents')
                {
                    this.body.replaceChildren(renderTalentsUnavailable());
                }
                else
                {
                    this.setError(LOAD_FAILED);
                }
            }

            return;
        }

        if (view !== this.view)
        {
            return;
        }

        this[`render_${screen}`](options);
    }

    close ()
    {
        if (!this.open)
        {
            return;
        }

        this.view += 1;
        this.dropFarmLoad();
        this.open = false;
        this.screen = null;
        this.sellMode = null;
        this.bagHeroId = null;
        this.fuseAllAsking = false;
        this.panel.hidden = true;
        this.body.replaceChildren();
    }

    //  Leaving Rever chefes or opening a screen over it drops a pending chapter load (TD-009): the chips are enabled again and the
    //  farm session ignores its late answer. Runs before `this.screen` changes, so it reads the screen being left.
    dropFarmLoad ()
    {
        this.farmBusy = false;

        if (this.screen === 'farm')
        {
            this.farm.cancel();
        }
    }

    setError (text)
    {
        this.errorLine.textContent = text;
        this.errorLine.hidden = text === '';
    }

    //  A detail view with a way back to the list it came from
    showDetail (node, back)
    {
        this.body.replaceChildren(node);
        this.goBack = back;
        this.backButton.hidden = false;
    }

    render_heroes ()
    {
        this.setError('');
        this.body.replaceChildren(renderCatalog(this.heroes.heroes(), {
            onSelect: (hero) => this.showDetail(renderHeroDetail(hero), () => this.render_heroes())
        }));
    }

    render_bag ({ keepError = false } = {})
    {
        if (!keepError)
        {
            this.setError('');
        }
        this.bagHeroId = null;
        this.fuseAllAsking = false;
        this.backButton.hidden = true;
        this.body.replaceChildren(renderBagCards(this.heroes.heroes(), { onSelect: (hero) => this.openBagHero(hero.id) }));
    }

    //  The detail of one hero of the Mochila; `result` is the result line node of the last fusion, or null
    openBagHero (heroId, { result = null } = {})
    {
        const hero = this.heroes.heroes().find((candidate) => candidate.id === heroId);

        this.bagHeroId = heroId;
        this.showDetail(renderBagHero(hero, {
            busy: this.fusionBusy,
            pending: this.fusionPending?.heroId === heroId ? this.fusionPending.target : null,
            confirming: this.fuseAllAsking,
            result,
            onFuse: (stars) => this.fuse(heroId, stars),
            onFuseAll: () => this.askFuseAll(),
            onConfirmAll: () => this.fuseAll(heroId),
            onDeclineAll: () => this.declineFuseAll()
        }), () => this.render_bag());
    }

    //  After a fusion answer: nothing when the panel moved on; the detail of the same hero with the result; else what is shown now
    redrawBag (view, heroId, result)
    {
        if (view !== this.view || this.screen !== 'bag')
        {
            return;
        }

        if (this.bagHeroId === heroId)
        {
            this.openBagHero(heroId, { result });
        }
        else if (this.bagHeroId !== null)
        {
            this.openBagHero(this.bagHeroId);
        }
        else
        {
            this.render_bag({ keepError: true });
        }
    }

    async fuse (heroId, stars)
    {
        if (this.fusionBusy)
        {
            return;
        }

        const view = this.view;
        let result = null;

        this.fusionBusy = true;
        this.fusionPending = { heroId, target: stars };
        this.openBagHero(heroId);

        try
        {
            const hero = await this.heroes.fuse(heroId, stars);

            if (view === this.view)
            {
                this.setError('');

                const raised = hero.skills?.find((skill) => skill.slot === raisedSkillSlot(stars + 1));

                result = renderFusionResult({ heroName: hero.name, stars: stars + 1, skillName: raised?.name ?? '', level: skillLevelOf(raised) });
            }
        }
        catch
        {
            if (view === this.view)
            {
                this.setError(FUSE_FAILED);
            }
        }
        finally
        {
            this.fusionBusy = false;
            this.fusionPending = null;
            this.redrawBag(view, heroId, result);
        }
    }

    //  Fundir tudo asks first: the detail redraws with the question and the preview, and nothing is sent until Sim, fundir
    askFuseAll ()
    {
        if (this.fusionBusy || this.bagHeroId === null)
        {
            return;
        }

        this.fuseAllAsking = true;
        this.openBagHero(this.bagHeroId);
    }

    declineFuseAll ()
    {
        this.fuseAllAsking = false;
        this.openBagHero(this.bagHeroId);
    }

    //  One request fuses every layer of the hero; the answer is the best card and the number of fusions
    async fuseAll (heroId)
    {
        if (this.fusionBusy)
        {
            return;
        }

        const view = this.view;
        const before = this.heroes.heroes().find((candidate) => candidate.id === heroId);
        let result = null;

        this.fusionBusy = true;
        this.fusionPending = { heroId, target: 'all' };
        this.fuseAllAsking = false;
        this.openBagHero(heroId);

        try
        {
            const { hero, fusions } = await this.heroes.fuseAll(heroId);

            if (view === this.view)
            {
                this.setError('');
                result = renderFuseAllResult({ heroName: hero.name, fusions, stars: hero.stars, raised: raisedSkills(before?.skills, hero.skills) });
            }
        }
        catch
        {
            if (view === this.view)
            {
                this.setError(FUSE_FAILED);
            }
        }
        finally
        {
            this.fusionBusy = false;
            this.fusionPending = null;
            this.redrawBag(view, heroId, result);
        }
    }

    render_leader ()
    {
        this.setError('');
        this.body.replaceChildren(renderLeaderPicker(this.heroes.heroes(), this.heroes.leaderId(), {
            onPick: (heroId) => this.pickLeader(heroId)
        }));
    }

    async pickLeader (heroId)
    {
        const view = this.view;

        try
        {
            await this.heroes.setLeader(heroId);

            if (view === this.view)
            {
                this.render_leader();
            }
        }
        catch
        {
            if (view === this.view)
            {
                this.setError(LEADER_FAILED);
            }
        }
    }

    //  The Equipe screen of the stored team
    render_team ()
    {
        this.body.replaceChildren(renderTeam(teamModel({
            team: this.heroes.team(),
            heroes: this.heroes.heroes(),
            leaderId: this.heroes.leaderId(),
            pieces: this.equipment.pieces(),
            position: this.hooks.mapPosition?.() ?? DEFAULT_POSITION,
            selected: this.teamSelected,
            busy: this.teamBusy,
            asking: this.teamAsking,
            notice: this.teamNotice,
            flashSlot: this.teamFlash,
            walletCopper: this.hooks.walletCopper()
        }), {
            onSlot: (slot) => this.selectTeamSlot(slot),
            onPick: (heroId) => this.pickTeamHero(heroId),
            onRemove: () => this.removeTeamHero(),
            onMakeLeader: () => this.makeTeamLeader(),
            onConfirmBuy: () => this.confirmTeamSlot(),
            onCancelBuy: () => this.cancelTeamSlot()
        }));
    }

    //  The editing of the team arrives with the next tasks
    selectTeamSlot ()
    {
    }

    pickTeamHero ()
    {
    }

    removeTeamHero ()
    {
    }

    makeTeamLeader ()
    {
    }

    confirmTeamSlot ()
    {
    }

    cancelTeamSlot ()
    {
    }

    //  The attributes of the leader with the pieces it wears now, or null without a leader
    leaderStatsFor ()
    {
        const leader = this.heroes.leader();

        if (!leader)
        {
            return null;
        }

        const passives = activePassives({
            team: this.heroes.team(), heroes: this.heroes.heroes(), leaderId: this.heroes.leaderId(), position: this.hooks.mapPosition?.() ?? DEFAULT_POSITION
        });

        return { name: leader.name, lines: leaderStats({ leader, pieces: wornBy(this.equipment.pieces(), leader.id), talents: this.talents.talents(), passives }) };
    }

    //  The attributes of the leader, the slots of every hero and the bag, or one piece with its actions (`selected` is a piece id)
    render_equipment ({ selected = null, notice = null, sellNotice = null } = {})
    {
        const piece = this.equipment.pieces().find((candidate) => candidate.id === selected);
        const owned = this.heroes.heroes();
        const stats = this.leaderStatsFor();

        if (!piece)
        {
            this.body.replaceChildren(renderEquipment(this.equipment.pieces(), owned, {
                stats,
                leaderId: this.heroes.leaderId(),
                notice,
                sellNotice,
                busy: this.equipBusy,
                onSelect: (picked) => this.render_equipment({ selected: picked.id }),
                onTransfer: (fromHeroId, toHeroId) => this.transferSet(fromHeroId, toHeroId),
                onStartSelling: () => this.startSelling(),
                onDrop: (picked, heroId) => this.dropEquip(picked.id, heroId),
                selection: this.sellingOptions()
            }));
            this.backButton.hidden = true;

            return;
        }

        const detail = renderPieceDetail(piece, owned, this.hooks.walletCopper(), {
            onEquip: (heroId) => this.act(() => this.equipment.equip(piece.id, heroId), piece.id),
            onUnequip: () => this.act(() => this.equipment.unequip(piece.id), piece.id),
            onRefine: () => this.act(() => this.equipment.refine(piece.id), piece.id),
            onReroll: (affix) => this.act(() => this.equipment.reroll(piece.id, affix), piece.id),
            onSell: () => this.act(() => this.equipment.sell(piece.id), piece.id)
        });

        //  The panel stays above the piece, so an equip, a removal or a refine shows its effect at once
        const screen = el('div', 'equip-with-stats');

        screen.append(...(stats ? [ renderLeaderStats(stats) ] : []), detail);
        this.showDetail(screen, () => this.render_equipment());
    }

    //  Moves the whole set of a hero to another one: every equipment button is disabled while the requests run, then the list shows the
    //  result (the pieces under the target, the source empty) with `Conjunto transferido para <nome>`; a failure shows the error line
    async transferSet (fromHeroId, toHeroId)
    {
        const view = this.view;
        const target = this.heroes.heroes().find((hero) => hero.id === toHeroId);
        let notice = null;

        this.equipBusy = true;
        this.render_equipment();

        try
        {
            await this.equipment.transferSet(fromHeroId, toHeroId);

            if (view === this.view)
            {
                this.setError('');
                notice = `Conjunto transferido para ${target.name}`;
            }
        }
        catch
        {
            if (view === this.view)
            {
                this.setError(EQUIPMENT_FAILED);
            }
        }
        finally
        {
            this.equipBusy = false;

            if (view === this.view && this.screen === 'equipment')
            {
                this.render_equipment({ notice });
            }
        }
    }

    //  A piece dropped on a hero (spec drag-equip): one equip request, every equipment button disabled while it runs, then the list again
    //  (never the piece); a refusal shows the error line and the list as it was
    async dropEquip (pieceId, heroId)
    {
        if (this.equipBusy)
        {
            return;
        }

        const view = this.view;

        this.equipBusy = true;
        this.render_equipment();

        try
        {
            await this.equipment.equip(pieceId, heroId);

            if (view === this.view)
            {
                this.setError('');
            }
        }
        catch
        {
            if (view === this.view)
            {
                this.setError(EQUIPMENT_FAILED);
            }
        }
        finally
        {
            this.equipBusy = false;

            if (view === this.view && this.screen === 'equipment')
            {
                this.render_equipment();
            }
        }
    }

    //  Runs an equipment action and shows the piece again (the list when the piece is gone); a refusal shows an error line
    async act (task, pieceId)
    {
        const view = this.view;

        try
        {
            await task();

            if (view === this.view)
            {
                this.setError('');
                this.render_equipment({ selected: pieceId });
            }
        }
        catch
        {
            if (view === this.view)
            {
                this.setError(EQUIPMENT_FAILED);
            }
        }
    }

    //  The bulk sale. `sellMode` is null (mode off) or { ids: Set<string>, confirming }. Selecting only changes the selection; `Sim, vender`
    //  sends one request for the pieces still in the bag, in bag order. The screen is busy (`equipBusy`) while it runs.
    sellingOptions ()
    {
        if (!this.sellMode)
        {
            return null;
        }

        return {
            ids: this.sellMode.ids,
            confirming: this.sellMode.confirming,
            onToggle: (piece) => this.toggleSale(piece.id),
            onRarity: (rarity) => this.toggleSaleRarity(rarity),
            onSubmit: () => this.askSale(),
            onCancel: () => this.cancelSale(),
            onConfirm: () => this.sellSelected(),
            onDecline: () => this.declineSale()
        };
    }

    startSelling ()
    {
        this.setError('');
        this.sellMode = { ids: new Set(), confirming: false };
        this.render_equipment();
    }

    toggleSale (pieceId)
    {
        this.sellMode = { ...this.sellMode, ids: toggleSelected(this.sellMode.ids, pieceId) };
        this.render_equipment();
    }

    toggleSaleRarity (rarity)
    {
        this.sellMode = { ...this.sellMode, ids: toggleRarity(this.sellMode.ids, bagPieces(this.equipment.pieces()), rarity) };
        this.render_equipment();
    }

    askSale ()
    {
        this.sellMode = { ...this.sellMode, confirming: true };
        this.render_equipment();
    }

    declineSale ()
    {
        this.sellMode = { ...this.sellMode, confirming: false };
        this.render_equipment();
    }

    cancelSale ()
    {
        this.setError('');
        this.sellMode = null;
        this.render_equipment();
    }

    //  Sells the selection in one request. On success the selection ends and the notice shows the sale; on a failure the error line shows and
    //  the pieces still in the bag stay selected. An answer that arrives after the window was closed (or moved on) draws nothing.
    async sellSelected ()
    {
        if (this.equipBusy || !this.sellMode)
        {
            return;
        }

        const view = this.view;
        const ids = selectedInBag(this.sellMode.ids, this.equipment.pieces());
        let sellNotice = null;

        this.equipBusy = true;
        this.render_equipment();

        try
        {
            const { sold, earned } = await this.equipment.sellMany(ids);

            if (view === this.view)
            {
                this.setError('');
                this.sellMode = null;
                sellNotice = sellNoticeText(sold, earned);
            }
        }
        catch
        {
            if (view === this.view)
            {
                this.setError(EQUIPMENT_FAILED);
                this.sellMode = { ids: new Set(selectedInBag(this.sellMode.ids, this.equipment.pieces())), confirming: false };
            }
        }
        finally
        {
            this.equipBusy = false;

            if (view === this.view && this.screen === 'equipment')
            {
                this.render_equipment({ sellNotice });
            }
        }
    }

    //  The three branches of the talent tree; `busy` disables every button while an upgrade runs
    render_talents ()
    {
        this.backButton.hidden = true;
        this.body.replaceChildren(renderTalents(this.talents.talents(), this.talents.points(), {
            busy: this.talentBusy,
            onUpgrade: (talent) => this.upgradeTalent(talent),
            onReset: () => this.resetTalents()
        }));
    }

    //  Buys the next level of a talent for the level the player saw; a refusal shows its text and the tree the backend answered after it
    async upgradeTalent (talent)
    {
        const view = this.view;

        this.talentBusy = true;
        this.render_talents();

        try
        {
            await this.talents.upgrade(talent.id, talent.level);

            if (view === this.view)
            {
                this.setError('');
            }
        }
        catch (error)
        {
            if (view === this.view)
            {
                this.setError(error.code === 'NOT_ENOUGH_TALENT_POINTS' ? NOT_ENOUGH_TALENT_POINTS : TALENT_FAILED);
            }
        }
        finally
        {
            this.talentBusy = false;

            if (view === this.view && this.screen === 'talents')
            {
                this.render_talents();
            }
        }
    }

    //  Takes back every talent level so the player can spend the points again
    async resetTalents ()
    {
        const view = this.view;

        this.talentBusy = true;
        this.render_talents();

        try
        {
            await this.talents.reset();

            if (view === this.view)
            {
                this.setError('');
            }
        }
        catch
        {
            if (view === this.view)
            {
                this.setError(TALENT_RESET_FAILED);
            }
        }
        finally
        {
            this.talentBusy = false;

            if (view === this.view && this.screen === 'talents')
            {
                this.render_talents();
            }
        }
    }

    render_farm ()
    {
        this.setError('');

        const current = this.hooks.mapPosition?.() ?? DEFAULT_POSITION;
        const listed = this.farm.chapter();
        const definition = listed === null ? null : this.farm.definitionOf(listed);
        const map = farmMapPosition(current, listed, definition?.stages?.length ?? current.stageCount);
        //  The fight of another chapter than the campaign's carries that chapter; the current chapter's fight stays as it was
        const other = listed !== null && listed !== current.chapter;

        this.body.replaceChildren(renderFarm(this.farm.bosses(), this.farm.winsLeft(), {
            map,
            chapters: this.farm.chapters(),
            chapter: listed,
            currentChapter: current.chapter,
            busy: this.farmBusy,
            onChapter: (chapter) => this.selectFarmChapter(chapter),
            onPick: (boss) =>
            {
                this.close();
                this.hooks.startFarm(other ? { ...boss, chapter: listed } : boss);
            }
        }));
    }

    //  Loads another chapter of Rever chefes; the chips are disabled meanwhile and a failure keeps the map shown before.
    //  A load dropped by show() or close() changes nothing when it ends: its view is old and farmBusy may belong to a newer load.
    async selectFarmChapter (chapter)
    {
        if (this.farmBusy)
        {
            return;
        }

        const view = this.view;
        let failed = false;

        this.farmBusy = true;
        this.render_farm();

        try
        {
            await this.farm.load(chapter);
        }
        catch
        {
            failed = true;
        }
        finally
        {
            if (view === this.view)
            {
                this.farmBusy = false;

                if (this.screen === 'farm')
                {
                    this.render_farm();

                    //  After the render: render_farm clears the error line first
                    if (failed)
                    {
                        this.setError(LOAD_FAILED);
                    }
                }
            }
        }
    }

    //  The leader card and its three slots; empty until the heroes load
    updateSkillBar ()
    {
        this.leaderHost.replaceChildren(renderLeaderCard(this.heroes.leader()));
        this.barHost.replaceChildren(renderSkillBar(this.heroes.leader(), { onUse: (slot) => this.hooks.useSkill?.(slot) }));
        this.refreshSkills();
    }

    //  Writes the cooldown and cast state of each slot of the bar; the scene calls it every frame
    refreshSkills ()
    {
        const bar = this.barHost.querySelector('.skill-bar');

        if (bar && this.hooks.skillState)
        {
            refreshSkillBar(bar, this.hooks.skillState);
        }
    }

    //  "Carta: <nome>" for 3 s; a newer card replaces it and restarts the 3 s
    showDrop (drop)
    {
        //  A card that lands while the bag is open is seen at once
        this.bagBadge.hidden = this.open && this.screen === 'bag';
        this.showNotice(`Carta: ${drop.heroName}`);
    }

    //  "Equipamento encontrado: Raro Arma" for 3 s, in the same place as the card notice
    showEquipmentDrop (drop)
    {
        //  A piece sold on arrival (the bag was full) leaves nothing to look at; one that lands while Equipamento is open is seen at once
        if (!drop.sold)
        {
            this.equipmentBadge.hidden = this.open && this.screen === 'equipment';
        }

        this.showNotice(`Equipamento encontrado: ${dropLabel(drop.piece)}`);
    }

    //  The red dot of Talentos counts the unspent points ("+9" from 10 on) and hides at zero
    refreshTalentsBadge ()
    {
        const available = this.talents.points().available;

        this.talentsBadge.textContent = available > MAX_BADGE_COUNT ? `+${MAX_BADGE_COUNT + 1}` : String(available);
        this.talentsBadge.hidden = !(available > 0);
    }

    //  A first clear paid points: the tree is read again so the dot and the screen show them (no notice, it would hide the drop ones)
    showTalentPoints ()
    {
        this.talents.load()
            .then(() =>
            {
                if (this.open && this.screen === 'talents' && !this.talentBusy)
                {
                    this.render_talents();
                }
            })
            .catch(() => {});
    }

    showNotice (text)
    {
        const id = ++this.noticeId;

        this.notice.textContent = text;
        this.notice.hidden = false;
        this.scene.time.delayedCall(NOTICE_MS, () =>
        {
            if (id === this.noticeId)
            {
                this.notice.hidden = true;
            }
        });
    }
}
