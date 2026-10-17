import { Scene } from 'phaser';
import { walletApi } from '../composition';
import { DAMAGE_PER_CLICK, Monster } from '../domain/combat/monster';
import { WalletLedger } from '../domain/economy/walletLedger';

const CHARACTER = { x: 300, y: 500, size: 100, color: 0x000000 };
const MONSTER = { x: 700, y: 500, width: 160, height: 200, color: 0xcc2222 };
const HEALTH_BAR = { width: 120, height: 12, gap: 16, backColor: 0x222222, fillColor: 0x33cc33 };
const DAMAGE_TEXT = { rise: 40, duration: 800 };
const DEATH = { fadeDuration: 500, respawnDelay: 1000 };
const WALLET = { x: 180, y: 32 };
const COIN = { duration: 600, stagger: 100 };
const WALLET_SYNC_MS = 10000;
const WALLET_HTML = '<div class="wallet"></div>';

export class ClickerGame extends Scene
{
    constructor ()
    {
        super('ClickerGame');
    }

    create ()
    {
        this.monster = new Monster();
        this.ledger = new WalletLedger();

        this.add.image(512, 384, 'background');

        this.add.rectangle(CHARACTER.x, CHARACTER.y, CHARACTER.size, CHARACTER.size, CHARACTER.color);
        const body = this.add.rectangle(MONSTER.x, MONSTER.y, MONSTER.width, MONSTER.height, MONSTER.color);

        //  The bar is centred above the monster's head
        const barX = MONSTER.x - HEALTH_BAR.width / 2;
        const barY = MONSTER.y - MONSTER.height / 2 - HEALTH_BAR.gap - HEALTH_BAR.height;

        const back = this.add.rectangle(barX, barY, HEALTH_BAR.width, HEALTH_BAR.height, HEALTH_BAR.backColor).setOrigin(0, 0);
        this.healthFill = this.add.rectangle(barX, barY, HEALTH_BAR.width, HEALTH_BAR.height, HEALTH_BAR.fillColor).setOrigin(0, 0);
        this.monsterParts = [ body, back, this.healthFill ];
        this.damageTextY = barY - 8;

        //  Any click on the canvas hits the monster, not only a click on the monster itself
        this.input.on('pointerdown', (pointer) => this.hitMonster(pointer));

        //  Real HTML text in the top-left corner (ADR 0004); click-through so the canvas still gets every click
        this.walletText = this.add.dom(WALLET.x, WALLET.y).createFromHTML(WALLET_HTML).setVisible(false);
        this.walletText.pointerEvents = 'none';
        this.loadWallet();

        //  Kills reach the backend in batches, never one request per kill
        this.time.addEvent({ delay: WALLET_SYNC_MS, loop: true, callback: () => this.tick() });
        this.events.once('shutdown', () => this.syncOnExit());
    }

    //  Every tick either retries a wallet that never loaded or sends the unreported kills
    tick ()
    {
        if (this.ledger.loaded)
        {
            this.syncWallet();
        }
        else
        {
            this.loadWallet();
        }
    }

    async syncWallet ()
    {
        const kills = this.ledger.beginSync();

        if (!kills)
        {
            return;
        }

        let result;

        try
        {
            result = await walletApi.sync(kills);
        }
        catch
        {
            if (this.sys.isActive())
            {
                this.ledger.failSync();
            }

            return;
        }

        if (!this.sys.isActive())
        {
            return;
        }

        this.ledger.completeSync(result);
        this.refreshWalletText();
    }

    //  One last, best-effort sync when the scene ends; a failure is not retried
    syncOnExit ()
    {
        const kills = this.ledger.beginSync();

        if (kills)
        {
            walletApi.sync(kills).catch(() => {});
        }
    }

    //  Without a wallet the game plays on but nothing drops
    async loadWallet ()
    {
        if (this.loadingWallet)
        {
            return;
        }

        this.loadingWallet = true;

        let data;

        try
        {
            data = await walletApi.get();
        }
        catch
        {
            return;
        }
        finally
        {
            this.loadingWallet = false;
        }

        if (!this.sys.isActive())
        {
            return;
        }

        this.ledger.load(data);
        this.refreshWalletText();
        this.walletText.setVisible(true);
    }

    refreshWalletText ()
    {
        const { gold, silver, copper } = this.ledger.display();

        this.walletText.node.querySelector('.wallet').textContent = `Gold: ${gold}  Silver: ${silver}  Copper: ${copper}`;
    }

    hitMonster (pointer)
    {
        if (!this.monster.hit())
        {
            return;
        }

        this.updateHealthBar();
        this.showDamage(DAMAGE_PER_CLICK, this.damageTextX(pointer));

        if (this.monster.dead)
        {
            this.fadeOutMonster();
            this.dropCoins();
        }
    }

    //  One coin per copper of the next queued drop flies from the monster to the wallet text; each landing counts 1 copper
    dropCoins ()
    {
        const drop = this.ledger.takeDrop(this.monster.level);

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
                    this.ledger.land(drop.id);
                    this.refreshWalletText();
                }
            });
        }
    }

    updateHealthBar ()
    {
        this.healthFill.setSize(HEALTH_BAR.width * this.monster.health / this.monster.maxHealth, HEALTH_BAR.height);
    }

    fadeOutMonster ()
    {
        this.tweens.add({
            targets: this.monsterParts,
            alpha: 0,
            duration: DEATH.fadeDuration,
            onComplete: () => this.time.delayedCall(DEATH.respawnDelay, () => this.respawnMonster())
        });
    }

    respawnMonster ()
    {
        this.monster.respawn();
        this.updateHealthBar();
        this.monsterParts.forEach((part) => part.setAlpha(1));
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
