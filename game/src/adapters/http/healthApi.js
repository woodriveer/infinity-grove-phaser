//  Wraps the backend HealthController (GET /health, public). Cloud Run may be starting the backend from zero (spec supabase-postgres, RUN-06):
//  wake() asks once and waits up to WAKE_TIMEOUT_MS. It resolves true when the backend answered 2xx and false on any error; it never rejects.
export const WAKE_TIMEOUT_MS = 60000;

export const createHealthApi = (httpClient) => ({
    wake: async () =>
    {
        try
        {
            await httpClient.get('/health', { skipAuth: true, timeout: WAKE_TIMEOUT_MS });

            return true;
        }
        catch
        {
            return false;
        }
    }
});
