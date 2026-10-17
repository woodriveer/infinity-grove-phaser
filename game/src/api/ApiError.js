//  Normalized error thrown by the api layer. Scenes never see axios errors.
//  `code` is the backend business code (ProblemDetail "code"), `status` the HTTP status (0 = no response).
export class ApiError extends Error
{
    constructor (message, { status = 0, code = null } = {})
    {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.code = code;
    }

    static from (error)
    {
        if (error.response)
        {
            const { status, data } = error.response;
            return new ApiError(data?.detail ?? data?.title ?? `Request failed (${status})`, { status, code: data?.code ?? null });
        }

        if (error.request)
        {
            return new ApiError('Cannot reach the server. Try again later.');
        }

        return new ApiError(error.message);
    }
}
