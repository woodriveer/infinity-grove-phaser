import { Scene } from 'phaser';
import { BossCountdown } from '../../domain/campaign/bossCountdown';
import { MINIBOSS, farmEncounterOf } from '../../domain/campaign/campaign';
import { AutoClicker, autoClickUnlocked } from '../../domain/combat/autoClick';
import { resetReward } from '../../domain/campaign/accountReset';
import { allyAttacker } from '../../domain/combat/allyAttacker';
import { AllyCombat } from '../../domain/combat/allyCombat';
import { Combo, comboText } from '../../domain/combat/combo';
import { formatDamage } from '../../domain/combat/damage';
import { weaknessOf } from '../../domain/combat/elements';
import { leaderAttacker } from '../../domain/combat/leaderAttacker';
import { bossTimeBonusMs, walletCopper, wornBy } from '../../domain/equipment/equipment';
import { defenseOf, healthText, Monster } from '../../domain/combat/monster';
import { clickHits } from '../../domain/heroes/leaderBonus';
import { ELEMENT_LABELS } from '../../domain/heroes/heroes';
import { activePassives, fightingAllies, teamActive } from '../../domain/heroes/team';
import { SkillCombat } from '../../domain/skills/skillCombat';
import { skillLevelOf } from '../../domain/skills/skillLevel';
import { monsterAfterBreak, talentComboCap, talentTimeBonusMs } from '../../domain/talents/talents';
import { HeroUi } from './HeroUi';
import { autoClickIntervalText, renderAutoClick } from './views/autoClickView';
import { RESET_ERROR_TEXT, renderResetButton, renderResetDialog, resetNoticeText } from './views/resetView';
import { el } from './views/dom';
import { renderElementWheel } from './views/elementWheel';
import { renderEffectTags, updateEffectTags } from './views/skillEffects';
import { renderStageLabel } from './views/stageLabel';

//  The leader hero stands on the ground line of the monster; y is its feet
const CHARACTER = { x: 230, y: 612, height: 320 };
//  The attack formation (spec hero-team, Q36): fit boxes, bottom centres (origin 0.5, 1) and depths
const FORMATION_LEADER = { x: 320, y: 600, width: 180, height: 240, depth: 0.5 };
const FORMATION = {
    1: { x: 180, y: 460, width: 90, height: 120, depth: 0.4 },
    2: { x: 180, y: 605, width: 90, height: 120, depth: 0.4 },
    3: { x: 75, y: 450, width: 90, height: 120, depth: 0.3 },
    4: { x: 75, y: 615, width: 90, height: 120, depth: 0.3 }
};
const ALLY_MOVE = { distance: 24, duration: 100 };
//  Scaled to fit the box and keep the aspect ratio
const fitScale = (image, box) => Math.min(box.width / image.width, box.height / image.height);
//  The monster is a translucent cream placeholder until its art arrives
const MONSTER = { x: 670, y: 440, width: 220, height: 250, color: 0xf5ead8, fillAlpha: 0.35 };
const HEALTH_BAR = { width: 240, height: 16, gap: 18, backColor: 0x2a1410, fillColor: 0xc0392b };
const DAMAGE_TEXT = { rise: 40, duration: 800 };
const DEATH = { fadeDuration: 500, respawnDelay: 1000 };
const LOGO = { x: 82, y: 44, width: 136 };
//  The wallet pill sits in the top-right corner; coins fly to its centre
const WALLET = { x: 890, y: 44 };
const COINS = [ [ 'gold', 'Gold' ], [ 'silver', 'Silver' ], [ 'copper', 'Copper' ] ];
//  The sheet of a flying coin by the copper it carries: silver from 100 copper, gold from 100 silver
const coinMetal = (copper) => (copper >= 10000 ? 'gold' : copper >= 100 ? 'silver' : 'copper');
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
//  The stage plate starts at the left edge of its 400 px box (style.css .hud-stage); the timer keeps 12 px clear of the plate
const STAGE_HUD_LEFT = STAGE_HUD.x - 200;
const BOSS_TIMER_GAP = 12;
//  Under the monster, clear of the damage numbers that rise above its health bar
const ENEMY_STATS = { x: 670, y: 596 };
//  The running skill effects, under the stage and countdown pills
const EFFECTS = { x: 512, y: 96 };
//  Phaser key names of the skill keys and the slot each one uses: 1, 2, 3 and Q, W, E
const SKILL_KEYS = [ [ 'ONE', 1 ], [ 'TWO', 2 ], [ 'THREE', 3 ], [ 'Q', 1 ], [ 'W', 2 ], [ 'E', 3 ] ];
const DAMAGE_FONT = { fontFamily: 'Cinzel', fontStyle: '700', stroke: '#2a1408', strokeThickness: 8 };
const CRITICAL_TEXT = { color: '#ff8a1f', fontSize: 48 };
const NORMAL_TEXT = { color: '#ffd35c', fontSize: 32 };
const ALLY_TEXT = { color: '#7fd4ff', fontSize: 28 };
//  The ally number stands right of the monster centre so it does not cover the click numbers (spec hero-team)
const ALLY_TEXT_OFFSET = 70;
const STAGE_MESSAGE = { x: 512, y: 384 };
const BATTLE_BAR = { x: 512, y: 686 };
const BATTLE_BAR_HTML = '<div class="battle-bar"></div>';
const CHAPTER_HUD_HTML = '<div class="hud-box hud-chapter"><div class="chapter-hud" data-testid="chapter-hud"></div></div>';
const MONSTER_HP_HTML = `<div class="hud-box hud-monster-hp"><div class="monster-hp" data-testid="monster-hp"></div></div>`;
const STAGE_HUD_HTML = '<div class="hud-box hud-stage"><div class="stage-hud"></div></div>';
const BOSS_TIMER_HTML = '<div class="hud-box hud-timer"><div class="boss-timer"></div></div>';
//  The weak element chip sits above the enemy line in the same click-through box (spec ui-redesign UIR-08)
const ENEMY_STATS_HTML = '<div class="hud-box hud-enemy"><div class="weak-chip" data-testid="weak-chip"></div><div class="enemy-stats"></div></div>';
const EFFECTS_HTML = '<div class="hud-box hud-effects"><div class="effect-tags"></div></div>';
const STAGE_MESSAGE_HTML = '<div class="hud-box hud-message"><div class="stage-message"></div></div>';
//  The round farm button at the right end of the bar, right of the auto click button
const FARM_TOGGLE = { x: 951, y: 686 };
const PAUSE_MENU = { x: 512, y: 384 };
//  The auto click (spec ui-redesign D1, UIR-19): a round button at the right end of the battle bar with its key A and its interval under it, and the
//  window it opens above it with the switch, the interval, the crystals, the upgrade and the account reset. The box keeps Phaser's placement fixed.
const AUTO_CLICK_HUD = { x: 867, y: 686 };
const AUTO_CLICK_HUD_HTML = '<div class="hud-box hud-auto-click"><div class="auto-click" data-testid="auto-click">'
    + '<div class="auto-click-popover" id="auto-click-popover" role="dialog" aria-label="Auto clique" data-testid="auto-click-popover" hidden></div>'
    + '<button type="button" class="auto-click-button" data-testid="auto-click-button" data-on="false" aria-label="Auto clique" aria-haspopup="dialog"'
    + ' aria-expanded="false" aria-controls="auto-click-popover"><span class="auto-click-key" data-testid="auto-click-key" aria-hidden="true">A</span></button>'
    + '<span class="auto-click-rate" data-testid="auto-click-rate"></span>'
    + '</div></div>';
//  A key typed into a text field is text, not a shortcut
const isTextField = (target) => Boolean(target?.closest?.('textarea, select, [contenteditable]:not([contenteditable="false"]), input:not([type="checkbox"]):not([type="radio"]):not([type="button"])'));
//  The confirmation of the account reset (spec account-reset) covers the screen like the pause menu
const RESET_DIALOG_HTML = '<div class="reset-dialog" data-testid="reset-dialog" hidden><div class="reset-card"></div></div>';
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
        this.skills = new SkillCombat({ random: this.random, statsOf: (monster) => monsterAfterBreak(monster.stats, this.talents.talents(), this.passives()) });
        this.allies = new AllyCombat();
        this.encounterChapter = null;
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
        this.accountReset = services.createAccountReset({ session: this.session, autoClick: this.autoClick, talents: this.talents });
        this.resetting = false;
        this.resetError = null;
        this.session.onRealign((encounter) => this.realign(encounter));
        this.session.onDrop((drop) => this.receiveDrop(drop));
        this.session.onEquipmentDrop((drop) => this.receiveEquipmentDrop(drop));
        this.session.onTalentPoints((points) => this.heroUi.showTalentPoints(points));
        this.equipment.onWallet((coins) => this.receiveWallet(coins));
        this.heroes.onWallet((coins) => this.receiveWallet(coins));
        this.talents.onChange(() => this.refreshEnemyStats());
        this.autoClick.onChange(() => this.showAutoClick());

        this.add.image(512, 384, 'background');

        const logo = this.add.image(LOGO.x, LOGO.y, 'logo');

        logo.setScale(LOGO.width / logo.width);

        this.character = null;
        this.allySprites = new Map();
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
        this.weakChip = this.enemyStats.parentElement.querySelector('.weak-chip');
        this.effectTags = this.createHtml(EFFECTS, EFFECTS_HTML, '.effect-tags');
        this.stageMessage = this.createHtml(STAGE_MESSAGE, STAGE_MESSAGE_HTML, '.stage-message');
        this.createControls();
        this.createHeroUi();
        this.loadCampaign();

        //  Kills reach the backend in batches, never one request per kill
        this.time.addEvent({ delay: WALLET_SYNC_MS, loop: true, callback: () => this.tick() });
        this.events.once('shutdown', () =>
        {
            this.syncOnExit();
            document.removeEventListener('pointerdown', this.onPressOutsideAutoClick, true);
        });
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
        this.createResetDialog();
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

    //  The round auto click button and its window are clickable HTML, hidden until the auto click is open; they read their state in the background
    createAutoClickHud ()
    {
        this.autoClickElement = this.add.dom(AUTO_CLICK_HUD.x, AUTO_CLICK_HUD.y).createFromHTML(AUTO_CLICK_HUD_HTML);
        this.autoClickBox = this.autoClickElement.node.querySelector('.auto-click');
        this.autoClickWindow = this.autoClickBox.querySelector('.auto-click-popover');
        this.autoClickButton = this.autoClickBox.querySelector('.auto-click-button');
        this.autoClickRate = this.autoClickBox.querySelector('.auto-click-rate');
        this.autoClickBox.addEventListener('change', (event) => this.switchAutoClick(event.target.checked));
        this.autoClickBox.addEventListener('click', (event) => event.target.closest('.auto-click-upgrade') && this.upgradeAutoClick());
        this.autoClickBox.addEventListener('click', (event) => event.target.closest('.reset-account') && this.openResetDialog());
        this.autoClickButton.addEventListener('click', () => this.toggleAutoClickWindow());
        //  A press anywhere outside the button and its window closes the window and still does what it does (a press on the canvas hits)
        this.onPressOutsideAutoClick = (event) => !this.autoClickBox.contains(event.target) && this.closeAutoClickWindow({ returnFocus: false });
        document.addEventListener('pointerdown', this.onPressOutsideAutoClick, true);
        this.input.keyboard.on('keydown-A', (event) => this.autoClickKey(event));
        this.showAutoClick();
        this.loadAutoClick();
    }

    //  Open past chapter 1, and from chapter 1 too once the player reset the account
    get autoClickOpen ()
    {
        return autoClickUnlocked({ chapter: this.session.chapter, completed: this.session.completed, resets: this.autoClick.state()?.resets ?? 0 });
    }

    //  The crystals a reset pays now, null while the reset is closed
    get resetReward ()
    {
        return resetReward({ chapter: this.session.chapter, completed: this.session.completed });
    }

    showAutoClick ()
    {
        const reward = this.resetReward;
        //  The window is drawn again on every change; a keyboard user keeps the control that had focus
        const focused = this.autoClickWindow.contains(document.activeElement) ? document.activeElement.getAttribute('data-testid') : null;

        this.autoClickElement.setVisible(this.autoClickOpen);
        this.autoClickWindow.replaceChildren(...renderAutoClick({
            enabled: this.autoClickEnabled, intervalMs: this.autoClick.intervalMs(), state: this.autoClick.state(), busy: this.upgradingAutoClick
        }), ...(reward === null ? [] : [ renderResetButton(reward) ]));
        this.autoClickButton.setAttribute('data-on', String(this.autoClickEnabled));
        this.autoClickRate.textContent = autoClickIntervalText(this.autoClick.intervalMs());

        if (!this.autoClickOpen)
        {
            this.closeAutoClickWindow({ returnFocus: false });
        }
        else if (focused)
        {
            this.autoClickWindow.querySelector(`[data-testid="${focused}"]`)?.focus();
        }
    }

    get autoClickWindowOpen ()
    {
        return !this.autoClickWindow.hidden;
    }

    //  The window opens with the focus on its switch, so the keyboard can use it at once
    openAutoClickWindow ()
    {
        if (!this.autoClickOpen)
        {
            return;
        }

        this.autoClickWindow.hidden = false;
        this.autoClickButton.setAttribute('aria-expanded', 'true');
        this.autoClickWindow.querySelector('[data-testid="auto-click-toggle"]')?.focus();
    }

    closeAutoClickWindow ({ returnFocus = true } = {})
    {
        if (!this.autoClickWindowOpen)
        {
            return;
        }

        this.autoClickWindow.hidden = true;
        this.autoClickButton.setAttribute('aria-expanded', 'false');

        if (returnFocus)
        {
            this.autoClickButton.focus();
        }
    }

    toggleAutoClickWindow ()
    {
        this.autoClickWindowOpen ? this.closeAutoClickWindow() : this.openAutoClickWindow();
    }

    //  The A key opens or closes the window; not while typing, not for the repeats of a held key, and not while a dialog, the pause menu or a
    //  hero screen covers the battle bar
    autoClickKey (event)
    {
        if (event?.repeat || isTextField(event?.target) || this.paused || !this.resetDialog.hidden || this.heroUi.isOpen || !this.autoClickOpen)
        {
            return;
        }

        this.toggleAutoClickWindow();
    }

    //  The dialog is clickable HTML above the HUD; its buttons confirm or cancel the reset
    createResetDialog ()
    {
        this.resetDialogElement = this.add.dom(PAUSE_MENU.x, PAUSE_MENU.y).createFromHTML(RESET_DIALOG_HTML).setDepth(1);
        this.resetDialog = this.resetDialogElement.node.querySelector('.reset-dialog');
        this.resetCard = this.resetDialog.querySelector('.reset-card');
        this.resetCard.addEventListener('click', (event) =>
        {
            if (event.target.closest('.reset-confirm'))
            {
                this.confirmReset();
            }
            else if (event.target.closest('.reset-cancel'))
            {
                this.closeResetDialog();
            }
        });
    }

    openResetDialog ()
    {
        if (this.resetReward === null)
        {
            return;
        }

        this.closeAutoClickWindow({ returnFocus: false });
        this.resetError = null;
        this.resetDialog.hidden = false;
        this.showResetDialog();

        //  The dialog was hidden when Phaser measured it, so the size it centres on is 0 until measured again
        this.resetDialogElement.updateSize();
    }

    showResetDialog ()
    {
        this.resetCard.replaceChildren(...renderResetDialog({ reward: this.resetReward, busy: this.resetting, error: this.resetError }));
    }

    closeResetDialog ()
    {
        this.resetDialog.hidden = true;
        this.resetError = null;
    }

    //  The reset is sent from the chapter shown. The answer restarts the fight at chapter 1 through the session; a refusal realigns and
    //  closes the dialog, a failed request keeps it open to try again.
    async confirmReset ()
    {
        if (this.resetting)
        {
            return;
        }

        this.resetting = true;
        this.resetError = null;
        this.showResetDialog();

        try
        {
            const answer = await this.accountReset.reset();

            this.closeResetDialog();
            this.heroUi.showNotice(resetNoticeText(answer.reward));
        }
        catch (error)
        {
            if (error?.status === 409)
            {
                this.closeResetDialog();
            }
            else
            {
                this.resetError = RESET_ERROR_TEXT;
            }
        }
        finally
        {
            this.resetting = false;

            if (this.sys.isActive())
            {
                this.showAutoClick();

                if (!this.resetDialog.hidden)
                {
                    this.showResetDialog();
                }
            }
        }
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

    //  Esc closes the auto click window first, then an open hero screen; otherwise it opens or closes the pause menu
    escape ()
    {
        if (this.autoClickWindowOpen)
        {
            this.closeAutoClickWindow();
            return;
        }

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
            startFarm: (boss) => this.startFarm(boss),
            useSkill: (slot) => this.useSkill(slot),
            skillState: (slot) => this.skillState(slot),
            mapPosition: () => this.session.mapPosition()
        });
        this.heroes.onChange(() =>
        {
            this.showCharacter();
            this.refreshEnemyStats();
        });
        this.loadHeroes();
        this.loadEquipment();
        this.loadTalents();
    }

    //  The leader and the fighting allies. With no ally drawn the leader stands as before (CHARACTER); with at least one, at the tip of the
    //  formation with the allies behind it. Nothing shows until the heroes load.
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

        this.character.setDepth(FORMATION_LEADER.depth);

        const allies = this.fightingAllies();

        if (allies.length === 0)
        {
            this.character.x = CHARACTER.x;
            this.character.y = CHARACTER.y;
            this.character.setScale(CHARACTER.height / this.character.height);
        }
        else
        {
            this.character.x = FORMATION_LEADER.x;
            this.character.y = FORMATION_LEADER.y;
            this.character.setScale(fitScale(this.character, FORMATION_LEADER));
        }

        this.allySprites.forEach((sprite) =>
        {
            this.tweens.killTweensOf(sprite);
            sprite.destroy();
        });
        this.allySprites.clear();

        allies.forEach(({ slot, hero }) =>
        {
            const box = FORMATION[slot];
            const sprite = this.add.image(box.x, box.y, `hero_${hero.id}`).setOrigin(0.5, 1).setDepth(box.depth);

            sprite.setScale(fitScale(sprite, box));
            this.allySprites.set(slot, sprite);
        });
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

        //  A new chapter (a chapter boss won, a reset) can open ally slots or turn the team on or off: read the heroes again
        if (this.encounterChapter !== null && this.session.chapter !== this.encounterChapter)
        {
            this.loadHeroes();
        }

        this.encounterChapter = this.session.chapter;
        this.showCharacter();

        //  A new encounter replaces any message, the completion of the previous chapter included
        this.stageMessage.textContent = '';
        this.monster = new Monster(encounter.health, encounter.dropRuleId, encounter.stats);
        this.updateHealthBar();
        this.monsterParts.forEach((part) => part.setAlpha(1));
        renderStageLabel(this.stageHud, encounter.label);
        this.chapterHud.textContent = `Capítulo ${this.session.chapter}`;
        this.showAutoClick();
        this.monsterStats = encounter.stats;
        this.showEnemyStats(monsterAfterBreak(encounter.stats, this.talents.talents(), this.passives()));

        if (encounter.timeLimitMs)
        {
            this.countdown = new BossCountdown(
                encounter.timeLimitMs + bossTimeBonusMs(this.leaderPieces()) + talentTimeBonusMs(this.talents.talents(), encounter) + this.passives().bossTimeMs
            );
            this.showCountdown();
            this.placeBossTimer();
        }
    }

    //  The tags follow the break talents: the defenses the monster has now
    refreshEnemyStats ()
    {
        if (this.monster && !this.monster.dead && this.monsterStats)
        {
            this.showEnemyStats(monsterAfterBreak(this.monsterStats, this.talents.talents(), this.passives()));
        }
    }

    //  "Water  Defesa 10%  Crit res 12%", one chip each; the double spaces are hidden between the chips. data-element and data-stat give each
    //  chip its dot or icon (spec ui-redesign UIR-07); the one defense is read by defenseOf (spec unified-damage)
    showEnemyStats (stats)
    {
        const { element, critResistance } = stats;
        const name = element.charAt(0) + element.slice(1).toLowerCase();
        const chips = [ [ 'defense', `Defesa ${defenseOf(stats)}%` ], [ 'crit', `Crit res ${critResistance}%` ] ];
        const tags = [
            el('span', 'tag tag-element', name, { 'data-element': element }),
            ...chips.map(([ stat, text ]) => el('span', 'tag', text, { 'data-stat': stat }))
        ];

        this.enemyStats.replaceChildren(...tags.flatMap((tag, index) => (index ? [ el('span', 'gap', '  '), tag ] : [ tag ])));

        const weak = weaknessOf(element);

        this.weakChip.textContent = weak ? `Fraco: ${ELEMENT_LABELS[weak]}` : '';
        this.weakChip.setAttribute('data-element', weak ?? '');
    }

    //  The enemy line and its weak element chip go together
    clearEnemyStats ()
    {
        this.enemyStats.textContent = '';
        this.weakChip.textContent = '';
    }

    completeChapter ()
    {
        this.monster = null;
        this.clearEnemyStats();
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
        const text = `Time: ${this.countdown.seconds}`;

        //  The pill's width follows its text, so the timer is placed again only when the text changes, not on every frame
        if (this.bossTimer.textContent !== text)
        {
            this.bossTimer.textContent = text;
            this.placeBossTimer();
        }

        //  The ring of the timer fills with the share of the time left, 3 decimals (spec ui-redesign UIR-06)
        this.bossTimer.style.setProperty('--timer-left', Math.min(1, Math.max(0, this.countdown.remainingMs / this.countdown.limitMs)).toFixed(3));
    }

    //  The timer stays centred on x 512 while the stage plate ends 12 px before it; a longer plate pushes it right, 12 px after the plate
    //  (spec boss-replay-chapters, UI review #1). offsetWidth is in scene px: Phaser scales the DOM layer with a transform
    placeBossTimer ()
    {
        const plateEnd = STAGE_HUD_LEFT + this.stageHud.offsetWidth + BOSS_TIMER_GAP;
        const timerStart = BOSS_TIMER.x - this.bossTimer.offsetWidth / 2;

        this.bossTimer.style.setProperty('--timer-shift', `${Math.max(0, Math.ceil(plateEnd - timerStart))}px`);
    }

    hideCountdown ()
    {
        this.countdown = null;
        this.bossTimer.textContent = '';
        this.bossTimer.style.removeProperty('--timer-left');
        this.bossTimer.style.removeProperty('--timer-shift');
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

        const alive = this.monster && !this.monster.dead;
        //  The allies strike first, so an effect that ends in this frame still counts for them (spec hero-team)
        const allyTicks = this.allyFrame(delta);
        //  The stop of Stun and Root is read before the skills use it up with this frame
        const countdownMs = this.skills.countdownMs(delta);
        const { hits } = this.skills.advance(delta, { monster: this.monster, boss: this.countdown !== null });

        hits.forEach(({ damage, critical }) => this.showDamage(formatDamage(damage), MONSTER.x, critical));

        //  A tick that does not kill still moves the health bar and the HP text; one that kills runs the kill path
        if (alive && this.monster.dead)
        {
            this.afterDamage();
        }
        else if (alive && (hits.length > 0 || allyTicks > 0))
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
        return leaderAttacker({ leader: this.heroes.leader(), pieces: this.leaderPieces(), talents: this.talents.talents(), passives: this.passives() });
    }

    //  The heroes of the bought, filled ally slots while the team is active (spec hero-team); none before the heroes or the campaign load
    fightingAllies ()
    {
        return fightingAllies({ team: this.heroes.team(), heroes: this.heroes.heroes(), leaderId: this.heroes.leaderId(), active: teamActive(this.session.mapPosition()) });
    }

    //  The passives of the fighting allies: they reach the click, the monster stats and the boss countdown
    passives ()
    {
        return activePassives({ team: this.heroes.team(), heroes: this.heroes.heroes(), leaderId: this.heroes.leaderId(), position: this.session.mapPosition() });
    }

    //  The attacker of each fighting ally, read at every tick: its stars and pieces, the element of the leader and Seraphine's factor
    allyAttackers ()
    {
        const leader = this.heroes.leader();

        if (!leader)
        {
            return [];
        }

        const { allyFactor } = this.passives();

        return this.fightingAllies().map(({ slot, hero }) => ({
            slot, attacker: allyAttacker({ ally: hero, pieces: wornBy(this.equipment.pieces(), hero.id), leaderElement: leader.element, allyFactor })
        }));
    }

    //  The ally ticks of this frame on the monster on screen (a countdown means a boss); shows one number per tick. Returns how many landed.
    allyFrame (delta)
    {
        const monster = this.monster && !this.monster.dead ? this.monster : null;
        const boss = this.countdown !== null;
        const { ticks } = this.allies.advance(delta, {
            monster,
            allies: this.allyAttackers(),
            hit: (attacker, target) => this.skills.allyHit({ attacker, monster: target, boss }).damage
        });

        ticks.forEach(({ damage, slots }) =>
        {
            this.showDamage(formatDamage(damage), MONSTER.x + ALLY_TEXT_OFFSET, false, ALLY_TEXT);
            this.onAllyTick(slots);
        });

        return ticks.length;
    }

    //  The sprites of the slots that landed step 24 px toward the monster and back, 100 ms each way
    onAllyTick (slots)
    {
        slots.forEach((slot) =>
        {
            const sprite = this.allySprites.get(slot);

            if (!sprite)
            {
                return;
            }

            this.tweens.killTweensOf(sprite);
            sprite.x = FORMATION[slot].x;
            this.tweens.add({ targets: sprite, x: FORMATION[slot].x + ALLY_MOVE.distance, duration: ALLY_MOVE.duration, yoyo: true });
        });
    }

    //  The leader uses the skill of `slot` (a click on its slot or the key 1, 2 or 3) on the monster on screen. A countdown means a boss.
    useSkill (slot)
    {
        const leader = this.heroes.leader();

        if (!leader || this.paused || this.heroUi.isOpen || !this.monster || this.monster.dead)
        {
            return;
        }

        const skill = leader.skills.find((candidate) => candidate.slot === slot);
        const result = this.skills.use({
            heroId: leader.id,
            slot,
            unlocked: skill?.unlocked ?? false,
            level: skillLevelOf(skill),
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
        this.clearEnemyStats();
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

    //  The fight runs behind an open hero screen, but a click on the canvas around the panel does not hit
    hitMonster (pointer)
    {
        if (this.paused || this.heroUi.isOpen || !this.monster || this.monster.dead)
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
            this.clearEnemyStats();

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

    //  The fight of a farmed boss: a boss of another chapter fights with the definition the farm loaded for that chapter, any other with the
    //  campaign's. Null when that chapter's definition was never loaded.
    farmEncounterFor (boss)
    {
        if (!Number.isInteger(boss.chapter))
        {
            return this.session.farmEncounter(boss);
        }

        const definition = this.farm.definitionOf(boss.chapter);

        return definition ? farmEncounterOf(definition, boss) : null;
    }

    //  Fights a boss the player already beat again and again; the campaign position and its report queue are never touched
    startFarm (boss)
    {
        if (!this.session.loaded)
        {
            return;
        }

        const encounter = this.farmEncounterFor(boss);

        if (!encounter)
        {
            return;
        }

        this.farmBoss = boss;
        this.farmBySwitch = false;
        this.generation += 1;
        this.hideCountdown();
        this.tweens.killTweensOf(this.monsterParts);
        this.showEncounter(encounter);
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

        return this.farmEncounterFor(this.farmBoss);
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
                this.heroUi.show('farm', Number.isInteger(boss.chapter) ? { chapter: boss.chapter } : {});
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
            const metal = coinMetal(share + (i < extra ? 1 : 0));
            const coin = this.add.sprite(MONSTER.x, MONSTER.y, `coin_${metal}`).play(`rotate_${metal}`);

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

    //  A critical hit is bigger and orange, a normal one gold; `style` gives another look (the light-blue number of an ally tick)
    showDamage (damage, x, critical = false, style = null)
    {
        const textStyle = { ...DAMAGE_FONT, ...(style ?? (critical ? CRITICAL_TEXT : NORMAL_TEXT)) };

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
