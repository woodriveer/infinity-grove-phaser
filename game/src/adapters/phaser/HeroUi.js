import { renderBag, renderBagEntry } from './views/bagView';
import { renderCatalog, renderHeroDetail } from './views/catalogView';
import { renderFarm } from './views/farmView';
import { renderFusion, renderFusionResult } from './views/fusionView';
import { renderLeaderPicker } from './views/leaderView';
import { renderLeaderCard, renderSkillBar } from './views/skillBar';

const HUD = { x: 956, y: 370 };
const PANEL = { x: 512, y: 384 };
//  The leader and the skill bar share the cream battle bar along the bottom
const LEADER = { x: 154, y: 686 };
const SKILL_BAR = { x: 586, y: 686 };
const NOTICE = { x: 512, y: 120 };
const NOTICE_MS = 3000;

//  Lucide icons at stroke 2.75, one per hero button
const icon = (paths) => `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
const ICONS = {
    heroes: icon('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>'),
    bag: icon('<path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"></path><path d="M8 10h8"></path><path d="M8 18h8"></path><path d="M8 22v-6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v6"></path><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"></path>'),
    fusion: icon('<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path>'),
    leader: icon('<path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"></path><path d="M5 21h14"></path>'),
    farm: icon('<path d="M15 22a1 1 0 0 0 1-1v-1a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20v1a1 1 0 0 0 1 1z"></path><circle cx="15" cy="12" r="1"></circle><circle cx="9" cy="12" r="1"></circle>')
};

const SCREENS = [
    { id: 'heroes', label: 'Heróis', title: 'Heróis' },
    { id: 'bag', label: 'Mochila', title: 'Mochila' },
    { id: 'fusion', label: 'Fusão', title: 'Fusão' },
    { id: 'leader', label: 'Líder', title: 'Líder' },
    { id: 'farm', label: 'Rever chefes', title: 'Rever chefes' }
];

const LOAD_FAILED = 'Não foi possível carregar.';
const FUSE_FAILED = 'Não foi possível fundir as cartas.';
const LEADER_FAILED = 'Não foi possível trocar o líder.';

//  The bag button carries a red dot while the bag holds a card the player has not looked at yet
const BAG_BADGE_HTML = '<span class="hud-badge" data-testid="bag-badge" hidden></span>';
const HUD_HTML = `<div class="hero-hud">${SCREENS.map(({ id, label }) => `<button type="button" data-testid="hud-${id}">${ICONS[id]}${label}${id === 'bag' ? BAG_BADGE_HTML : ''}</button>`).join('')}</div>`;

const PANEL_HTML = '<div class="hero-panel" hidden><div class="hero-window">'
    + '<div class="hero-header"><span class="hero-title"></span><span>'
    + '<button type="button" class="hero-back" data-testid="hero-back" hidden>Voltar</button> '
    + '<button type="button" class="hero-close" data-testid="hero-close">Fechar</button></span></div>'
    + '<p class="hero-error" role="alert" hidden></p><div class="hero-body"></div></div></div>';

const BAR_HTML = '<div class="skill-bar-host"></div>';
const LEADER_HTML = '<div class="leader-host"></div>';
const NOTICE_HTML = '<div class="hud-box hud-notice"><div class="card-notice" data-testid="card-notice" hidden></div></div>';

//  The hero screens on top of the combat scene: five HUD buttons, one panel that shows the screen that was opened (Heróis, Mochila, Fusão,
//  Líder, Rever chefes), the skill bar of the leader and the "Carta: <nome>" notice. It is plain DOM placed with scene.add.dom.
//  Collaborators: heroes (heroCollection), farm (farmSession) and the scene hooks
//    pause() -> true when it paused the fight, false when the fight was already paused; resume() undoes a pause that pause() made;
//    startFarm(boss) starts the farm fight of the chosen boss.
export class HeroUi
{
    constructor (scene, { heroes, farm, pause, resume, startFarm })
    {
        this.scene = scene;
        this.heroes = heroes;
        this.farm = farm;
        this.hooks = { pause, resume, startFarm };
        this.open = false;
        this.pausedByUs = false;
        this.view = 0;
        this.noticeId = 0;

        const hud = this.createDom(HUD, HUD_HTML);

        this.bagBadge = hud.querySelector('.hud-badge');
        this.screen = null;

        SCREENS.forEach(({ id }) => hud.querySelector(`[data-testid="hud-${id}"]`).addEventListener('click', () => this.show(id)));

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

    //  Opens a screen by id and pauses the fight while it is open
    async show (screen, options = {})
    {
        const { title } = SCREENS.find(({ id }) => id === screen);
        const view = ++this.view;

        if (!this.open)
        {
            this.open = true;
            this.pausedByUs = this.hooks.pause();
            this.panel.hidden = false;
            this.panelElement.updateSize?.();
        }

        this.screen = screen;
        this.title.textContent = title;
        this.setError('');

        if (screen === 'bag')
        {
            this.bagBadge.hidden = true;
        }
        this.body.replaceChildren();
        this.backButton.hidden = true;

        try
        {
            if (screen === 'farm')
            {
                await this.farm.load();
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
                this.setError(LOAD_FAILED);
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
        this.open = false;
        this.screen = null;
        this.panel.hidden = true;
        this.body.replaceChildren();

        if (this.pausedByUs)
        {
            this.hooks.resume();
        }

        this.pausedByUs = false;
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

    render_bag ()
    {
        this.setError('');
        this.body.replaceChildren(renderBag(this.heroes.heroes(), {
            onSelect: (entry) =>
            {
                const hero = this.heroes.heroes().find((candidate) => candidate.id === entry.heroId);

                this.showDetail(renderBagEntry(entry, hero, { onFuse: (picked) => this.show('fusion', { selected: picked }) }), () => this.render_bag());
            }
        }));
    }

    render_fusion ({ selected = null, result = null } = {})
    {
        this.body.replaceChildren(renderFusion(this.heroes.heroes(), {
            selected,
            onFuse: (heroId, stars) => this.fuse(heroId, stars)
        }));

        if (result)
        {
            this.body.append(renderFusionResult(result));
        }
    }

    async fuse (heroId, stars)
    {
        const view = this.view;

        try
        {
            const hero = await this.heroes.fuse(heroId, stars);

            if (view === this.view)
            {
                this.setError('');
                this.render_fusion({ selected: { heroId, stars }, result: { heroName: hero.name, stars: stars + 1 } });
            }
        }
        catch
        {
            if (view === this.view)
            {
                this.setError(FUSE_FAILED);
            }
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

    render_farm ()
    {
        this.setError('');
        this.body.replaceChildren(renderFarm(this.farm.bosses(), this.farm.winsLeft(), {
            onPick: (boss) =>
            {
                this.close();
                this.hooks.startFarm(boss);
            }
        }));
    }

    //  The leader card and its three slots; empty until the heroes load
    updateSkillBar ()
    {
        this.leaderHost.replaceChildren(renderLeaderCard(this.heroes.leader()));
        this.barHost.replaceChildren(renderSkillBar(this.heroes.leader()));
    }

    //  "Carta: <nome>" for 3 s; a newer card replaces it and restarts the 3 s
    showDrop (drop)
    {
        const id = ++this.noticeId;

        //  A card that lands while the bag is open is seen at once
        this.bagBadge.hidden = this.open && this.screen === 'bag';
        this.notice.textContent = `Carta: ${drop.heroName}`;
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
