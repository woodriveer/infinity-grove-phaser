import { httpClient } from './httpClient';

//  Wraps the backend WalletController (/wallet). Both calls carry the Bearer token through httpClient.
//  get -> { wallet: { gold, silver, copper }, drops: { "<level>": [values] } }
//  sync(kills) -> { wallet, accepted: { "<level>": n }, drops }, where kills is { "<level>": n }.
export const walletApi = {
    get: async () => (await httpClient.get('/wallet')).data,

    sync: async (kills) => (await httpClient.post('/wallet/sync', { kills })).data
};
