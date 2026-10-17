import { Scene } from 'phaser';
import { BossCountdown } from '../../domain/campaign/bossCountdown';
import { DAMAGE_PER_CLICK, Monster } from '../../domain/combat/monster';

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
const STAGE_MESSAGE = { x: 512, y: 384 };
const STAGE_HUD_HTML = '<div class="stage-hud"></div>';
const BOSS_TIMER_HTML = '<div class="boss-timer"></div>';
const STAGE_MESSAGE_HTML = '<div class="stage-message"></div>';
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
        this.loadingCampaign = false;
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
        this.stageMessage = this.createHtml(STAGE_MESSAGE, STAGE_MESSAGE_HTML, '.stage-message');
        this.loadCampaign();

        //  Kills reach the backend in batches, never one request per kill
        this.time.addEvent({ delay: WALLET_SYNC_MS, loop: true, callback: () => this.tick() });
        this.events.once('shutdown', () => this.syncOnExit());
    }

    //  A click-through HTML element; returns the node that holds the text
    createHtml ({ x, y }, html, selector)
    {
        const element = this.add.dom(x, y).createFromHTML(html);

        element.pointerEvents = 'none';

        return element.node.querySelector(selector);
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

        this.monster = new Monster(encounter.health);
        this.updateHealthBar();
        this.monsterParts.forEach((part) => part.setAlpha(1));
        this.stageHud.textContent = encounter.label;

        if (encounter.timeLimitMs)
        {
            this.countdown = new BossCountdown(encounter.timeLimitMs);
            this.showCountdown();
        }
    }

    completeChapter ()
    {
        this.monster = null;
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
        if (!this.countdown)
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
        if (!this.monster || !this.monster.hit())
        {
            return;
        }

        this.updateHealthBar();
        this.showDamage(DAMAGE_PER_CLICK, this.damageTextX(pointer));

        if (this.monster.dead)
        {
            this.dropCoins();
            this.hideCountdown();
            this.fadeOutMonster(this.session.clear());
        }
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

    showDamage (damage, x)
    {
        const textStyle = { fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff', stroke: '#000000', strokeThickness: 8 };

        const text = this.add.text(x, this.damageTextY, String(damage), textStyle).setOrigin(0.5, 1).setDepth(1);

        this.tweens.add({
            targets: text,
            y: text.y - DAMAGE_TEXT.rise,
            alpha: 0,
            duration: DAMAGE_TEXT.duration,
            onComplete: () => text.destroy()
        });
    }
}
