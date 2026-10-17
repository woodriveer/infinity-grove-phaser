//  Normalized error thrown by the api layer. Scenes never see axios errors.
//  `code` is the backend business code (ProblemDetail "code"), `status` the HTTP status (0 = no response)
//  and `body` the response body, e.g. the stored progress a 409 carries.
export class ApiError extends Error
{
    constructor (message, { status = 0, code = null, body = null } = {})
    {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.code = code;
        this.body = body;
    }

    static from (error)
    {
        if (error.response)
        {
            const { status, data } = error.response;
            return new ApiError(data?.detail ?? data?.title ?? `Request failed (${status})`, { status, code: data?.code ?? null, body: data ?? null });
        }

        if (error.request)
        {
            return new ApiError('Cannot reach the server. Try again later.');
        }

        return new ApiError(error.message);
    }
}
