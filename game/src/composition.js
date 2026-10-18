//  Composition root (ADR 0007): the one place that builds adapters and hands them to the application services.
import { authApi } from './adapters/http/authApi';
import { createFarmApi } from './adapters/http/farmApi';
import { createHeroesApi } from './adapters/http/heroesApi';
import { createHttpClient } from './adapters/http/httpClient';
import { createProgressApi } from './adapters/http/progressApi';
import { createUserApi } from './adapters/http/userApi';
import { createWalletApi } from './adapters/http/walletApi';
import { sessionStore } from './adapters/storage/sessionStore';
import { createCampaignSession as createCampaignSessionService } from './application/campaign/campaignSession';
import { createFarmSession as createFarmSessionService } from './application/farm/farmSession';
import { createHeroCollection as createHeroCollectionService } from './application/heroes/heroCollection';
import { createSessionManager } from './application/session/sessionManager';
import { createWalletSync as createWalletSyncService } from './application/wallet/walletSync';

export const sessionManager = createSessionManager({ store: sessionStore, authGateway: authApi });

const httpClient = createHttpClient({ session: sessionManager });

export const userApi = createUserApi(httpClient);
export const walletApi = createWalletApi(httpClient);
export const progressApi = createProgressApi(httpClient);
export const heroesApi = createHeroesApi(httpClient);
export const farmApi = createFarmApi(httpClient);

//  A fresh wallet service, campaign session, hero collection and farm session per game scene
export const createWalletSync = () => createWalletSyncService({ gateway: walletApi });
export const createCampaignSession = () => createCampaignSessionService({ gateway: progressApi });
export const createHeroCollection = () => createHeroCollectionService({ gateway: heroesApi });
export const createFarmSession = () => createFarmSessionService({ gateway: farmApi });

//  What the scenes receive through the game registry (see main.js)
export const services = {
    session: sessionManager,
    users: userApi,
    createWalletSync,
    createCampaignSession,
    createHeroCollection,
    createFarmSession
};
