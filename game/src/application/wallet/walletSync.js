import { WalletLedger } from '../../domain/economy/walletLedger';

//  Loads the wallet, hands out queued drops and reports kills in batches. The scene only draws.
//  Port (ADR 0007):
//    gateway  { get(), sync(kills) }  the backend /wallet calls (get -> { wallet, drops }, sync -> { wallet, accepted, drops })
//  Failures never throw out of this service: a wallet that did not load drops nothing and a sync that failed is retried.
export const createWalletSync = ({ gateway }) =>
{
    const ledger = new WalletLedger();
    let loading = false;

    //  Resolves true when this call loaded the wallet
    const load = async () =>
    {
        if (loading)
        {
            return false;
        }

        loading = true;

        try
        {
            ledger.load(await gateway.get());
            return true;
        }
        catch
        {
            return false;
        }
        finally
        {
            loading = false;
        }
    };

    //  Resolves true when the server confirmed the sent kills
    const sync = async () =>
    {
        const kills = ledger.beginSync();

        if (!kills)
        {
            return false;
        }

        try
        {
            ledger.completeSync(await gateway.sync(kills));
            return true;
        }
        catch
        {
            ledger.failSync();
            return false;
        }
    };

    return {
        get loaded () { return ledger.loaded; },

        display: () => ledger.display(),

        //  The wallet the backend answered after an action outside the sync (a refine, a reroll or a sale)
        setWallet: (coins) => ledger.setBase(coins),

        takeDrop: (level) => ledger.takeDrop(level),

        land: (id, amount) => ledger.land(id, amount),

        load,

        //  Every tick either retries a wallet that never loaded or sends the unreported kills.
        //  Resolves true when the wallet changed (loaded or confirmed by the server).
        tick: () => (ledger.loaded ? sync() : load()),

        //  One last, best-effort sync when the scene ends; a failure is not retried
        syncOnExit: () =>
        {
            const kills = ledger.beginSync();

            if (kills)
            {
                gateway.sync(kills).catch(() => {});
            }
        }
    };
};
