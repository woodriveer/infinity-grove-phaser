//  Wraps the backend UserController (/users). signUp and login answer with an AuthResponse:
//  { user: { username, createdAt, lastLoginAt }, accessToken, refreshToken, accessTokenExpiresAt, refreshTokenExpiresAt }.
//  They are credentials calls, so `skipAuth` keeps them out of the Bearer/refresh interceptors.
export const createUserApi = (httpClient) => ({
    signUp: async (username, password) =>
        (await httpClient.post('/users', { username, password }, { skipAuth: true })).data,

    login: async (username, password) =>
        (await httpClient.post('/users/login', { username, password }, { skipAuth: true })).data
});
