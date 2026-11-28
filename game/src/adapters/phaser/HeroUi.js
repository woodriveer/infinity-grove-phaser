import { farmMapPosition } from '../../domain/campaign/bossMap';
import { bagPieces, selectedInBag, sellNotice as sellNoticeText, toggleRarity, toggleSelected } from '../../domain/equipment/bulkSell';
import { dropLabel, wornBy } from '../../domain/equipment/equipment';
import { leaderStats } from '../../domain/equipment/leaderStats';
import { GIFT_NOTICE, GIFT_NOTICE_MS } from '../../domain/equipment/specials';
import { raisedSkills } from '../../domain/heroes/bagCards';
import { activePassives, slotStates } from '../../domain/heroes/team';
import { raisedSkillSlot, skillLevelOf } from '../../domain/skills/skillLevel';
import { maxPurchase } from '../../domain/talents/talents';
import { createShiftKey } from './shiftKey';
import { renderBagCards } from './views/bagView';
import { renderCatalog, renderHeroDetail } from './views/catalogView';
import { renderEquipment, renderEquipmentUnavailable, renderLeaderStats, renderPieceDetail } from './views/equipmentView';
import { el } from './views/dom';
import { renderFarm } from './views/farmView';
import { renderBagHero, renderFuseAllResult } from './views/fusionLadderView';
import { renderFusionResult } from './views/fusionView';
import { renderLeaderPicker } from './views/leaderView';
import { renderRanking } from './views/rankingView';
import { refreshSkillBar, renderLeaderCard, renderSkillBar } from './views/skillBar';
import { renderTeam, teamModel } from './views/teamView';
import { placeTalentScroll, renderTalents, renderTalentsUnavailable, revealTalent, updateTalents } from './views/talentsView';

const HUD = { x: 956, y: 370 };
const PANEL = { x: 512, y: 384 };
//  The leader and the skill bar share the cream battle bar along the bottom
const LEADER = { x: 154, y: 686 };
//  The skills sit 36 px further left so the round auto click and farm buttons fit at the right end of the bar (spec ui-redesign D1)
const SKILL_BAR = { x: 550, y: 686 };
const NOTICE = { x: 512, y: 120 };
const NOTICE_MS = 3000;
const FLASH_MS = 400;

//  Lucide icons at stroke 2.75, one per hero button
const icon = (paths) => `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
const ICONS = {
    heroes: icon('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>'),
    bag: icon('<path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"></path><path d="M8 10h8"></path><path d="M8 18h8"></path><path d="M8 22v-6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v6"></path><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"></path>'),
    equipment: icon('<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path>'),
    talents: icon('<path d="M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3"></path><path d="M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4"></path><path d="M5 21h14"></path>'),
    team: icon('<path d="M14.5 17.5 3 6V3h3l11.5 11.5"></path><path d="m13 19 6-6"></path><path d="m16 16 4 4"></path><path d="m19 21 2-2"></path><path d="M14.5 6.5 18 3h3v3l-3.5 3.5"></path><path d="m5 14 4 4"></path><path d="m7 17-3 3"></path><path d="m3 19 2 2"></path>'),
    farm: icon('<path d="M15 22a1 1 0 0 0 1-1v-1a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20v1a1 1 0 0 0 1 1z"></path><circle cx="15" cy="12" r="1"></circle><circle cx="9" cy="12" r="1"></circle>'),
    rankings: icon('<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>')
};

const SCREENS = [
    { id: 'heroes', label: 'Heróis', title: 'Heróis' },
    { id: 'bag', label: 'Mochila', title: 'Mochila' },
    { id: 'team', label: 'Equipe', title: 'Equipe' },
    { id: 'equipment', label: 'Equipamento', title: 'Equipamento' },
    { id: 'talents', label: 'Talentos', title: 'Talentos' },
    { id: 'farm', label: 'Mapa', title: 'Mapa' },
    { id: 'rankings', label: 'Ranking', title: 'Ranking' }
];

//  Where the map assumes the player stands while the campaign has not loaded
const DEFAULT_POSITION = { chapter: 1, stage: 1, kind: 'PHASE', stageCount: 10, completed: false };

const LOAD_FAILED = 'Não foi possível carregar.';
const FUSE_FAILED = 'Não foi possível fundir as cartas.';
const LEADER_FAILED = 'Não foi possível trocar o líder.';
const TEAM_FAILED = 'Não foi possível salvar a equipe.';
const SLOT_FAILED = 'Não foi possível comprar a vaga.';
const SLOT_BOUGHT = 'Vaga de aliado comprada!';
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
//  The keys that open a screen (spec ui-polish UIP-12, handled by the scene): shown as a chip on the button and named to assistive technology
const SHORTCUTS = { bag: 'B', talents: 'T' };
const keyHtml = (id) => (SHORTCUTS[id] ? `<span class="hud-key" data-testid="hud-key-${id}" aria-hidden="true">${SHORTCUTS[id]}</span>` : '');
const buttonHtml = ({ id, label }) => `<button type="button" data-testid="hud-${id}"${SHORTCUTS[id] ? ` aria-keyshortcuts="${SHORTCUTS[id]}"` : ''}>${ICONS[id]}${label}${keyHtml(id)}${BADGED.includes(id) ? badgeHtml(id) : ''}</button>`;
//  The rail always shows the seven buttons; Equipe holds the leader card that opens the leader list (spec ui-polish UIP-13)
const RAIL = SCREENS;
const HUD_HTML = `<div class="hero-hud">${RAIL.map(buttonHtml).join('')}</div>`;

const PANEL_HTML = '<div class="hero-panel" hidden><div class="hero-window">'
    + '<div class="hero-header"><span class="hero-title"></span><span>'
    + '<button type="button" class="hero-back" data-testid="hero-back" hidden>Voltar</button> '
    + '<button type="button" class="hero-close" data-testid="hero-close"><img class="hero-close-art" src="assets/talent-close-button.png" alt=""><span class="hero-close-text">Fechar</span></button></span></div>'
    + '<p class="hero-error" role="alert" hidden></p><div class="hero-body"></div></div></div>';

const BAR_HTML = '<div class="skill-bar-host"></div>';
const LEADER_HTML = '<div class="leader-host"></div>';
const NOTICE_HTML = '<div class="hud-box hud-notice"><div class="card-notice" data-testid="card-notice" hidden></div></div>';

//  The hero screens on top of the combat scene: seven HUD buttons, one panel
//  that shows the screen that was opened (Heróis, Mochila, Equipe, Equipamento, Talentos, Mapa, Ranking), the skill bar of the leader and the "Carta: <nome>" and "Equipamento encontrado: <peça>" notices.
//  It is plain DOM placed with scene.add.dom.
//  Collaborators: heroes (heroCollection), equipment (equipmentCollection), talents (talentCollection), farm (farmSession), rankings (rankingBoard, optional) and the scene hooks
//    walletCopper() -> the copper the player holds, to disable what costs more;
//    startFarm(boss) starts the farm fight of the chosen boss;
//    useSkill(slot) uses a skill of the leader (optional); skillState(slot) -> { state, seconds } of a slot of the leader (optional);
//    mapPosition() -> { chapter, stage, kind, stageCount, completed } where the player stands, for the chapter map (optional);
//    stories() -> [{ id, label }] the scenes the Mapa lists (optional); playStory(id) plays one over the open Mapa (optional).
export class HeroUi
{
    constructor (scene, { heroes, equipment, talents, farm, rankings = null, startFarm, walletCopper, useSkill, skillState, mapPosition, stories, playStory })
    {
        this.scene = scene;
        this.heroes = heroes;
        this.equipment = equipment;
        this.talents = talents;
        this.talentBusy = false;
        this.talentSelected = null;
        //  Whether Shift is held; the card button of Talentos shows the purchase of the most levels while it is (spec ui-polish UIP-10)
        this.shiftKey = createShiftKey({ onChange: () => this.refreshTalentShift() });
        this.equipBusy = false;
        this.sellMode = null;
        this.fusionBusy = false;
        //  The fusion request that runs: { heroId, target } where target is the star layer of a row fusion or 'all'; null when none runs
        this.fusionPending = null;
        this.bagHeroId = null;
        this.fuseAllAsking = false;
        this.farm = farm;
        this.rankings = rankings;
        this.rankingLoading = false;
        this.hooks = { startFarm, walletCopper, useSkill, skillState, mapPosition, stories, playStory };
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

        //  Above the HUD buttons, which are added first
        this.panelElement = scene.add.dom(PANEL.x, PANEL.y).createFromHTML(PANEL_HTML).setDepth(1);
        this.panel = this.panelElement.node.querySelector('.hero-panel');
        this.title = this.panel.querySelector('.hero-title');
        this.errorLine = this.panel.querySelector('.hero-error');
        this.body = this.panel.querySelector('.hero-body');
        this.backButton = this.panel.querySelector('.hero-back');
        this.window = this.panel.querySelector('.hero-window');
        this.panel.querySelector('.hero-close').addEventListener('click', () => this.close());

        //  The painted close button of the talent tree; without the file the plain text button stays
        const closeArt = this.panel.querySelector('.hero-close-art');

        closeArt.addEventListener('error', () => closeArt.remove());
        this.backButton.addEventListener('click', () => this.goBack());
        this.goBack = () => {};

        //  Not click-through: a click on a skill slot must not reach the canvas and hit the monster
        this.barHost = this.createDom(SKILL_BAR, BAR_HTML).querySelector('.skill-bar-host');
        this.notice = this.createDom(NOTICE, NOTICE_HTML, false).querySelector('.card-notice');
        this.leaderHost = this.createDom(LEADER, LEADER_HTML, false).querySelector('.leader-host');

        heroes.onChange(() => this.updateSkillBar());
        this.updateSkillBar();
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

    //  Closes `screen` when it is the one open, else opens it over whatever is open (a hero detail or the fusion ladder of Mochila is the screen bag)
    toggle (screen)
    {
        if (this.open && this.screen === screen)
        {
            this.close();

            return undefined;
        }

        return this.show(screen);
    }

    //  Opens a screen by id; the fight keeps running behind it (spec background-fight)
    async show (screen, options = {})
    {
        const { title } = SCREENS.find(({ id }) => id === screen);
        const view = ++this.view;

        this.dropFarmLoad();
        this.dropRankingLoad();

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
        this.talentSelected = null;
        this.window.classList.toggle('is-talents', screen === 'talents');
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
            else if (screen === 'rankings')
            {
                await this.rankings.open(this.campaignChapter());
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
        this.dropRankingLoad();
        this.open = false;
        this.screen = null;
        this.sellMode = null;
        this.bagHeroId = null;
        this.fuseAllAsking = false;
        this.window.classList.remove('is-talents');
        this.panel.hidden = true;
        this.body.replaceChildren();
    }

    //  The scene ends: the Shift listeners of the window and the document go away with it
    destroy ()
    {
        this.shiftKey.dispose();
    }

    //  Leaving Mapa or opening a screen over it drops a pending chapter load (TD-009): the chips are enabled again and the
    //  farm session ignores its late answer. Runs before `this.screen` changes, so it reads the screen being left.
    dropFarmLoad ()
    {
        this.farmBusy = false;

        if (this.screen === 'farm')
        {
            this.farm.cancel();
        }
    }

    //  Leaving Ranking or opening a screen over it drops a pending board load: the loading line goes away and the
    //  ranking board ignores its late answer. Runs before `this.screen` changes, so it reads the screen being left.
    dropRankingLoad ()
    {
        if (this.screen === 'rankings')
        {
            this.rankings?.cancel();
            this.rankingLoading = false;
        }
    }

    //  The chapter the campaign stands in (15 once completed), the boss board chapter shown on the first open
    campaignChapter ()
    {
        const map = this.hooks.mapPosition?.() ?? DEFAULT_POSITION;

        return map.completed ? 15 : map.chapter;
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

    //  The list of heroes to lead with, opened by the leader card of Equipe (spec ui-polish UIP-13); Voltar goes back to Equipe
    openLeaderPicker ()
    {
        const picker = el('div', 'leader-picker', '', { testid: 'leader-picker' });

        this.setError('');
        picker.append(
            el('h3', 'team-available-title', 'Escolher líder'),
            renderLeaderPicker(this.heroes.heroes(), this.heroes.leaderId(), { onPick: (heroId) => this.pickLeader(heroId) })
        );
        this.showDetail(picker, () => this.render_team());
    }

    //  Makes `heroId` the leader; the list stays open and marks the new one
    async pickLeader (heroId)
    {
        const view = this.view;

        try
        {
            await this.heroes.setLeader(heroId);

            if (view === this.view)
            {
                this.openLeaderPicker();
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
        this.backButton.hidden = true;
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
            onLeader: () => this.openLeaderPicker(),
            onSlot: (slot) => this.selectTeamSlot(slot),
            onPick: (heroId) => this.pickTeamHero(heroId),
            onRemove: () => this.removeTeamHero(),
            onMakeLeader: () => this.makeTeamLeader(),
            onConfirmBuy: () => this.confirmTeamSlot(),
            onCancelBuy: () => this.cancelTeamSlot()
        }));
    }

    //  A click on an ally card: a filled or empty bought slot becomes the selected one; a buyable slot asks to buy it; any other card does
    //  nothing (its button is disabled)
    selectTeamSlot (slot)
    {
        const { state } = slotStates(this.heroes.team())[slot - 1];

        if (state === 'filled' || state === 'empty')
        {
            this.teamSelected = slot;
            this.render_team();
        }
        else if (state === 'buyable')
        {
            this.askTeamSlot(slot);
        }
    }

    //  The hero goes to the selected bought slot, else to the first empty bought slot; nothing happens without such a slot
    async pickTeamHero (heroId)
    {
        const team = this.heroes.team();
        const states = slotStates(team);
        const selectedState = this.teamSelected ? states[this.teamSelected - 1].state : null;
        const target = selectedState === 'filled' || selectedState === 'empty' ? this.teamSelected : states.find(({ state }) => state === 'empty')?.slot;

        if (!target)
        {
            return;
        }

        const allies = [ ...team.allies ];

        allies[target - 1] = heroId;
        await this.saveTeam(allies, target);
    }

    //  The selected filled slot is emptied and stays selected
    async removeTeamHero ()
    {
        const allies = [ ...this.heroes.team().allies ];

        allies[this.teamSelected - 1] = null;
        await this.saveTeam(allies, this.teamSelected);
    }

    //  The hero of the selected slot becomes the leader; the backend puts the old leader in that slot
    async makeTeamLeader ()
    {
        const heroId = this.heroes.team().allies[this.teamSelected - 1];

        await this.runTeam(() => this.heroes.setLeader(heroId), null);
    }

    //  PUT /team with `allies`; `selected` is the slot selected after the answer
    saveTeam (allies, selected)
    {
        return this.runTeam(() => this.heroes.setTeam(allies), selected);
    }

    //  One team request: the body is disabled while it runs; an answer for a screen left in the meantime renders nothing (L-096)
    async runTeam (request, selected, failure = TEAM_FAILED)
    {
        const view = this.view;

        this.teamBusy = true;
        this.setError('');
        this.render_team();

        try
        {
            await request();

            if (view === this.view)
            {
                this.teamSelected = selected;
            }
        }
        catch
        {
            if (view === this.view)
            {
                this.setError(failure);
            }

            await this.heroes.load().catch(() => {});
        }
        finally
        {
            if (view === this.view)
            {
                this.teamBusy = false;
                this.render_team();
            }
        }
    }

    //  The purchase dialog of a buyable slot shows under the slot row; nothing is sent yet
    askTeamSlot (slot)
    {
        this.teamAsking = slot;
        this.render_team();
    }

    cancelTeamSlot ()
    {
        this.teamAsking = null;
        this.render_team();
    }

    //  POST /team/slots from the bought count the screen shows; on success the new slot flashes 400 ms, the notice shows 3 s and the slot
    //  is selected; the wallet reaches the HUD through heroes.onWallet (ClickerGame). A stale count answers 409 and is a failure here.
    async confirmTeamSlot ()
    {
        const slot = this.teamAsking;
        const fromSlots = this.heroes.team().boughtSlots;
        const view = this.view;

        this.teamBusy = true;
        this.setError('');
        this.render_team();

        try
        {
            await this.heroes.buySlot(fromSlots);

            if (view === this.view)
            {
                this.teamAsking = null;
                this.teamSelected = slot;
                this.teamFlash = slot;
                this.teamNotice = SLOT_BOUGHT;
                this.scene.time.delayedCall(FLASH_MS, () =>
                {
                    if (view === this.view && this.teamFlash === slot)
                    {
                        this.teamFlash = null;
                        this.render_team();
                    }
                });
                this.scene.time.delayedCall(NOTICE_MS, () =>
                {
                    if (view === this.view && this.teamNotice === SLOT_BOUGHT)
                    {
                        this.teamNotice = null;
                        this.render_team();
                    }
                });
            }
        }
        catch
        {
            if (view === this.view)
            {
                this.teamAsking = null;
                this.setError(SLOT_FAILED);
            }

            await this.heroes.load().catch(() => {});
        }
        finally
        {
            if (view === this.view)
            {
                this.teamBusy = false;
                this.render_team();
            }
        }
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

    //  Shift went down or up: the card button of an open Talentos screen shows its form of now
    refreshTalentShift ()
    {
        if (this.open && this.screen === 'talents' && this.body.querySelector('[data-testid="talent-screen"]'))
        {
            this.render_talents();
        }
    }

    //  The talent tree, built once per open and patched by every later render (spec ui-polish UIP-06), so the board image never reloads and the scroll
    //  and the selected node stay. `busy` marks the buttons aria-disabled while a request runs (they keep their look and ignore clicks).
    render_talents ()
    {
        this.backButton.hidden = true;

        const current = this.body.querySelector('[data-testid="talent-screen"]');
        const options = {
            busy: this.talentBusy,
            selectedId: this.talentSelected,
            shiftHeld: this.shiftKey.held(),
            onSelect: (id) => this.selectTalent(id),
            onUpgrade: (id, { shift }) => this.upgradeTalent(id, shift),
            onReset: () => this.resetTalents()
        };

        if (current)
        {
            updateTalents(current, this.talents.talents(), this.talents.points(), options);

            return;
        }

        const screen = renderTalents(this.talents.talents(), this.talents.points(), options);

        this.body.replaceChildren(screen);
        placeTalentScroll(screen, null);
    }

    //  Shows a talent in the detail card; no request. On a phone the tree scrolls the node clear of the card
    selectTalent (id)
    {
        this.talentSelected = id;
        this.render_talents();
        revealTalent(this.body.querySelector('[data-testid="talent-screen"]'), id);
    }

    //  Buys the next level of a talent for the level the player saw, or with Shift the most levels the points pay in one request (spec ui-polish UIP-09);
    //  a refusal shows its text and the tree the backend answered after it. Nothing happens while another request runs.
    async upgradeTalent (talentId, shift = false)
    {
        const talent = this.talents.talents().find(({ id }) => id === talentId);

        if (this.talentBusy || !talent)
        {
            return;
        }

        const levels = (shift || this.shiftKey.held()) ? maxPurchase(talent, this.talents.points().available).levels : 1;

        if (levels < 1)
        {
            return;
        }

        const view = this.view;

        this.talentBusy = true;
        this.render_talents();

        try
        {
            await (levels === 1 ? this.talents.upgrade(talent.id, talent.level) : this.talents.upgrade(talent.id, talent.level, levels));

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

            //  Whatever view started the request, the Talentos screen open now was built with the buttons waiting (UIP-07 AC 3)
            if (this.open && this.screen === 'talents')
            {
                this.render_talents();
            }
        }
    }

    //  Takes back every talent level so the player can spend the points again; nothing happens while another request runs
    async resetTalents ()
    {
        if (this.talentBusy)
        {
            return;
        }

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

            //  Whatever view started the request, the Talentos screen open now was built with the buttons waiting (UIP-07 AC 3)
            if (this.open && this.screen === 'talents')
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
            stories: this.hooks.stories?.() ?? [],
            onStory: (id) => this.hooks.playStory?.(id),
            onPick: (boss) =>
            {
                this.close();
                this.hooks.startFarm(other ? { ...boss, chapter: listed } : boss);
            }
        }));
    }

    //  Loads another chapter of Mapa; the chips are disabled meanwhile and a failure keeps the map shown before.
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

    //  The Ranking screen: the board and chapter shown, the last page, and the loading line while a tab or chip loads
    render_rankings ()
    {
        this.body.replaceChildren(renderRanking({
            boardId: this.rankings.board(),
            chapter: this.rankings.chapter(),
            campaignChapter: this.campaignChapter(),
            page: this.rankings.page(),
            loading: this.rankingLoading
        }, {
            onBoard: (id) => this.selectRanking(id),
            onChapter: (number) => this.selectRanking(this.rankings.board(), number)
        }));
    }

    //  Loads another board or boss chapter of Ranking under the loading line; a failure shows the error line and no rows.
    //  A load dropped by a newer one, by show() or by close() changes nothing when it ends.
    async selectRanking (board, chapter)
    {
        const view = this.view;

        this.rankingLoading = true;
        this.setError('');
        this.render_rankings();

        try
        {
            const fresh = await this.rankings.select(board, chapter);

            if (!fresh || view !== this.view)
            {
                return;
            }

            this.rankingLoading = false;
            this.render_rankings();
        }
        catch
        {
            if (view === this.view)
            {
                this.rankingLoading = false;
                this.setError(LOAD_FAILED);
                this.render_rankings();
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

    //  "Presente do Dia da Consciência Negra: ..." for 6 s (spec black-awareness-staff D9), in the place of the drop notices; the red dot of
    //  Equipamento turns on unless Equipamento is open
    showGift ()
    {
        this.equipmentBadge.hidden = this.open && this.screen === 'equipment';
        this.showNotice(GIFT_NOTICE, GIFT_NOTICE_MS);
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

    showNotice (text, ms = NOTICE_MS)
    {
        const id = ++this.noticeId;

        this.notice.textContent = text;
        this.notice.hidden = false;
        this.scene.time.delayedCall(ms, () =>
        {
            if (id === this.noticeId)
            {
                this.notice.hidden = true;
            }
        });
    }
}
