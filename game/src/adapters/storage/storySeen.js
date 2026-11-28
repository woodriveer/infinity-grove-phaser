//  Remembers which story scenes opened by themselves (spec story-scenes), per browser, in localStorage. When storage cannot be read
//  or written the list lives in memory, so a scene plays at most once per page load.
const STORAGE_KEY = 'infinity-grove.story-seen';

//  `storage` returns the Storage to use; it is read on every call because merely touching localStorage can throw
export const createStorySeen = (storage = () => globalThis.localStorage) =>
{
    let memory = [];   //  the list when storage cannot be read or written (spec D22)

    //  A missing key or a storage that throws reads as the memory list; a value that is not a JSON array reads as []
    const read = () =>
    {
        let value;

        try
        {
            value = storage().getItem(STORAGE_KEY);
        }
        catch
        {
            return memory;
        }

        if (value === null)
        {
            return memory;
        }

        try
        {
            const list = JSON.parse(value);

            return Array.isArray(list) ? list.filter((id) => typeof id === 'string') : [];
        }
        catch
        {
            return [];
        }
    };

    return {
        seen: () => [ ...read() ],

        markSeen: (id) =>
        {
            const list = read();

            memory = list.includes(id) ? [ ...list ] : [ ...list, id ];

            try
            {
                storage().setItem(STORAGE_KEY, JSON.stringify(memory));
            }
            catch
            {
                //  Storage unavailable: the list lasts until the page closes.
            }
        }
    };
};

export const storySeen = createStorySeen();
