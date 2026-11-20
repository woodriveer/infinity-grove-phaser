//  Wraps the backend GiftController (/gifts). The call carries the Bearer token through httpClient.
//  claim() -> { granted: true, gift: 'BLACK_AWARENESS_STAFF', piece } or { granted: false } (spec black-awareness-staff).
//  A failure rejects with an ApiError.
export const createGiftApi = (httpClient) => ({
    claim: async () => (await httpClient.post('/gifts/claim')).data
});
