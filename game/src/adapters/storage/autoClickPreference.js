//  Remembers whether the player left the auto click switch on (spec auto-click), in localStorage. On by default, and on when storage
//  cannot be read; a write that fails is ignored.
const STORAGE_KEY = 'infinity-grove.auto-click';
const OFF = 'off';

//  `storage` returns the Storage to use; it is read on every call because merely touching localStorage can throw
export const createAutoClickPreference = (storage = () => globalThis.localStorage) => ({
    enabled: () =>
    {
        try
        {
            return storage().getItem(STORAGE_KEY) !== OFF;
        }
        catch
        {
            return true;
        }
    },

    setEnabled: (on) =>
    {
        try
        {
            storage().setItem(STORAGE_KEY, on ? 'on' : OFF);
        }
        catch
        {
            //  Storage unavailable: the choice lasts until the scene closes.
        }
    }
});

export const autoClickPreference = createAutoClickPreference();
