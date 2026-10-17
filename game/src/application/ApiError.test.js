import { describe, expect, it } from 'vitest';
import { ApiError } from './ApiError';

describe('ApiError.from', () => {
    it('maps a backend ProblemDetail response', () => {
        const error = ApiError.from({
            response: { status: 409, data: { detail: "User 'yan' already exists", code: 'USER_ALREADY_EXISTS' } }
        });

        expect(error).toBeInstanceOf(ApiError);
        expect(error.message).toBe("User 'yan' already exists");
        expect(error.status).toBe(409);
        expect(error.code).toBe('USER_ALREADY_EXISTS');
    });

    it('falls back to the title, then to a generic message, when detail is missing', () => {
        expect(ApiError.from({ response: { status: 500, data: { title: 'Internal Server Error' } } }).message)
            .toBe('Internal Server Error');
        expect(ApiError.from({ response: { status: 502, data: null } }).message)
            .toBe('Request failed (502)');
    });

    it('has no code when the backend sends none', () => {
        expect(ApiError.from({ response: { status: 400, data: { detail: 'Bad request' } } }).code).toBeNull();
    });

    it('reports an unreachable server when there is no response', () => {
        const error = ApiError.from({ request: {}, message: 'Network Error' });

        expect(error.status).toBe(0);
        expect(error.message).toBe('Cannot reach the server. Try again later.');
    });

    it('keeps the original message for request setup failures', () => {
        expect(ApiError.from(new Error('boom')).message).toBe('boom');
    });
});
