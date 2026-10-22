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
        this.syncing = false;
    }

    load ({ wallet, drops })
    {
        this.base = { ...wallet };
        this.queues = Object.fromEntries(Object.entries(drops).map(([ level, values ]) => [ level, [ ...values ] ]));
        this.loaded = true;
    }

    //  The backend changed the wallet outside a sync (a refine, a reroll or a sale): its total replaces the base; coins that landed
    //  and were not confirmed yet stay on top of it
    setBase (wallet)
    {
        this.base = { ...wallet };
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

    //  A coin of the drop reached the wallet text: it counts `amount` copper (1 by default), never past the drop's value.
    //  Coins of unknown or settled drops count nothing.
    land (id, amount = 1)
    {
        const entry = this.entries.find((candidate) => candidate.id === id);

        if (entry)
        {
            entry.landed = Math.min(entry.value, entry.landed + amount);
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

    //  Marks every unreported drop as sent and returns the kill counts per level for POST /wallet/sync.
    //  Null while a sync is in flight (never two at once) or when there is nothing to send.
    beginSync ()
    {
        const pending = this.entries.filter((entry) => !entry.inFlight);

        if (this.syncing || pending.length === 0)
        {
            return null;
        }

        const kills = {};

        pending.forEach((entry) =>
        {
            entry.inFlight = true;
            kills[entry.level] = (kills[entry.level] ?? 0) + 1;
        });
        this.syncing = true;

        return kills;
    }

    //  The server confirmed the sent drops: they leave the ledger, its wallet becomes the base, and each queue
    //  is the server queue minus the drops this client already took since the request was sent.
    completeSync ({ wallet, drops })
    {
        const takenSince = {};

        this.entries.filter((entry) => !entry.inFlight).forEach((entry) =>
        {
            takenSince[entry.level] = (takenSince[entry.level] ?? 0) + 1;
        });

        this.entries = this.entries.filter((entry) => !entry.inFlight);
        this.base = { ...wallet };
        this.queues = Object.fromEntries(
            Object.entries(drops).map(([ level, values ]) => [ level, values.slice(takenSince[level] ?? 0) ])
        );
        this.syncing = false;
    }

    //  The request failed: every drop stays unreported and goes out with the next sync
    failSync ()
    {
        this.entries.forEach((entry) =>
        {
            entry.inFlight = false;
        });
        this.syncing = false;
    }
}
