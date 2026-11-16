//  The Cloud Run release of the backend, run by .github/workflows/deploy.yml (spec supabase-postgres, RUN-03, RUN-04)
//  Usage: node deploy/cloudrun/cloudRunRelease.mjs plan | inspect | release <commit>   (BACKEND_URL: the service URL)
import { appendFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { run } from '../lib/run.mjs';

export const SERVICE = 'infinity-grove-backend';
export const REGION = 'southamerica-east1';
export const HEALTH_TIMEOUT_MS = 90000;
export const USAGE = 'Uso: node deploy/cloudrun/cloudRunRelease.mjs plan | inspect | image <commit> | release <commit>';
export const MISSING_URL = 'ERRO: falta a variável BACKEND_URL (URL do serviço do Cloud Run)';
export const MISSING_IMAGE = 'ERRO: falta a variável IMAGE (repositório do Artifact Registry)';
export const DESCRIBE_ERROR = `ERRO: não foi possível ler o serviço ${SERVICE} no Cloud Run (gcloud run services describe)`;
export const DESCRIBE_ARGS = ['run', 'services', 'describe', SERVICE, '--region', REGION, '--format', 'json'];

//  The Windows gcloud is a .cmd, which spawnSync only finds through a shell (the reason run.mjs has the option)
export const GCLOUD_SHELL = process.platform === 'win32';

export const isCommit = (value) => /^[0-9a-f]{40}$/.test(String(value));
export const short = (commit) => commit.slice(0, 7);

//  A Cloud Run traffic tag is a lower-case DNS label that starts with a letter; a commit may start with a digit
export const revisionTag = (commit) => `c-${short(commit)}`;

//  gcloud run services update-traffic of this service, followed by the given flags
export const trafficArgs = (...flags) => ['run', 'services', 'update-traffic', SERVICE, '--region', REGION, ...flags];

//  gcloud artifacts docker images describe of the image of one commit; only its exit status is read
export const imageArgs = (image, commit) => ['artifacts', 'docker', 'images', 'describe', `${image}:${commit}`, '--format', 'value(image_summary.digest)'];

//  The commit a backend answers on <baseUrl>/health, or null when it does not answer 2xx JSON naming a full commit
export const healthCommit = async (fetch, baseUrl) =>
{
    try
    {
        const response = await fetch(`${baseUrl.replace(/\/$/, '')}/health`, { signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS) });

        if (!response.ok)
        {
            return null;
        }

        const { commit } = await response.json();

        return isCommit(commit) ? commit : null;
    }
    catch
    {
        return null;
    }
};

//  Step outputs of GitHub Actions: one name=value line per output, appended to the file GITHUB_OUTPUT names
export const githubOutput = (path) => (values) =>
    appendFileSync(path, Object.entries(values).map(([name, value]) => `${name}=${value}\n`).join(''));

export const printLines = (log, result) =>
    `${result.stdout ?? ''}\n${result.stderr ?? ''}`.split(/\r?\n/).filter((line) => line.trim()).forEach((line) => log(line));

//  status.traffic of gcloud run services describe --format json (Knative serving v1): the revision holding 100 % and the tagged ones
export const parseTraffic = (text) =>
{
    let traffic;

    try
    {
        traffic = JSON.parse(text)?.status?.traffic;
    }
    catch
    {
        return null;
    }

    if (!Array.isArray(traffic))
    {
        return null;
    }

    const serving = traffic.find((target) => target.percent === 100 && target.revisionName);

    return {
        serving: serving ? serving.revisionName : null,
        tags: traffic.filter((target) => target.tag).map((target) => ({ tag: target.tag, revision: target.revisionName, url: target.url }))
    };
};

export const describeService = (exec, root) =>
{
    const result = exec('gcloud', DESCRIBE_ARGS, { cwd: root, shell: GCLOUD_SHELL });
    const traffic = result.status === 0 ? parseTraffic(String(result.stdout)) : null;

    return traffic ? { ok: true, ...traffic } : { ok: false };
};

//  Deploy only when the newest commit that touched backend/ is not the one the service answers; a dropped pending run loses nothing
export const plan = async ({ exec, fetch, root, log, output, backendUrl }) =>
{
    if (!backendUrl)
    {
        log(MISSING_URL);

        return 1;
    }

    const newest = exec('git', ['log', '-1', '--format=%H', '--', 'backend'], { cwd: root });
    const target = String(newest.stdout).trim();

    if (newest.status !== 0 || !isCommit(target))
    {
        log('ERRO: não foi possível ler o último commit de backend/');

        return 1;
    }

    const live = await healthCommit(fetch, backendUrl);
    const deploy = live !== target;

    output({ deploy: String(deploy), target, live: live ?? 'none', tag: revisionTag(target) });
    log(deploy
        ? `Backend ${short(target)} vai para o Cloud Run (no ar: ${live ? short(live) : 'nenhum'})`
        : `Backend ${short(target)} já está no Cloud Run; nada a fazer`);

    return 0;
};

//  Read only: which revision holds the traffic and which tags exist (the rehearsal proves the sign-in and this reader)
export const inspect = ({ exec, root, log }) =>
{
    const service = describeService(exec, root);

    if (!service.ok)
    {
        log(DESCRIBE_ERROR);

        return 1;
    }

    log(`Tráfego: ${service.serving ?? 'nenhuma revisão com 100%'}`);
    service.tags.forEach(({ tag, revision, url }) => log(`Tag ${tag}: ${revision} ${url}`));

    return 0;
};

//  An image reaches the registry under its commit only after the tests and the runner regression of that commit passed,
//  and only the workflow pushes, so a tag that exists needs no new build. Any gcloud failure counts as missing: it only costs a rebuild.
export const imageCheck = ({ exec, root, log, output, image }, target) =>
{
    if (!image)
    {
        log(MISSING_IMAGE);

        return 1;
    }

    const found = exec('gcloud', imageArgs(image, target), { cwd: root, shell: GCLOUD_SHELL }).status === 0;

    output({ prebuilt: String(found) });
    log(found
        ? `Imagem ${short(target)} já está no Artifact Registry; testes, build, regressão e push não rodam de novo`
        : `Imagem ${short(target)} não está no Artifact Registry; testes, build, regressão e push rodam agora`);

    return 0;
};

export const main = async (args, deps) =>
{
    if (args.length === 1 && args[0] === 'plan')
    {
        return plan(deps);
    }

    if (args.length === 1 && args[0] === 'inspect')
    {
        return inspect(deps);
    }

    if (args.length === 2 && args[0] === 'image' && isCommit(args[1]))
    {
        return imageCheck(deps, args[1]);
    }

    deps.log(USAGE);

    return 1;
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
{
    const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
    const output = process.env.GITHUB_OUTPUT
        ? githubOutput(process.env.GITHUB_OUTPUT)
        : (values) => console.log(Object.entries(values).map(([name, value]) => `${name}=${value}`).join('\n'));

    process.exit(await main(process.argv.slice(2), {
        exec: run, fetch: globalThis.fetch, root, log: console.log, output, backendUrl: process.env.BACKEND_URL, image: process.env.IMAGE
    }));
}
