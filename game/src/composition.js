//  Composition root (ADR 0007): the one place that builds adapters and hands them to the application services.
import { authApi } from './adapters/http/authApi';
import { createHttpClient } from './adapters/http/httpClient';
import { createProgressApi } from './adapters/http/progressApi';
import { createUserApi } from './adapters/http/userApi';
import { createWalletApi } from './adapters/http/walletApi';
import { sessionStore } from './adapters/storage/sessionStore';
import { createCampaignSession as createCampaignSessionService } from './application/campaign/campaignSession';
import { createSessionManager } from './application/session/sessionManager';
import { createWalletSync as createWalletSyncService } from './application/wallet/walletSync';

export const sessionManager = createSessionManager({ store: sessionStore, authGateway: authApi });

const httpClient = createHttpClient({ session: sessionManager });

export const userApi = createUserApi(httpClient);
export const walletApi = createWalletApi(httpClient);
export const progressApi = createProgressApi(httpClient);

//  A fresh wallet service and campaign session per game scene
export const createWalletSync = () => createWalletSyncService({ gateway: walletApi });
export const createCampaignSession = () => createCampaignSessionService({ gateway: progressApi });

//  What the scenes receive through the game registry (see main.js)
export const services = { session: sessionManager, users: userApi, createWalletSync, createCampaignSession };
