//  Composition root (ADR 0007): the one place that builds adapters and hands them to the application services.
import { createAccountResetApi } from './adapters/http/accountResetApi';
import { authApi } from './adapters/http/authApi';
import { createAutoClickApi } from './adapters/http/autoClickApi';
import { createEquipmentApi } from './adapters/http/equipmentApi';
import { createFarmApi } from './adapters/http/farmApi';
import { createGiftApi } from './adapters/http/giftApi';
import { createHealthApi } from './adapters/http/healthApi';
import { createHeroesApi } from './adapters/http/heroesApi';
import { createHttpClient } from './adapters/http/httpClient';
import { createProgressApi } from './adapters/http/progressApi';
import { createTalentApi } from './adapters/http/talentApi';
import { createUserApi } from './adapters/http/userApi';
import { createWalletApi } from './adapters/http/walletApi';
import { autoClickPreference } from './adapters/storage/autoClickPreference';
import { sessionStore } from './adapters/storage/sessionStore';
import { createAccountReset as createAccountResetService } from './application/accountReset/accountReset';
import { createResetLegacy as createResetLegacyService } from './application/accountReset/resetLegacy';
import { createAutoClickState as createAutoClickStateService } from './application/autoClick/autoClickState';
import { createCampaignSession as createCampaignSessionService } from './application/campaign/campaignSession';
import { createEquipmentCollection as createEquipmentCollectionService } from './application/equipment/equipmentCollection';
import { createFarmSession as createFarmSessionService } from './application/farm/farmSession';
import { createHeroCollection as createHeroCollectionService } from './application/heroes/heroCollection';
import { createSessionManager } from './application/session/sessionManager';
import { createTalentCollection as createTalentCollectionService } from './application/talents/talentCollection';
import { createWalletSync as createWalletSyncService } from './application/wallet/walletSync';

export const sessionManager = createSessionManager({ store: sessionStore, authGateway: authApi });

const httpClient = createHttpClient({ session: sessionManager });

export const userApi = createUserApi(httpClient);
export const walletApi = createWalletApi(httpClient);
export const progressApi = createProgressApi(httpClient);
export const heroesApi = createHeroesApi(httpClient);
export const farmApi = createFarmApi(httpClient);
export const equipmentApi = createEquipmentApi(httpClient);
export const talentApi = createTalentApi(httpClient);
export const autoClickApi = createAutoClickApi(httpClient);
export const accountResetApi = createAccountResetApi(httpClient);
export const healthApi = createHealthApi(httpClient);
export const giftApi = createGiftApi(httpClient);

//  A fresh wallet service, campaign session, hero collection, equipment collection, talent collection, farm session and auto click state
//  per game scene
export const createWalletSync = () => createWalletSyncService({ gateway: walletApi });
export const createCampaignSession = () => createCampaignSessionService({ gateway: progressApi });
export const createHeroCollection = () => createHeroCollectionService({ gateway: heroesApi });
export const createFarmSession = () => createFarmSessionService({ gateway: farmApi });
export const createEquipmentCollection = () => createEquipmentCollectionService({ gateway: equipmentApi });
export const createTalentCollection = () => createTalentCollectionService({ gateway: talentApi });
export const createAutoClickState = () => createAutoClickStateService({ gateway: autoClickApi });
//  The legacy of the account resets is one value for the whole game, shared by the reset and the scene (spec reset-legacy-drops)
export const resetLegacy = createResetLegacyService({ gateway: accountResetApi });
//  The legacy is of one player: a login or a logout drops it, so the next player never sees it
sessionManager.onChange(resetLegacy.clear);
//  The reset works on the session, the auto click state and the talent collection of the scene that asks for it
export const createAccountReset = ({ session, autoClick, talents }) => createAccountResetService({ gateway: accountResetApi, session, autoClick, talents, legacy: resetLegacy });

//  What the scenes receive through the game registry (see main.js); backend.wake() waits for a backend Cloud Run is starting
export const services = {
    session: sessionManager,
    users: userApi,
    backend: healthApi,
    gifts: giftApi,
    createWalletSync,
    createCampaignSession,
    createHeroCollection,
    createEquipmentCollection,
    createTalentCollection,
    createFarmSession,
    createAutoClickState,
    createAccountReset,
    resetLegacy,
    autoClickPreference
};
