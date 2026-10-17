//  Cloudflare Worker in front of the built game (static assets, see wrangler.jsonc).
//  Only /api/* reaches this code; it forwards the request to the backend so the browser stays same-origin (no CORS).
//  BACKEND_URL is the backend base that /api maps to, e.g. https://<tunnel>.trycloudflare.com/api
export default {
    async fetch (request, env) {
        if (!env.BACKEND_URL)
        {
            return new Response('BACKEND_URL is not configured', { status: 503 });
        }

        const url = new URL(request.url);
        const target = env.BACKEND_URL.replace(/\/$/, '') + url.pathname.replace(/^\/api/, '') + url.search;

        try
        {
            return await fetch(new Request(target, request));
        }
        catch
        {
            return new Response('The backend is not reachable', { status: 502 });
        }
    }
};
