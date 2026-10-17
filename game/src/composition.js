//  Composition root (ADR 0007): the one place that builds adapters and hands them to the application services.
import { authApi } from './adapters/http/authApi';
import { createHttpClient } from './adapters/http/httpClient';
import { createUserApi } from './adapters/http/userApi';
import { createWalletApi } from './adapters/http/walletApi';
import { sessionStore } from './adapters/storage/sessionStore';
import { createSessionManager } from './application/session/sessionManager';
import { createWalletSync as createWalletSyncService } from './application/wallet/walletSync';

export const sessionManager = createSessionManager({ store: sessionStore, authGateway: authApi });

const httpClient = createHttpClient({ session: sessionManager });

export const userApi = createUserApi(httpClient);
export const walletApi = createWalletApi(httpClient);

//  A fresh wallet service per game scene
export const createWalletSync = () => createWalletSyncService({ gateway: walletApi });
