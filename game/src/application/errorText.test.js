import { describe, expect, it } from 'vitest';
import { errorText, OFFLINE_TEXT, SETUP_FAILED_TEXT } from './errorText';

describe('errorText', () => {
    it('USER_ALREADY_EXISTS reads Esse nome de usuário já existe.', () => {
        expect(errorText({ status: 409, code: 'USER_ALREADY_EXISTS' })).toBe('Esse nome de usuário já existe.');
    });

    it('LOGIN_USER_NOT_FOUND reads Usuário não encontrado.', () => {
        expect(errorText({ status: 404, code: 'LOGIN_USER_NOT_FOUND' })).toBe('Usuário não encontrado.');
    });

    it('LOGIN_INVALID_PASSWORD reads Senha incorreta.', () => {
        expect(errorText({ status: 401, code: 'LOGIN_INVALID_PASSWORD' })).toBe('Senha incorreta.');
    });

    it('USER_PASSWORD_TOO_SHORT with minLength 8 reads A senha precisa ter pelo menos 8 caracteres.', () => {
        expect(errorText({ status: 400, code: 'USER_PASSWORD_TOO_SHORT', body: { minLength: 8 } }))
            .toBe('A senha precisa ter pelo menos 8 caracteres.');
    });

    it('USER_PASSWORD_TOO_SHORT without minLength reads A senha é muito curta.', () => {
        expect(errorText({ status: 400, code: 'USER_PASSWORD_TOO_SHORT', body: {} })).toBe('A senha é muito curta.');
        expect(errorText({ status: 400, code: 'USER_PASSWORD_TOO_SHORT', body: { minLength: '8' } })).toBe('A senha é muito curta.');
        expect(errorText({ status: 400, code: 'USER_PASSWORD_TOO_SHORT' })).toBe('A senha é muito curta.');
    });

    it('AUTH_INVALID_REFRESH_TOKEN and AUTH_UNAUTHENTICATED read Sua sessão expirou. Entre de novo.', () => {
        expect(errorText({ status: 401, code: 'AUTH_INVALID_REFRESH_TOKEN' })).toBe('Sua sessão expirou. Entre de novo.');
        expect(errorText({ status: 401, code: 'AUTH_UNAUTHENTICATED' })).toBe('Sua sessão expirou. Entre de novo.');
    });

    it('an unknown code reads O pedido falhou (erro 409).', () => {
        expect(errorText({ status: 409, code: 'PROGRESS_CONFLICT' })).toBe('O pedido falhou (erro 409).');
    });

    it('no code reads O pedido falhou (erro 500).', () => {
        expect(errorText({ status: 500 })).toBe('O pedido falhou (erro 500).');
    });

    it('OFFLINE_TEXT and SETUP_FAILED_TEXT are the spec texts', () => {
        expect(OFFLINE_TEXT).toBe('Não foi possível falar com o servidor. Tente de novo mais tarde.');
        expect(SETUP_FAILED_TEXT).toBe('O pedido falhou.');
    });
});
