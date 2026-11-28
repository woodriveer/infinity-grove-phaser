//  The Portuguese line the player reads for a failed request (spec portuguese-text, AD-032): chosen by the backend `code`, never the
//  backend's English `detail`. Pure JavaScript.
export const OFFLINE_TEXT = 'Não foi possível falar com o servidor. Tente de novo mais tarde.';
export const SETUP_FAILED_TEXT = 'O pedido falhou.';
export const SHORT_PASSWORD_TEXT = 'A senha é muito curta.';

const SESSION_EXPIRED_TEXT = 'Sua sessão expirou. Entre de novo.';
const CODE_TEXTS = Object.freeze({
    USER_ALREADY_EXISTS: 'Esse nome de usuário já existe.',
    LOGIN_USER_NOT_FOUND: 'Usuário não encontrado.',
    LOGIN_INVALID_PASSWORD: 'Senha incorreta.',
    AUTH_INVALID_REFRESH_TOKEN: SESSION_EXPIRED_TEXT,
    AUTH_UNAUTHENTICATED: SESSION_EXPIRED_TEXT
});

//  `status` the HTTP status of the answer, `code` its ProblemDetail code (or null), `body` the answer (or null)
export const errorText = ({ status, code = null, body = null }) =>
{
    if (code === 'USER_PASSWORD_TOO_SHORT')
    {
        return Number.isInteger(body?.minLength) ? `A senha precisa ter pelo menos ${body.minLength} caracteres.` : SHORT_PASSWORD_TEXT;
    }

    return CODE_TEXTS[code] ?? `O pedido falhou (erro ${status}).`;
};
