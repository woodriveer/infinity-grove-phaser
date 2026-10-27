import { Scene } from 'phaser';
import { BossCountdown } from '../../domain/campaign/bossCountdown';
import { MINIBOSS } from '../../domain/campaign/campaign';
import { AutoClicker, autoClickUnlocked } from '../../domain/combat/autoClick';
import { Combo, comboText } from '../../domain/combat/combo';
import { formatDamage } from '../../domain/combat/damage';
import { leaderAttacker } from '../../domain/combat/leaderAttacker';
import { bossTimeBonusMs, walletCopper, wornBy } from '../../domain/equipment/equipment';
import { healthText, Monster } from '../../domain/combat/monster';
import { clickHits } from '../../domain/heroes/leaderBonus';
import { SkillCombat } from '../../domain/skills/skillCombat';
import { monsterAfterBreak, talentComboCap, talentTimeBonusMs } from '../../domain/talents/talents';
import { HeroUi } from './HeroUi';
import { renderAutoClick } from './views/autoClickView';
import { el } from './views/dom';
import { renderElementWheel } from './views/elementWheel';
import { renderEffectTags, updateEffectTags } from './views/skillEffects';

//  The leader hero stands on the ground line of the monster; y is its feet
const CHARACTER = { x: 230, y: 612, height: 320 };
//  The monster is a translucent cream placeholder until its art arrives
const MONSTER = { x: 670, y: 440, width: 220, height: 250, color: 0xf5ead8, fillAlpha: 0.35 };
const HEALTH_BAR = { width: 240, height: 16, gap: 18, backColor: 0xdcd3c4, fillColor: 0xc67139 };
const DAMAGE_TEXT = { rise: 40, duration: 800 };
const DEATH = { fadeDuration: 500, respawnDelay: 1000 };
const LOGO = { x: 82, y: 44, width: 136 };
//  The wallet pill sits in the top-right corner; coins fly to its centre
const WALLET = { x: 890, y: 44 };
const COINS = [ [ 'gold', 'Gold' ], [ 'silver', 'Silver' ], [ 'copper', 'Copper' ] ];
const COIN = { duration: 600, stagger: 100, maxFlying: 5 };
const WALLET_SYNC_MS = 10000;
//  Phaser measures a DOM element once, when it is added, and centres it on that size: every element whose content changes sits in a
//  fixed-size box (style.css) so it stays where it was placed
const WALLET_HTML = '<div class="hud-box hud-wallet"><div class="wallet"></div></div>';
const STAGE_HUD = { x: 356, y: 44 };
//  Under the logo, top left
const CHAPTER_HUD = { x: 82, y: 96 };
//  Above the leader's head, left of the monster
const ELEMENT_WHEEL = { x: 108, y: 224 };
//  Above the monster, clear of the damage numbers that rise from its health bar
const COMBO_HUD = { x: 670, y: 150 };
const COMBO_HUD_HTML = '<div class="hud-box hud-combo"><div class="combo-hud" data-testid="combo-hud"></div></div>';
//  The second number of a double click sits beside the first so both can be read
const DOUBLE_HIT_OFFSET = 36;
const ELEMENT_WHEEL_HTML = '<div class="hud-box hud-wheel"></div>';
//  Top centre of the screen, in the row of the stage and wallet pills
const BOSS_TIMER = { x: 512, y: 44 };
//  Under the monster, clear of the damage numbers that rise above its health bar
const ENEMY_STATS = { x: 670, y: 596 };
//  The running skill effects, under the stage and countdown pills
const EFFECTS = { x: 512, y: 96 };
//  Phaser key names of the skill keys and the slot each one uses: 1, 2, 3 and Q, W, E
const SKILL_KEYS = [ [ 'ONE', 1 ], [ 'TWO', 2 ], [ 'THREE', 3 ], [ 'Q', 1 ], [ 'W', 2 ], [ 'E', 3 ] ];
const DAMAGE_FONT = { fontFamily: 'Caprasimo', stroke: '#2e2b25', strokeThickness: 8 };
const CRITICAL_TEXT = { color: '#ffc6a5', fontSize: 48 };
const NORMAL_TEXT = { color: '#f5ead8', fontSize: 32 };
const STAGE_MESSAGE = { x: 512, y: 384 };
const BATTLE_BAR = { x: 512, y: 686 };
const BATTLE_BAR_HTML = '<div class="battle-bar"></div>';
const CHAPTER_HUD_HTML = '<div class="hud-box hud-chapter"><div class="chapter-hud" data-testid="chapter-hud"></div></div>';
const MONSTER_HP_HTML = `<div class="hud-box hud-monster-hp"><div class="monster-hp" data-testid="monster-hp"></div></div>`;
const STAGE_HUD_HTML = '<div class="hud-box hud-stage"><div class="stage-hud"></div></div>';
const BOSS_TIMER_HTML = '<div class="hud-box hud-timer"><div class="boss-timer"></div></div>';
const ENEMY_STATS_HTML = '<div class="hud-box hud-enemy"><div class="enemy-stats"></div></div>';
const EFFECTS_HTML = '<div class="hud-box hud-effects"><div class="effect-tags"></div></div>';
const STAGE_MESSAGE_HTML = '<div class="hud-box hud-message"><div class="stage-message"></div></div>';
const FARM_TOGGLE = { x: 918, y: 686 };
const PAUSE_MENU = { x: 512, y: 384 };
//  Right edge, under the wallet pill: the auto click switch, its interval, the crystals and the next upgrade (spec auto-click)
const AUTO_CLICK_HUD = { x: 918, y: 136 };
const AUTO_CLICK_HUD_HTML = '<div class="hud-box hud-auto-click"><div class="auto-click" data-testid="auto-click"></div></div>';
const FARM_TOGGLE_HTML = '<div class="hud-box hud-farm"><label class="farm-toggle"><input type="checkbox"> Farm boss</label></div>';
const PAUSE_MENU_HTML = '<div class="pause-menu" hidden><div class="pause-card">'
    + '<div class="pause-title">Paused</div>'
    + '<div class="pause-options">'
    + '<button class="pause-continue">1. Continue</button>'
    + '<button class="pause-leave">2. Leave fight</button>'
    + '</div>'
    + '<div class="pause-confirm" hidden>'
    + '<div class="pause-question">Leave the fight? It counts as failed.</div>'
    + '<button class="pause-confirm-yes">Yes, leave</button>'
    + '<button class="pause-confirm-no">No, stay</button>'
    + '</div>'
    + '</div></div>';
const LOAD_FAILED_TEXT = 'Could not load progress';
const COMPLETED_TEXT = 'Chapter complete!';

export class ClickerGame extends Scene
{
    constructor ()
    {
        super('ClickerGame');
    }

    create ()
    {
        const services = this.registry.get('services');

        this.wallet = services.createWalletSync();
        this.session = services.createCampaignSession();
        this.monster = null;
        this.countdown = null;
        this.generation = 0;
        this.coinsFlying = 0;
        this.random = services.random ?? Math.random;
        //  The break talents lower the stats of the monster at the moment of every hit, so an upgrade counts from the next click
        this.skills = new SkillCombat({ random: this.random, statsOf: (monster) => monsterAfterBreak(monster.stats, this.talents.talents()) });
        this.combo = new Combo();
        this.effectsKey = '';
        this.loadingCampaign = false;
        this.paused = false;
        this.farmBoss = null;
        //  True while the farm fight comes from the Farm boss switch, not from Rever chefes: turning the switch off ends it
        this.farmBySwitch = false;
        this.heroes = services.createHeroCollection();
        this.equipment = services.createEquipmentCollection();
        this.talents = services.createTalentCollection();
        this.farm = services.createFarmSession();
        this.autoClick = services.createAutoClickState();
        this.autoClickPreference = services.autoClickPreference;
        this.autoClickEnabled = this.autoClickPreference.enabled();
        this.autoClicker = new AutoClicker();
        this.upgradingAutoClick = false;
        this.session.onRealign((encounter) => this.realign(encounter));
        this.session.onDrop((drop) => this.receiveDrop(drop));
        this.session.onEquipmentDrop((drop) => this.receiveEquipmentDrop(drop));
        this.session.onTalentPoints((points) => this.heroUi.showTalentPoints(points));
        this.equipment.onWallet((coins) => this.receiveWallet(coins));
        this.talents.onChange(() => this.refreshEnemyStats());
        this.autoClick.onChange(() => this.showAutoClick());

        this.add.image(512, 384, 'background');

        const logo = this.add.image(LOGO.x, LOGO.y, 'logo');

        logo.setScale(LOGO.width / logo.width);

        this.character = null;
        const body = this.add.rectangle(MONSTER.x, MONSTER.y, MONSTER.width, MONSTER.height, MONSTER.color, MONSTER.fillAlpha);

        //  The bar is centred above the monster's head
        const barX = MONSTER.x - HEALTH_BAR.width / 2;
        const barY = MONSTER.y - MONSTER.height / 2 - HEALTH_BAR.gap - HEALTH_BAR.height;

        const back = this.add.rectangle(barX, barY, HEALTH_BAR.width, HEALTH_BAR.height, HEALTH_BAR.backColor).setOrigin(0, 0);
        this.healthFill = this.add.rectangle(barX, barY, HEALTH_BAR.width, HEALTH_BAR.height, HEALTH_BAR.fillColor).setOrigin(0, 0);
        this.monsterParts = [ body, back, this.healthFill ];
        this.monsterParts.forEach((part) => part.setAlpha(0));
        this.damageTextY = barY - 8;
        //  The text sits on the bar, same size and centre; it is HTML like every other HUD text (ADR 0004)
        this.monsterHp = this.createHtml({ x: MONSTER.x, y: barY + HEALTH_BAR.height / 2 }, MONSTER_HP_HTML, '.monster-hp');

        //  Any click on the canvas hits the monster, not only a click on the monster itself
        this.input.on('pointerdown', (pointer) => this.hitMonster(pointer));

        //  Real HTML text in the top-left corner (ADR 0004); click-through so the canvas still gets every click
        this.walletText = this.add.dom(WALLET.x, WALLET.y).createFromHTML(WALLET_HTML).setVisible(false);
        this.walletText.pointerEvents = 'none';
        this.loadWallet();

        //  The cream bar under the leader, the skills and the farm switch; added first so they sit on top of it
        this.add.dom(BATTLE_BAR.x, BATTLE_BAR.y).createFromHTML(BATTLE_BAR_HTML).pointerEvents = 'none';

        //  Stage position, boss countdown and messages are real HTML too, click-through like the wallet text
        this.stageHud = this.createHtml(STAGE_HUD, STAGE_HUD_HTML, '.stage-hud');
        this.chapterHud = this.createHtml(CHAPTER_HUD, CHAPTER_HUD_HTML, '.chapter-hud');
        this.comboHud = this.createHtml(COMBO_HUD, COMBO_HUD_HTML, '.combo-hud');
        this.createHtml(ELEMENT_WHEEL, ELEMENT_WHEEL_HTML, '.hud-wheel').append(renderElementWheel());
        this.bossTimer = this.createHtml(BOSS_TIMER, BOSS_TIMER_HTML, '.boss-timer');
        this.enemyStats = this.createHtml(ENEMY_STATS, ENEMY_STATS_HTML, '.enemy-stats');
        this.effectTags = this.createHtml(EFFECTS, EFFECTS_HTML, '.effect-tags');
        this.stageMessage = this.createHtml(STAGE_MESSAGE, STAGE_MESSAGE_HTML, '.stage-message');
        this.createControls();
        this.createHeroUi();
        this.loadCampaign();

        //  Kills reach the backend in batches, never one request per kill
        this.time.addEvent({ delay: WALLET_SYNC_MS, loop: true, callback: () => this.tick() });
        this.events.once('shutdown', () => this.syncOnExit());
    }

    //  An HTML element; returns the node that holds the text. Click-through unless it is a control.
    createHtml ({ x, y }, html, selector, interactive = false)
    {
        const element = this.add.dom(x, y).createFromHTML(html);

        if (!interactive)
        {
            element.pointerEvents = 'none';
        }

        return element.node.querySelector(selector);
    }

    //  The farm toggle and the pause menu are clickable HTML; Esc opens the menu during a fight
    createControls ()
    {
        this.farmToggle = this.createHtml(FARM_TOGGLE, FARM_TOGGLE_HTML, '.farm-toggle input', true);
        this.createAutoClickHud();
        //  Above the hero buttons and the skill bar, which are added after it
        this.pauseElement = this.add.dom(PAUSE_MENU.x, PAUSE_MENU.y).createFromHTML(PAUSE_MENU_HTML).setDepth(1);
        this.pauseMenu = this.pauseElement.node.querySelector('.pause-menu');
        this.pauseOptions = this.pauseMenu.querySelector('.pause-options');
        this.pauseConfirm = this.pauseMenu.querySelector('.pause-confirm');

        this.pauseMenu.querySelector('.pause-continue').addEventListener('click', () => this.resumeFight());
        this.pauseMenu.querySelector('.pause-leave').addEventListener('click', () => this.askToLeave());
        this.pauseMenu.querySelector('.pause-confirm-yes').addEventListener('click', () => this.leaveFight());
        this.pauseMenu.querySelector('.pause-confirm-no').addEventListener('click', () => this.showPauseOptions());

        this.input.keyboard.on('keydown-ESC', () => this.escape());
        //  A held key fires once: the repeats of the operating system are ignored
        SKILL_KEYS.forEach(([ key, slot ]) => this.input.keyboard.on(`keydown-${key}`, (event) => !event?.repeat && this.useSkill(slot)));
    }

    //  The auto click box is clickable HTML, hidden until the campaign is past chapter 1; it reads its state in the background
    createAutoClickHud ()
    {
        this.autoClickElement = this.add.dom(AUTO_CLICK_HUD.x, AUTO_CLICK_HUD.y).createFromHTML(AUTO_CLICK_HUD_HTML);
        this.autoClickBox = this.autoClickElement.node.querySelector('.auto-click');
        this.autoClickBox.addEventListener('change', (event) => this.switchAutoClick(event.target.checked));
        this.autoClickBox.addEventListener('click', (event) => event.target.closest('.auto-click-upgrade') && this.upgradeAutoClick());
        this.showAutoClick();
        this.loadAutoClick();
    }

    get autoClickOpen ()
    {
        return autoClickUnlocked({ chapter: this.session.chapter, completed: this.session.completed });
    }

    showAutoClick ()
    {
        this.autoClickElement.setVisible(this.autoClickOpen);
        this.autoClickBox.replaceChildren(...renderAutoClick({
            enabled: this.autoClickEnabled, intervalMs: this.autoClick.intervalMs(), state: this.autoClick.state(), busy: this.upgradingAutoClick
        }));
    }

    switchAutoClick (on)
    {
        this.autoClickEnabled = on;
        this.autoClickPreference.setEnabled(on);
        this.showAutoClick();
    }

    async loadAutoClick ()
    {
        try
        {
            await this.autoClick.load();
        }
        catch
        {
            //  The auto click runs at 500 ms with no crystals or upgrade shown; the next tick tries again
        }
    }

    //  The upgrade is sent from the level shown; a refusal leaves the state the backend answered on screen
    async upgradeAutoClick ()
    {
        if (this.upgradingAutoClick)
        {
            return;
        }

        this.upgradingAutoClick = true;
        this.showAutoClick();

        try
        {
            await this.autoClick.upgrade();
        }
        catch
        {
            //  The box shows the stored state again
        }
        finally
        {
            this.upgradingAutoClick = false;

            if (this.sys.isActive())
            {
                this.showAutoClick();
            }
        }
    }

    //  While it may hit, the fight time drives the auto click; each click is a full click at the monster centre and a kill ends the burst
    autoClickFrame (delta)
    {
        if (!this.autoClickOpen || !this.autoClickEnabled || !this.monster || this.monster.dead)
        {
            return;
        }

        this.autoClicker.intervalMs = this.autoClick.intervalMs();

        const clicks = this.autoClicker.advance(delta);

        for (let click = 0; click < clicks && !this.monster.dead; click++)
        {
            this.strike(MONSTER.x);
        }
    }

    //  Esc closes an open hero screen first; otherwise it opens or closes the pause menu
    escape ()
    {
        if (this.heroUi.isOpen)
        {
            this.heroUi.close();
            return;
        }

        this.paused ? this.resumeFight() : this.pauseFight();
    }

    //  The hero buttons, screens, skill bar and card notice; the heroes load in the background and a failure leaves the fight playable
    createHeroUi ()
    {
        this.heroUi = new HeroUi(this, {
            heroes: this.heroes,
            equipment: this.equipment,
            talents: this.talents,
            farm: this.farm,
            walletCopper: () => walletCopper(this.wallet.display()),
            pause: () => this.pauseForMenu(),
            resume: () => this.resumeFromMenu(),
            startFarm: (boss) => this.startFarm(boss),
            useSkill: (slot) => this.useSkill(slot),
            skillState: (slot) => this.skillState(slot),
            mapPosition: () => this.session.mapPosition()
        });
        this.heroes.onChange(() => this.showCharacter());
        this.loadHeroes();
        this.loadEquipment();
        this.loadTalents();
    }

    //  The sprite of the leader hero replaces itself when the leader changes; nothing shows until the heroes load
    showCharacter ()
    {
        const leader = this.heroes.leader();

        if (!leader)
        {
            return;
        }

        const key = `hero_${leader.id}`;

        if (this.character)
        {
            this.character.setTexture(key);
        }
        else
        {
            this.character = this.add.image(CHARACTER.x, CHARACTER.y, key).setOrigin(0.5, 1);
        }

        this.character.setScale(CHARACTER.height / this.character.height);
    }

    async loadHeroes ()
    {
        try
        {
            await this.heroes.load();
        }
        catch
        {
            //  The skill bar stays empty; the next tick tries again
        }
    }

    async loadEquipment ()
    {
        try
        {
            await this.equipment.load();
        }
        catch
        {
            //  The click keeps the attacker it had; the next tick tries again
        }
    }

    async loadTalents ()
    {
        try
        {
            await this.talents.load();
        }
        catch
        {
            //  The fight has no talent effect; the next tick tries again
        }
    }

    //  The pieces worn by the leader; none while the heroes or the equipment have not loaded
    leaderPieces ()
    {
        const leader = this.heroes.leader();

        return leader ? wornBy(this.equipment.pieces(), leader.id) : [];
    }

    //  A piece the backend dropped for a won boss: into the list at once, and shown for 3 s
    receiveEquipmentDrop (drop)
    {
        this.equipment.applyDrop(drop);
        this.heroUi.showEquipmentDrop(drop);
    }

    //  The wallet the backend answered after a refine, a reroll or a sale
    receiveWallet (coins)
    {
        this.wallet.setWallet(coins);

        if (this.wallet.loaded)
        {
            this.refreshWalletText();
        }
    }

    //  A card the backend dropped for a won boss: into the bag at once, and shown for 3 s
    receiveDrop (drop)
    {
        this.heroes.applyDrop(drop);
        this.heroUi.showDrop(drop);
    }

    //  A hero screen freezes the fight like the pause menu; returns false when the player had already paused it (Esc)
    pauseForMenu ()
    {
        if (this.paused)
        {
            return false;
        }

        this.paused = true;
        this.time.paused = true;
        this.tweens.paused = true;

        return true;
    }

    resumeFromMenu ()
    {
        this.resumeFight();
    }

    //  Freezes the fight: clicks, the boss countdown, timers and tweens all stop until the player resumes
    pauseFight ()
    {
        if (this.paused || !this.monster || this.monster.dead)
        {
            return;
        }

        this.paused = true;
        this.time.paused = true;
        this.tweens.paused = true;
        this.showPauseOptions();
        this.pauseMenu.hidden = false;

        //  The menu was hidden when Phaser measured it, so the size it centres on is 0 until measured again
        this.pauseElement.updateSize();
    }

    resumeFight ()
    {
        if (!this.paused)
        {
            return;
        }

        this.paused = false;
        this.time.paused = false;
        this.tweens.paused = false;
        this.pauseMenu.hidden = true;
    }

    //  Only a boss can be left: a phase monster has no failed outcome
    showPauseOptions ()
    {
        this.pauseOptions.hidden = false;
        this.pauseConfirm.hidden = true;
        this.pauseMenu.querySelector('.pause-leave').hidden = !this.countdown;
    }

    askToLeave ()
    {
        this.pauseOptions.hidden = true;
        this.pauseConfirm.hidden = false;
    }

    //  The confirmed exit: the boss counts as failed, exactly like a timeout
    leaveFight ()
    {
        if (!this.paused || !this.countdown)
        {
            return;
        }

        this.resumeFight();

        if (this.farmBoss)
        {
            this.leaveFarm();
            return;
        }

        this.bossTimedOut();
    }

    //  The first encounter comes from the backend; until it does, nothing spawns
    async loadCampaign ()
    {
        if (this.loadingCampaign)
        {
            return;
        }

        this.loadingCampaign = true;

        let encounter;

        try
        {
            encounter = await this.session.load();
        }
        catch
        {
            if (this.sys.isActive())
            {
                this.stageMessage.textContent = LOAD_FAILED_TEXT;
            }

            return;
        }
        finally
        {
            this.loadingCampaign = false;
        }

        if (!this.sys.isActive())
        {
            return;
        }

        this.stageMessage.textContent = '';
        this.showEncounter(encounter);
    }

    //  Spawns the encounter, or ends the game when there is none left
    showEncounter (encounter)
    {
        if (!encounter)
        {
            this.completeChapter();
            return;
        }

        //  A new encounter replaces any message, the completion of the previous chapter included
        this.stageMessage.textContent = '';
        this.monster = new Monster(encounter.health, encounter.dropRuleId, encounter.stats);
        this.updateHealthBar();
        this.monsterParts.forEach((part) => part.setAlpha(1));
        this.stageHud.textContent = encounter.label;
        this.chapterHud.textContent = `Capítulo ${this.session.chapter}`;
        this.showAutoClick();
        this.monsterStats = encounter.stats;
        this.showEnemyStats(monsterAfterBreak(encounter.stats, this.talents.talents()));

        if (encounter.timeLimitMs)
        {
            this.countdown = new BossCountdown(encounter.timeLimitMs + bossTimeBonusMs(this.leaderPieces()) + talentTimeBonusMs(this.talents.talents(), encounter));
            this.showCountdown();
        }
    }

    //  The tags follow the break talents: the defenses the monster has now
    refreshEnemyStats ()
    {
        if (this.monster && !this.monster.dead && this.monsterStats)
        {
            this.showEnemyStats(monsterAfterBreak(this.monsterStats, this.talents.talents()));
        }
    }

    //  "Water  Physical def 10%  Magical def 10%  Crit res 12%", one tag each; the double spaces are hidden between the tags
    showEnemyStats ({ element, physicalDefense, magicalDefense, critResistance })
    {
        const name = element.charAt(0) + element.slice(1).toLowerCase();
        const tags = [
            el('span', 'tag tag-element', name),
            ...[ `Physical def ${physicalDefense}%`, `Magical def ${magicalDefense}%`, `Crit res ${critResistance}%` ].map((text) => el('span', 'tag', text))
        ];

        this.enemyStats.replaceChildren(...tags.flatMap((tag, index) => (index ? [ el('span', 'gap', '  '), tag ] : [ tag ])));
    }

    completeChapter ()
    {
        this.monster = null;
        this.enemyStats.textContent = '';
        this.monsterParts.forEach((part) => part.setAlpha(0));
        this.stageHud.textContent = '';
        this.monsterHp.textContent = '';
        this.stageMessage.textContent = COMPLETED_TEXT;
        this.showAutoClick();

        //  The chapter boss report goes at once, not on the next tick: its answer opens the next chapter, if there is one
        this.session.flush();
    }

    showCountdown ()
    {
        this.bossTimer.textContent = `Time: ${this.countdown.seconds}`;
    }

    hideCountdown ()
    {
        this.countdown = null;
        this.bossTimer.textContent = '';
    }

    update (time, delta)
    {
        if (this.paused)
        {
            return;
        }

        this.combo.advance(delta);
        this.autoClickFrame(delta);
        this.showCombo();

        //  The stop of Stun and Root is read before the skills use it up with this frame
        const countdownMs = this.skills.countdownMs(delta);
        const alive = this.monster && !this.monster.dead;
        const { hits } = this.skills.advance(delta, { monster: this.monster, boss: this.countdown !== null });

        hits.forEach(({ damage, critical }) => this.showDamage(formatDamage(damage), MONSTER.x, critical));

        //  A tick that does not kill still moves the health bar and the HP text; one that kills runs the kill path
        if (alive && this.monster.dead)
        {
            this.afterDamage();
        }
        else if (alive && hits.length > 0)
        {
            this.updateHealthBar();
        }

        this.refreshSkillUi();

        if (!this.countdown)
        {
            return;
        }

        this.countdown.advance(countdownMs);
        this.showCountdown();

        if (this.countdown.expired)
        {
            this.bossTimedOut();
        }
    }

    //  The slots of the bar and the effect tags follow the skill combat
    refreshSkillUi ()
    {
        this.heroUi.refreshSkills();

        const effects = this.skills.effectsWithOwner();
        const key = effects.map(({ label }) => label).join('|');

        //  Same effects: only the seconds change, in place, so a tooltip open on a tag stays open
        if (key === this.effectsKey)
        {
            updateEffectTags(this.effectTags, effects);
            return;
        }

        this.effectsKey = key;
        this.effectTags.replaceChildren(...renderEffectTags(effects, { skillOf: ({ heroId, slot }) => this.skillCard(heroId, slot) }));
    }

    //  The skill card ({ name, type, effect, ... }) of a hero's slot as the heroes payload has it, null while the heroes have not loaded
    skillCard (heroId, slot)
    {
        return this.heroes.heroes().find((hero) => hero.id === heroId)?.skills.find((skill) => skill.slot === slot) ?? null;
    }

    //  The state of a slot of the leader for the bar: locked until the hero has the stars
    skillState (slot)
    {
        const leader = this.heroes.leader();
        const unlocked = leader?.skills.find((skill) => skill.slot === slot)?.unlocked ?? false;

        return leader ? this.skills.slotState(leader.id, slot, unlocked) : { state: 'locked', seconds: 0 };
    }

    //  The attacker of a click or a skill: the element of the leader, the pieces it wears and its stars; until the heroes and the equipment
    //  load it keeps the default attacker
    leaderAttacker ()
    {
        return leaderAttacker({ leader: this.heroes.leader(), pieces: this.leaderPieces(), talents: this.talents.talents() });
    }

    //  The leader uses the skill of `slot` (a click on its slot or the key 1, 2 or 3) on the monster on screen. A countdown means a boss.
    useSkill (slot)
    {
        const leader = this.heroes.leader();

        if (!leader || this.paused || this.heroUi.isOpen || !this.monster || this.monster.dead)
        {
            return;
        }

        const result = this.skills.use({
            heroId: leader.id,
            slot,
            unlocked: leader.skills.find((skill) => skill.slot === slot)?.unlocked ?? false,
            attacker: this.leaderAttacker(),
            monster: this.monster,
            boss: this.countdown !== null
        });

        if (!result.used)
        {
            return;
        }

        result.hits.forEach(({ damage, critical }) => this.showDamage(formatDamage(damage), MONSTER.x, critical));

        if (result.countdown.extendMs > 0 && this.countdown)
        {
            this.countdown.extend(result.countdown.extendMs);
            this.showCountdown();
        }

        this.updateHealthBar();
        this.refreshSkillUi();

        if (this.monster.dead)
        {
            this.afterDamage();
        }
    }

    //  The boss survived its time limit: it leaves, and the stage's last phase comes back after the respawn delay
    bossTimedOut ()
    {
        this.hideCountdown();
        this.monster = null;
        this.enemyStats.textContent = '';
        this.monsterParts.forEach((part) => part.setAlpha(0));

        //  A farmed boss that survives its time limit just comes back; nothing is reported and the campaign does not move
        this.showAfterDelay(this.farmBoss ? this.nextFarmEncounter() : this.session.fail());
    }

    //  Shows `next` after the respawn delay unless a realignment replaced the position in the meantime
    showAfterDelay (next)
    {
        const generation = this.generation;

        this.time.delayedCall(DEATH.respawnDelay, () =>
        {
            if (generation === this.generation)
            {
                this.showEncounter(next);
            }
        });
    }

    //  Kills reach the backend in batches; the wallet service decides what each tick does
    async tick ()
    {
        this.tickCampaign();

        const changed = await this.wallet.tick();

        if (changed && this.sys.isActive())
        {
            this.showWallet();
        }
    }

    //  Every tick either retries a campaign that never loaded or sends the queued outcome reports
    tickCampaign ()
    {
        if (this.session.loaded)
        {
            this.session.flush();
        }
        else
        {
            this.loadCampaign();
        }

        if (!this.heroes.loaded)
        {
            this.loadHeroes();
        }

        if (!this.equipment.loaded)
        {
            this.loadEquipment();
        }

        if (!this.talents.loaded)
        {
            this.loadTalents();
        }

        if (!this.autoClick.loaded)
        {
            this.loadAutoClick();
        }
    }

    //  One last, best-effort sync when the scene ends; a failure is not retried
    syncOnExit ()
    {
        this.wallet.syncOnExit();
        this.session.flushOnExit();
    }

    //  The backend holds another position than ours (a lost report, or another tab): play that one now
    realign (encounter)
    {
        //  The session already adopted the stored position; leaving the farm shows it
        if (this.farmBoss)
        {
            return;
        }

        this.generation += 1;
        this.resumeFight();
        this.hideCountdown();
        this.showEncounter(encounter);
    }

    //  Without a wallet the game plays on but nothing drops
    async loadWallet ()
    {
        const loaded = await this.wallet.load();

        if (loaded && this.sys.isActive())
        {
            this.showWallet();
        }
    }

    showWallet ()
    {
        this.refreshWalletText();
        this.walletText.setVisible(true);
    }

    //  "Gold: 2  Silver: 14  Copper: 37": a coin disc and the amount each, the names kept for assistive tech
    refreshWalletText ()
    {
        const amounts = this.wallet.display();

        this.walletText.node.querySelector('.wallet').replaceChildren(...COINS.flatMap(([ key, label ], index) => [
            ...(index ? [ el('span', 'sr-only', '  ') ] : []),
            el('span', 'sr-only', `${label}: `),
            el('span', `coin coin-${key}`, String(amounts[key]))
        ]));
    }

    hitMonster (pointer)
    {
        if (this.paused || !this.monster || this.monster.dead)
        {
            return;
        }

        this.strike(this.damageTextX(pointer));
    }

    //  One click on the living monster, by hand or by the auto click, with its number at `x`
    strike (x)
    {
        //  A countdown means the monster is a boss. One click is one step of the combo; the double click of Lyra lands two critical hits that
        //  share its bonus, and the second does not land when the first one kills.
        this.combo.maxPercent = talentComboCap(this.talents.talents());

        const multiplier = 1 + this.combo.click() / 100;
        const hits = clickHits(this.heroes.leader()?.id, this.random);

        for (let hit = 0; hit < hits && !this.monster.dead; hit++)
        {
            const { damage, critical } = this.skills.click({
                attacker: this.leaderAttacker(), monster: this.monster, boss: this.countdown !== null, multiplier, forceCritical: hits === 2
            });

            this.showDamage(formatDamage(damage), x + hit * DOUBLE_HIT_OFFSET, critical);
        }

        this.showCombo();
        this.afterDamage();
    }

    //  "Combo x11 · +11%" while a streak runs
    showCombo ()
    {
        this.combo.maxPercent = talentComboCap(this.talents.talents());

        const text = comboText(this.combo);

        if (this.comboHud.textContent !== text)
        {
            this.comboHud.textContent = text;
        }
    }

    //  The health bar follows a hit, and a monster at 0 health dies: coins (not in a farm fight), then the next encounter. One path for the
    //  click, the skills and their ticks.
    afterDamage ()
    {
        this.updateHealthBar();

        if (this.monster.dead)
        {
            this.enemyStats.textContent = '';

            //  A farm fight drops no coins: kills are only reported for the campaign
            if (!this.farmBoss)
            {
                this.dropCoins();
            }

            this.fadeOutMonster(this.clearEncounter());
        }
    }

    //  A farm fight reports a farm win and leaves the campaign alone; any other win moves the campaign on
    clearEncounter ()
    {
        if (this.farmBoss)
        {
            return this.winFarm();
        }

        const won = this.session.encounter();

        this.hideCountdown();

        const next = this.session.clear();

        //  The report goes at once, not on the next tick: the talent points, the card and the piece it pays show up as the encounter is won
        this.session.flush();

        //  With the Farm boss switch on, a won miniboss is now beaten and comes back as a farm fight, so every later win pays its drops
        //  too. The chapter boss moves on: its farm opens from Rever chefes once the chapter is completed.
        if (this.farmToggle.checked && won?.kind === MINIBOSS)
        {
            this.farmBoss = { kind: MINIBOSS, stage: won.stage };
            this.farmBySwitch = true;

            return this.session.farmEncounter(this.farmBoss);
        }

        return next;
    }

    //  Fights a boss the player already beat again and again; the campaign position and its report queue are never touched
    startFarm (boss)
    {
        if (!this.session.loaded)
        {
            return;
        }

        this.farmBoss = boss;
        this.farmBySwitch = false;
        this.generation += 1;
        this.hideCountdown();
        this.tweens.killTweensOf(this.monsterParts);
        this.showEncounter(this.session.farmEncounter(boss));
    }

    //  A farm win is reported at once (one request); the same boss comes back for the next fight
    winFarm ()
    {
        const boss = this.farmBoss;

        this.hideCountdown();
        this.reportFarmWin(boss);

        return this.nextFarmEncounter();
    }

    //  The same boss again, or the campaign position once the Farm boss switch that started this farm was turned off
    nextFarmEncounter ()
    {
        if (this.farmBySwitch && !this.farmToggle.checked)
        {
            this.farmBoss = null;
            this.farmBySwitch = false;

            return this.session.encounter();
        }

        return this.session.farmEncounter(this.farmBoss);
    }

    //  The card of the win joins the bag; the chapter boss at 0 wins left today ends the farm and shows the list. A refusal (the boss
    //  cannot be farmed, or no wins left today) ends it too.
    async reportFarmWin (boss)
    {
        try
        {
            const result = await this.farm.win(boss);

            if (!this.sys.isActive())
            {
                return;
            }

            if (result.drop)
            {
                this.receiveDrop(result.drop);
            }

            if (result.equipmentDrop)
            {
                this.receiveEquipmentDrop(result.equipmentDrop);
            }

            if (boss.kind === 'CHAPTER_BOSS' && result.chapterBossWinsLeft <= 0 && this.farmBoss === boss)
            {
                this.leaveFarm();
                this.heroUi.show('farm');
            }
        }
        catch (error)
        {
            //  A win too soon after the previous one pays nothing, but the farm goes on: only a boss that cannot be farmed ends it
            if (error?.code === 'FARM_TOO_FAST')
            {
                return;
            }

            if (this.sys.isActive() && error?.status === 409 && this.farmBoss === boss)
            {
                this.leaveFarm();
                this.farm.load().catch(() => {});
            }
        }
    }

    //  Back to the campaign position the player left
    leaveFarm ()
    {
        this.farmBoss = null;
        this.farmBySwitch = false;
        this.generation += 1;
        this.hideCountdown();
        this.tweens.killTweensOf(this.monsterParts);
        this.showEncounter(this.session.encounter());
    }

    //  The next drop queued for the monster's drop rule flies from the monster to the wallet text as at most COIN.maxFlying coins
    //  in the air at once; the drop's copper is shared among them and each landing counts its share. With no free slot the drop
    //  lands at once.
    dropCoins ()
    {
        const drop = this.wallet.takeDrop(this.monster.dropRuleId);

        if (!drop)
        {
            return;
        }

        const count = Math.min(drop.value, COIN.maxFlying - this.coinsFlying);

        if (count <= 0)
        {
            this.wallet.land(drop.id, drop.value);
            this.refreshWalletText();
            return;
        }

        const share = Math.floor(drop.value / count);
        const extra = drop.value % count;

        for (let i = 0; i < count; i++)
        {
            const coin = this.add.sprite(MONSTER.x, MONSTER.y, 'coin').play('rotate');

            this.coinsFlying += 1;
            this.tweens.add({
                targets: coin,
                x: WALLET.x,
                y: WALLET.y,
                duration: COIN.duration,
                delay: i * COIN.stagger,
                onComplete: () =>
                {
                    coin.destroy();
                    this.coinsFlying -= 1;
                    this.wallet.land(drop.id, share + (i < extra ? 1 : 0));
                    this.refreshWalletText();
                }
            });
        }
    }

    updateHealthBar ()
    {
        this.healthFill.setSize(HEALTH_BAR.width * this.monster.health / this.monster.maxHealth, HEALTH_BAR.height);
        this.monsterHp.textContent = healthText(this.monster);
    }

    //  The monster fades; `next` is the encounter that follows it (null when the chapter is over)
    fadeOutMonster (next)
    {
        const generation = this.generation;

        this.tweens.add({
            targets: this.monsterParts,
            alpha: 0,
            duration: DEATH.fadeDuration,
            onComplete: () =>
            {
                if (generation === this.generation)
                {
                    this.showAfterDelay(next);
                }
            }
        });
    }

    //  A click on the monster shows the number where it landed; any other click centres it on the monster
    damageTextX (pointer)
    {
        const onMonster = Math.abs(pointer.x - MONSTER.x) <= MONSTER.width / 2 && Math.abs(pointer.y - MONSTER.y) <= MONSTER.height / 2;

        return onMonster ? pointer.x : MONSTER.x;
    }

    //  A critical hit is bigger and peach
    showDamage (damage, x, critical = false)
    {
        const textStyle = { ...DAMAGE_FONT, ...(critical ? CRITICAL_TEXT : NORMAL_TEXT) };

        const text = this.add.text(x, this.damageTextY, damage, textStyle).setOrigin(0.5, 1).setDepth(1);

        this.tweens.add({
            targets: text,
            y: text.y - DAMAGE_TEXT.rise,
            alpha: 0,
            duration: DAMAGE_TEXT.duration,
            onComplete: () => text.destroy()
        });
    }
}
