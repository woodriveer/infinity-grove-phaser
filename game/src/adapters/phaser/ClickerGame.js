import { Scene } from 'phaser';
import { BossCountdown } from '../../domain/campaign/bossCountdown';
import { calculateDamage, formatDamage } from '../../domain/combat/damage';
import { Monster } from '../../domain/combat/monster';

const CHARACTER = { x: 300, y: 500, size: 100, color: 0x000000 };
const MONSTER = { x: 700, y: 500, width: 160, height: 200, color: 0xcc2222 };
const HEALTH_BAR = { width: 120, height: 12, gap: 16, backColor: 0x222222, fillColor: 0x33cc33 };
const DAMAGE_TEXT = { rise: 40, duration: 800 };
const DEATH = { fadeDuration: 500, respawnDelay: 1000 };
const WALLET = { x: 180, y: 32 };
const COIN = { duration: 600, stagger: 100 };
const WALLET_SYNC_MS = 10000;
const WALLET_HTML = '<div class="wallet"></div>';
const STAGE_HUD = { x: 512, y: 32 };
const BOSS_TIMER = { x: 512, y: 72 };
const ENEMY_STATS = { x: 512, y: 108 };
const CRITICAL_TEXT = { color: '#ffd700', fontSize: 52 };
const NORMAL_TEXT = { color: '#ffffff', fontSize: 38 };
const STAGE_MESSAGE = { x: 512, y: 384 };
const STAGE_HUD_HTML = '<div class="stage-hud"></div>';
const BOSS_TIMER_HTML = '<div class="boss-timer"></div>';
const ENEMY_STATS_HTML = '<div class="enemy-stats"></div>';
const STAGE_MESSAGE_HTML = '<div class="stage-message"></div>';
const FARM_TOGGLE = { x: 512, y: 730 };
const PAUSE_MENU = { x: 512, y: 384 };
const FARM_TOGGLE_HTML = '<label class="farm-toggle"><input type="checkbox"> Farm boss</label>';
const PAUSE_MENU_HTML = '<div class="pause-menu" hidden>'
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
    + '</div>';
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
        this.random = services.random ?? Math.random;
        this.loadingCampaign = false;
        this.paused = false;
        this.session.onRealign((encounter) => this.realign(encounter));

        this.add.image(512, 384, 'background');

        this.add.rectangle(CHARACTER.x, CHARACTER.y, CHARACTER.size, CHARACTER.size, CHARACTER.color);
        const body = this.add.rectangle(MONSTER.x, MONSTER.y, MONSTER.width, MONSTER.height, MONSTER.color);

        //  The bar is centred above the monster's head
        const barX = MONSTER.x - HEALTH_BAR.width / 2;
        const barY = MONSTER.y - MONSTER.height / 2 - HEALTH_BAR.gap - HEALTH_BAR.height;

        const back = this.add.rectangle(barX, barY, HEALTH_BAR.width, HEALTH_BAR.height, HEALTH_BAR.backColor).setOrigin(0, 0);
        this.healthFill = this.add.rectangle(barX, barY, HEALTH_BAR.width, HEALTH_BAR.height, HEALTH_BAR.fillColor).setOrigin(0, 0);
        this.monsterParts = [ body, back, this.healthFill ];
        this.monsterParts.forEach((part) => part.setAlpha(0));
        this.damageTextY = barY - 8;

        //  Any click on the canvas hits the monster, not only a click on the monster itself
        this.input.on('pointerdown', (pointer) => this.hitMonster(pointer));

        //  Real HTML text in the top-left corner (ADR 0004); click-through so the canvas still gets every click
        this.walletText = this.add.dom(WALLET.x, WALLET.y).createFromHTML(WALLET_HTML).setVisible(false);
        this.walletText.pointerEvents = 'none';
        this.loadWallet();

        //  Stage position, boss countdown and messages are real HTML too, click-through like the wallet text
        this.stageHud = this.createHtml(STAGE_HUD, STAGE_HUD_HTML, '.stage-hud');
        this.bossTimer = this.createHtml(BOSS_TIMER, BOSS_TIMER_HTML, '.boss-timer');
        this.enemyStats = this.createHtml(ENEMY_STATS, ENEMY_STATS_HTML, '.enemy-stats');
        this.stageMessage = this.createHtml(STAGE_MESSAGE, STAGE_MESSAGE_HTML, '.stage-message');
        this.createControls();
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
        this.pauseElement = this.add.dom(PAUSE_MENU.x, PAUSE_MENU.y).createFromHTML(PAUSE_MENU_HTML);
        this.pauseMenu = this.pauseElement.node.querySelector('.pause-menu');
        this.pauseOptions = this.pauseMenu.querySelector('.pause-options');
        this.pauseConfirm = this.pauseMenu.querySelector('.pause-confirm');

        this.pauseMenu.querySelector('.pause-continue').addEventListener('click', () => this.resumeFight());
        this.pauseMenu.querySelector('.pause-leave').addEventListener('click', () => this.askToLeave());
        this.pauseMenu.querySelector('.pause-confirm-yes').addEventListener('click', () => this.leaveFight());
        this.pauseMenu.querySelector('.pause-confirm-no').addEventListener('click', () => this.showPauseOptions());

        this.input.keyboard.on('keydown-ESC', () => (this.paused ? this.resumeFight() : this.pauseFight()));
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

        this.monster = new Monster(encounter.health, 1, encounter.stats);
        this.updateHealthBar();
        this.monsterParts.forEach((part) => part.setAlpha(1));
        this.stageHud.textContent = encounter.label;
        this.showEnemyStats(encounter.stats);

        if (encounter.timeLimitMs)
        {
            this.countdown = new BossCountdown(encounter.timeLimitMs);
            this.showCountdown();
        }
    }

    //  "Water  Physical def 10%  Magical def 10%  Crit res 12%"
    showEnemyStats ({ element, physicalDefense, magicalDefense, critResistance })
    {
        const name = element.charAt(0) + element.slice(1).toLowerCase();

        this.enemyStats.textContent = `${name}  Physical def ${physicalDefense}%  Magical def ${magicalDefense}%  Crit res ${critResistance}%`;
    }

    completeChapter ()
    {
        this.monster = null;
        this.enemyStats.textContent = '';
        this.monsterParts.forEach((part) => part.setAlpha(0));
        this.stageHud.textContent = '';
        this.stageMessage.textContent = COMPLETED_TEXT;
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
        if (!this.countdown || this.paused)
        {
            return;
        }

        this.countdown.advance(delta);
        this.showCountdown();

        if (this.countdown.expired)
        {
            this.bossTimedOut();
        }
    }

    //  The boss survived its time limit: it leaves, and the stage's last phase comes back after the respawn delay
    bossTimedOut ()
    {
        this.hideCountdown();
        this.monster = null;
        this.enemyStats.textContent = '';
        this.monsterParts.forEach((part) => part.setAlpha(0));

        this.showAfterDelay(this.session.fail());
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

    refreshWalletText ()
    {
        const { gold, silver, copper } = this.wallet.display();

        this.walletText.node.querySelector('.wallet').textContent = `Gold: ${gold}  Silver: ${silver}  Copper: ${copper}`;
    }

    hitMonster (pointer)
    {
        if (this.paused || !this.monster || this.monster.dead)
        {
            return;
        }

        const { damage, critical } = calculateDamage({ defender: this.monster.stats, random: this.random });

        this.monster.hit(damage);
        this.updateHealthBar();
        this.showDamage(formatDamage(damage), this.damageTextX(pointer), critical);

        if (this.monster.dead)
        {
            this.enemyStats.textContent = '';
            this.dropCoins();
            this.fadeOutMonster(this.clearEncounter());
        }
    }

    //  Farming a boss replays it without reporting a win, so the stored position stays on that boss
    clearEncounter ()
    {
        const farming = this.countdown && this.farmToggle.checked;

        this.hideCountdown();

        return farming ? this.session.encounter() : this.session.clear();
    }

    //  One coin per copper of the next queued drop flies from the monster to the wallet text; each landing counts 1 copper
    dropCoins ()
    {
        const drop = this.wallet.takeDrop(this.monster.level);

        if (!drop)
        {
            return;
        }

        for (let i = 0; i < drop.value; i++)
        {
            const coin = this.add.sprite(MONSTER.x, MONSTER.y, 'coin').play('rotate');

            this.tweens.add({
                targets: coin,
                x: WALLET.x,
                y: WALLET.y,
                duration: COIN.duration,
                delay: i * COIN.stagger,
                onComplete: () =>
                {
                    coin.destroy();
                    this.wallet.land(drop.id);
                    this.refreshWalletText();
                }
            });
        }
    }

    updateHealthBar ()
    {
        this.healthFill.setSize(HEALTH_BAR.width * this.monster.health / this.monster.maxHealth, HEALTH_BAR.height);
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

    //  A critical hit is bigger and gold
    showDamage (damage, x, critical = false)
    {
        const textStyle = { fontFamily: 'Arial Black', ...(critical ? CRITICAL_TEXT : NORMAL_TEXT), stroke: '#000000', strokeThickness: 8 };

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
