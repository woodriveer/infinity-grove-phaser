import { describe, expect, it } from 'vitest';
import { ApiError } from './ApiError';

describe('ApiError.from', () => {
    it('maps a backend ProblemDetail response', () => {
        const error = ApiError.from({
            response: { status: 409, data: { detail: "User 'yan' already exists", code: 'USER_ALREADY_EXISTS' } }
        });

        expect(error).toBeInstanceOf(ApiError);
        expect(error.message).toBe('Esse nome de usuário já existe.');
        expect(error.status).toBe(409);
        expect(error.code).toBe('USER_ALREADY_EXISTS');
    });

    it('answers O pedido falhou (erro <status>) for an answer without a known code, whatever its detail or title', () => {
        expect(ApiError.from({ response: { status: 500, data: { title: 'Internal Server Error', detail: 'Boom' } } }).message)
            .toBe('O pedido falhou (erro 500).');
        expect(ApiError.from({ response: { status: 502, data: null } }).message)
            .toBe('O pedido falhou (erro 502).');
    });

    it('keeps the response body, which a 409 uses to carry the stored progress', () => {
        const data = { detail: 'Reported position does not match', code: 'PROGRESS_CONFLICT', progress: { stage: 2 } };

        expect(ApiError.from({ response: { status: 409, data } }).body).toEqual(data);
        expect(ApiError.from({ request: {}, message: 'Network Error' }).body).toBeNull();
    });

    it('has no code when the backend sends none', () => {
        expect(ApiError.from({ response: { status: 400, data: { detail: 'Bad request' } } }).code).toBeNull();
    });

    it('reports an unreachable server when there is no response', () => {
        const error = ApiError.from({ request: {}, message: 'Network Error' });

        expect(error.status).toBe(0);
        expect(error.message).toBe('Não foi possível falar com o servidor. Tente de novo mais tarde.');
    });

    it('reports O pedido falhou. for a request that could not be built', () => {
        expect(ApiError.from(new Error('boom')).message).toBe('O pedido falhou.');
    });
});
