//  Composition root (ADR 0007): the one place that builds adapters and hands them to the application services.
import { sessionStore } from './adapters/storage/sessionStore';
import { authApi } from './api/authApi';
import { createSessionManager } from './application/session/sessionManager';

export const sessionManager = createSessionManager({ store: sessionStore, authGateway: authApi });
