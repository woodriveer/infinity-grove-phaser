//  The game-side mirror of the player's wallet. The backend is the source of truth; between syncs the
//  ledger keeps the server's last wallet (`base`), the queues of pre-rolled drops, and one entry per
//  drop taken by a kill whose value the server has not yet confirmed.
//  Pure JavaScript: no Phaser, so every rule is unit-tested.
const COPPER_PER_SILVER = 100;
const SILVER_PER_GOLD = 100;

export class WalletLedger
{
    constructor ()
    {
        this.loaded = false;
        this.base = { gold: 0, silver: 0, copper: 0 };
        this.queues = {};
        this.entries = [];
        this.nextId = 1;
    }

    load ({ wallet, drops })
    {
        this.base = { ...wallet };
        this.queues = Object.fromEntries(Object.entries(drops).map(([ level, values ]) => [ level, [ ...values ] ]));
        this.loaded = true;
    }

    //  Takes the next queued value of the level for a kill; null when there is nothing to drop
    takeDrop (level)
    {
        const queue = this.queues[String(level)];

        if (!this.loaded || !queue || queue.length === 0)
        {
            return null;
        }

        const entry = { id: this.nextId++, level: String(level), value: queue.shift(), landed: 0, inFlight: false };

        this.entries.push(entry);

        return { id: entry.id, value: entry.value };
    }

    //  One coin of the drop reached the wallet text: it counts 1 copper. Coins of unknown or settled drops count nothing.
    land (id)
    {
        const entry = this.entries.find((candidate) => candidate.id === id);

        if (entry && entry.landed < entry.value)
        {
            entry.landed += 1;
        }
    }

    //  The server wallet plus the landed copper of every drop the server has not confirmed, carried up
    display ()
    {
        const landed = this.entries.reduce((sum, entry) => sum + entry.landed, 0);
        const copper = this.base.copper + landed;
        const silver = this.base.silver + Math.floor(copper / COPPER_PER_SILVER);
        const gold = this.base.gold + Math.floor(silver / SILVER_PER_GOLD);

        return { gold, silver: silver % SILVER_PER_GOLD, copper: copper % COPPER_PER_SILVER };
    }

    hasUnreported ()
    {
        return this.entries.length > 0;
    }
}
