import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
    DESCRIBE_ARGS, DESCRIBE_ERROR, HEALTH_TIMEOUT_MS, MISSING_IMAGE, MISSING_URL, USAGE,
    githubOutput, imageCheck, inspect, main, parseTraffic, plan, release, revisionTag, trafficArgs
} from './cloudRunRelease.mjs';

const T = 'a'.repeat(40);
const L = 'b'.repeat(40);
const URL = 'https://infinity-grove-backend-123456789012.southamerica-east1.run.app';
const TAG_URL = 'https://c-aaaaaaa---infinity-grove-backend-123456789012.southamerica-east1.run.app';
const PREVIOUS = 'infinity-grove-backend-00007-abc';
const CANDIDATE = 'infinity-grove-backend-00008-def';
const IMAGE = 'southamerica-east1-docker.pkg.dev/infinity-grove-prod/infinity-grove/backend';

const traffic = (entries) => JSON.stringify({
    apiVersion: 'serving.knative.dev/v1', kind: 'Service', metadata: { name: 'infinity-grove-backend' }, status: { url: URL, traffic: entries }
});
const DESCRIBE = traffic([{ revisionName: PREVIOUS, percent: 100 }, { revisionName: CANDIDATE, tag: 'c-aaaaaaa', url: TAG_URL }]);
const up = (commit) => ({ ok: true, body: { status: 'UP', commit } });

//  The machine as fakes: git, gcloud, node and fetch answer from the options; the calls and the outputs are recorded
const machine = ({
    backendLog = { status: 0, stdout: `${T}\n` },
    health = {},
    describe = { status: 0, stdout: DESCRIBE },
    trafficStatus = [],
    imageStatus = 0,
    regression = 0,
    regressionOut = '',
    backendUrl = URL,
    image = IMAGE
} = {}) =>
{
    const answers = { [URL]: up(L), [TAG_URL]: up(T), ...health };
    const calls = [];
    const fetches = [];
    const outputs = [];
    const lines = [];
    const exec = (command, args, options = {}) =>
    {
        calls.push({ command, args, options });

        if (command === 'git')
        {
            return { stderr: '', ...backendLog };
        }

        if (command === 'gcloud' && args[0] === 'artifacts')
        {
            return { status: imageStatus, stdout: '', stderr: '' };
        }

        if (command === 'gcloud' && args[2] === 'describe')
        {
            return { stderr: '', ...describe };
        }

        if (command === 'gcloud' && args[2] === 'update-traffic')
        {
            return { status: trafficStatus.length ? trafficStatus.shift() : 0, stdout: '', stderr: '' };
        }

        if (command === 'node')
        {
            return { status: regression, stdout: regressionOut, stderr: '' };
        }

        return { status: 1, stdout: '', stderr: `unexpected ${command}` };
    };
    const fetch = async (url, options) =>
    {
        fetches.push({ url, options });
        const answer = answers[url.replace(/\/health$/, '')];

        if (answer === undefined || answer === 'fail')
        {
            throw new Error('fetch failed');
        }

        if (answer === 'html')
        {
            return { ok: true, json: async () => { throw new SyntaxError("Unexpected token '<'"); } };
        }

        return { ok: answer.ok, json: async () => answer.body };
    };
    const deps = { exec, fetch, root: '/repo', log: (line) => lines.push(line), output: (values) => outputs.push(values), backendUrl, image };

    return { deps, calls, fetches, outputs, lines };
};

test('plan deploys the newest backend commit when Cloud Run runs another one', async () =>
{
    const { deps, calls, outputs, lines } = machine();

    assert.equal(await plan(deps), 0);
    assert.deepEqual(outputs, [{ deploy: 'true', target: T, live: L, tag: 'c-aaaaaaa' }]);
    assert.deepEqual(lines, ['Backend aaaaaaa vai para o Cloud Run (no ar: bbbbbbb)']);

    const git = calls.find((call) => call.command === 'git');

    assert.deepEqual(git.args, ['log', '-1', '--format=%H', '--', 'backend']);
    assert.equal(git.options.cwd, '/repo');
});

test('plan skips when Cloud Run already runs the newest backend commit', async () =>
{
    const { deps, outputs, lines } = machine({ health: { [URL]: up(T) } });

    assert.equal(await plan(deps), 0);
    assert.deepEqual(outputs, [{ deploy: 'false', target: T, live: T, tag: 'c-aaaaaaa' }]);
    assert.deepEqual(lines, ['Backend aaaaaaa já está no Cloud Run; nada a fazer']);
});

test('plan deploys when the service does not answer', async () =>
{
    const { deps, outputs, lines } = machine({ health: { [URL]: 'fail' } });

    assert.equal(await plan(deps), 0);
    assert.deepEqual(outputs, [{ deploy: 'true', target: T, live: 'none', tag: 'c-aaaaaaa' }]);
    assert.deepEqual(lines, ['Backend aaaaaaa vai para o Cloud Run (no ar: nenhum)']);
});

test('plan deploys when the service answers 503', async () =>
{
    const { deps, outputs } = machine({ health: { [URL]: { ok: false, body: { status: 'DOWN', commit: L } } } });

    assert.equal(await plan(deps), 0);
    assert.equal(outputs[0].live, 'none');
    assert.equal(outputs[0].deploy, 'true');
});

test('plan treats the sample image of the owner steps as no commit', async () =>
{
    const { deps, outputs } = machine({ health: { [URL]: 'html' } });

    assert.equal(await plan(deps), 0);
    assert.equal(outputs[0].live, 'none');
});

test('plan treats a commit that is not a full hash as unknown', async () =>
{
    const { deps, outputs } = machine({ health: { [URL]: up('unknown') } });

    assert.equal(await plan(deps), 0);
    assert.equal(outputs[0].live, 'none');
});

test('plan asks /health of BACKEND_URL with a timeout', async () =>
{
    const { deps, fetches } = machine();

    await plan(deps);

    assert.equal(fetches[0].url, `${URL}/health`);
    assert.ok(fetches[0].options.signal instanceof AbortSignal);
    assert.equal(HEALTH_TIMEOUT_MS, 90000);
});

test('plan drops a trailing slash of BACKEND_URL', async () =>
{
    const { deps, fetches } = machine({ backendUrl: `${URL}/` });

    await plan(deps);

    assert.equal(fetches[0].url, `${URL}/health`);
});

test('plan fails when git cannot read the backend history', async () =>
{
    const { deps, outputs, fetches, lines } = machine({ backendLog: { status: 128, stdout: '' } });

    assert.equal(await plan(deps), 1);
    assert.deepEqual(lines, ['ERRO: não foi possível ler o último commit de backend/']);
    assert.deepEqual(outputs, []);
    assert.deepEqual(fetches, []);
});

test('plan fails without BACKEND_URL and runs nothing', async () =>
{
    const { deps, calls, fetches, lines } = machine({ backendUrl: '' });

    assert.equal(await plan(deps), 1);
    assert.deepEqual(lines, [MISSING_URL]);
    assert.deepEqual(calls, []);
    assert.deepEqual(fetches, []);
});

test('parseTraffic reads the serving revision and the tags', () =>
{
    assert.deepEqual(parseTraffic(DESCRIBE), {
        serving: PREVIOUS,
        tags: [{ tag: 'c-aaaaaaa', revision: CANDIDATE, url: TAG_URL }]
    });
});

test('parseTraffic finds no serving revision in a split', () =>
{
    assert.deepEqual(
        parseTraffic(traffic([{ revisionName: PREVIOUS, percent: 50 }, { revisionName: CANDIDATE, percent: 50 }])),
        { serving: null, tags: [] }
    );
});

test('parseTraffic refuses text that is not a service', () =>
{
    assert.equal(parseTraffic('not json'), null);
    assert.equal(parseTraffic(JSON.stringify({ status: {} })), null);
});

test('inspect prints the traffic and every tag', () =>
{
    const { deps, calls, lines } = machine();

    assert.equal(inspect(deps), 0);
    assert.deepEqual(lines, ['Tráfego: infinity-grove-backend-00007-abc', `Tag c-aaaaaaa: infinity-grove-backend-00008-def ${TAG_URL}`]);
    assert.equal(calls[0].command, 'gcloud');
    assert.deepEqual(calls[0].args, ['run', 'services', 'describe', 'infinity-grove-backend', '--region', 'southamerica-east1', '--format', 'json']);
    assert.equal(calls[0].options.cwd, '/repo');
});

test('inspect says when no revision holds all the traffic', () =>
{
    const describe = { status: 0, stdout: traffic([{ revisionName: CANDIDATE, percent: 0, tag: 'probe', url: 'https://probe---x.run.app' }]) };
    const { deps, lines } = machine({ describe });

    inspect(deps);

    assert.deepEqual(lines, ['Tráfego: nenhuma revisão com 100%', 'Tag probe: infinity-grove-backend-00008-def https://probe---x.run.app']);
});

test('inspect fails when gcloud cannot read the service', () =>
{
    const { deps, lines } = machine({ describe: { status: 1, stdout: '' } });

    assert.equal(inspect(deps), 1);
    assert.deepEqual(lines, [DESCRIBE_ERROR]);
    assert.equal(DESCRIBE_ERROR, 'ERRO: não foi possível ler o serviço infinity-grove-backend no Cloud Run (gcloud run services describe)');
});

test('the tag and the traffic command follow the commit and the service', () =>
{
    assert.equal(revisionTag(T), 'c-aaaaaaa');
    assert.equal(revisionTag('0123456789abcdef0123456789abcdef01234567'), 'c-0123456');
    assert.deepEqual(trafficArgs('--clear-tags'), ['run', 'services', 'update-traffic', 'infinity-grove-backend', '--region', 'southamerica-east1', '--clear-tags']);
});

test('main prints the usage for an unknown command', async () =>
{
    const { deps, lines } = machine();

    assert.equal(await main([], deps), 1);
    assert.deepEqual(lines, [USAGE]);
    assert.equal(USAGE, 'Uso: node deploy/cloudrun/cloudRunRelease.mjs plan | inspect | image <commit> | release <commit>');
});

test('main refuses a release target that is not a full commit', async () =>
{
    const { deps, calls, lines } = machine();

    assert.equal(await main(['release', 'abc1234'], deps), 1);
    assert.deepEqual(lines, [USAGE]);
    assert.deepEqual(calls, []);
});

test('main runs plan and inspect', async () =>
{
    const { deps } = machine();

    assert.equal(await main(['plan'], deps), 0);

    const fresh = machine();

    assert.equal(await main(['inspect'], fresh.deps), 0);
});

test('githubOutput appends one name=value line per output', () =>
{
    const path = join(mkdtempSync(join(tmpdir(), 'gh-output-')), 'out');

    githubOutput(path)({ deploy: 'true', target: T });

    assert.equal(readFileSync(path, 'utf8'), `deploy=true\ntarget=${T}\n`);
});

test('image finds the prebuilt image of the commit', async () =>
{
    const { deps, calls, outputs, lines } = machine();

    assert.equal(imageCheck(deps, T), 0);
    assert.equal(calls[0].command, 'gcloud');
    assert.deepEqual(calls[0].args, ['artifacts', 'docker', 'images', 'describe', `${IMAGE}:${T}`, '--format', 'value(image_summary.digest)']);
    assert.equal(calls[0].options.cwd, '/repo');
    assert.deepEqual(outputs, [{ prebuilt: 'true' }]);
    assert.deepEqual(lines, ['Imagem aaaaaaa já está no Artifact Registry; testes, build, regressão e push não rodam de novo']);
});

test('image asks for a build when the tag of the commit is missing', () =>
{
    const { deps, outputs, lines } = machine({ imageStatus: 1 });

    assert.equal(imageCheck(deps, T), 0);
    assert.deepEqual(outputs, [{ prebuilt: 'false' }]);
    assert.deepEqual(lines, ['Imagem aaaaaaa não está no Artifact Registry; testes, build, regressão e push rodam agora']);
});

test('image fails without IMAGE and runs nothing', () =>
{
    const { deps, calls, outputs, lines } = machine({ image: '' });

    assert.equal(imageCheck(deps, T), 1);
    assert.deepEqual(lines, [MISSING_IMAGE]);
    assert.equal(MISSING_IMAGE, 'ERRO: falta a variável IMAGE (repositório do Artifact Registry)');
    assert.deepEqual(calls, []);
    assert.deepEqual(outputs, []);
});

test('main runs image only for a full commit', async () =>
{
    const { deps } = machine();

    assert.equal(await main(['image', T], deps), 0);

    const fresh = machine();

    assert.equal(await main(['image', 'abc1234'], fresh.deps), 1);
    assert.deepEqual(fresh.lines, [USAGE]);
    assert.deepEqual(fresh.calls, []);
});

const updates = (calls) => calls.filter((call) => call.command === 'gcloud' && call.args[2] === 'update-traffic');
const REMOVE_TAG = ['run', 'services', 'update-traffic', 'infinity-grove-backend', '--region', 'southamerica-east1', '--remove-tags', 'c-aaaaaaa'];

test('release checks the tagged revision, runs the regression on its URL and switches all the traffic', async () =>
{
    const { deps, calls, lines } = machine({ health: { [URL]: up(T) } });

    assert.equal(await release(deps, T), 0);
    assert.deepEqual(calls.map((call) => call.command), ['gcloud', 'node', 'gcloud']);
    assert.deepEqual(calls[0].args, DESCRIBE_ARGS);
    assert.deepEqual(calls[1].args, ['deploy/regression.mjs', TAG_URL]);
    assert.deepEqual(calls[1].options.env, { REGRESSION_COMMIT: 'aaaaaaa' });
    assert.deepEqual(calls[2].args, ['run', 'services', 'update-traffic', 'infinity-grove-backend', '--region', 'southamerica-east1', '--to-revisions', 'infinity-grove-backend-00008-def=100', '--clear-tags']);
    assert.equal(lines.at(-1), 'Backend aaaaaaa no ar no Cloud Run (infinity-grove-backend-00008-def)');
});

test('release asks the tag URL before the switch and the service URL after it', async () =>
{
    const { deps, fetches } = machine({ health: { [URL]: up(T) } });

    await release(deps, T);

    assert.deepEqual(fetches.map((fetch) => fetch.url), [`${TAG_URL}/health`, `${URL}/health`]);
    assert.ok(fetches[0].options.signal instanceof AbortSignal);
    assert.ok(fetches[1].options.signal instanceof AbortSignal);
});

test('release stops when the service cannot be read', async () =>
{
    const { deps, calls, fetches, lines } = machine({ describe: { status: 1, stdout: '' } });

    assert.equal(await release(deps, T), 1);
    assert.deepEqual(lines, [DESCRIBE_ERROR]);
    assert.equal(calls.length, 1);
    assert.deepEqual(fetches, []);
});

test('release stops when the revision of the commit has no tag', async () =>
{
    const describe = { status: 0, stdout: traffic([{ revisionName: PREVIOUS, percent: 100 }]) };
    const { deps, fetches, lines } = machine({ describe });

    assert.equal(await release(deps, T), 1);
    assert.deepEqual(lines, ['ERRO: a revisão de aaaaaaa (tag c-aaaaaaa) não está no serviço; o tráfego continua em infinity-grove-backend-00007-abc']);
    assert.deepEqual(fetches, []);
});

test('a tagged revision that answers another commit gets no traffic and loses its tag', async () =>
{
    const { deps, calls, lines } = machine({ health: { [TAG_URL]: up(L) } });

    assert.equal(await release(deps, T), 1);
    assert.equal(updates(calls).length, 1);
    assert.deepEqual(updates(calls)[0].args, REMOVE_TAG);
    assert.equal(lines.at(-1), `ERRO: a revisão infinity-grove-backend-00008-def de aaaaaaa não respondeu UP com o commit em ${TAG_URL}/health; o tráfego continua em infinity-grove-backend-00007-abc`);
    assert.ok(calls.every((call) => call.command !== 'node'));
});

test('a tagged revision that does not answer gets no traffic', async () =>
{
    const { deps, calls, lines } = machine({ health: { [TAG_URL]: 'fail' } });

    assert.equal(await release(deps, T), 1);
    assert.equal(lines.at(-1), `ERRO: a revisão infinity-grove-backend-00008-def de aaaaaaa não respondeu UP com o commit em ${TAG_URL}/health; o tráfego continua em infinity-grove-backend-00007-abc`);
    assert.ok(calls.every((call) => call.command !== 'node'));
});

test('a failed regression keeps the traffic and drops the tag', async () =>
{
    const { deps, calls, lines } = machine({ health: { [URL]: up(T) }, regression: 1 });

    assert.equal(await release(deps, T), 1);
    assert.deepEqual(calls.map((call) => call.command), ['gcloud', 'node', 'gcloud']);
    assert.deepEqual(calls[2].args, REMOVE_TAG);
    assert.equal(lines.at(-1), 'ERRO: a regressão falhou em aaaaaaa; o tráfego continua em infinity-grove-backend-00007-abc');
    assert.ok(calls.every((call) => !call.args.includes('--to-revisions')));
});

test('the regression output reaches the log', async () =>
{
    const { deps, lines } = machine({ health: { [URL]: up(T) }, regressionOut: 'Regressão OK: 12 verificações em 3.0 s\n' });

    assert.equal(await release(deps, T), 0);
    assert.deepEqual(lines, ['Regressão OK: 12 verificações em 3.0 s', 'Backend aaaaaaa no ar no Cloud Run (infinity-grove-backend-00008-def)']);
});

test('a failed switch says where the traffic stays', async () =>
{
    const { deps, fetches, lines } = machine({ health: { [URL]: up(T) }, trafficStatus: [1] });

    assert.equal(await release(deps, T), 1);
    assert.equal(lines.at(-1), 'ERRO: não foi possível mandar o tráfego para infinity-grove-backend-00008-def; o tráfego continua em infinity-grove-backend-00007-abc');
    assert.equal(fetches.length, 1);
});

test('a service that does not answer the new commit after the switch goes back to the previous revision', async () =>
{
    const { deps, calls, lines } = machine();

    assert.equal(await release(deps, T), 1);
    assert.deepEqual(updates(calls).at(-1).args, ['run', 'services', 'update-traffic', 'infinity-grove-backend', '--region', 'southamerica-east1', '--to-revisions', 'infinity-grove-backend-00007-abc=100']);
    assert.equal(lines.at(-1), 'ERRO: o serviço não respondeu aaaaaaa no /health depois da troca; o tráfego voltou para infinity-grove-backend-00007-abc');
});

test('a failed way back names the command to run by hand', async () =>
{
    const { deps, lines } = machine({ trafficStatus: [0, 1] });

    assert.equal(await release(deps, T), 1);
    assert.equal(lines.at(-1), 'ERRO: o serviço não respondeu aaaaaaa no /health depois da troca e a volta para infinity-grove-backend-00007-abc falhou; rode gcloud run services update-traffic infinity-grove-backend --region southamerica-east1 --to-revisions infinity-grove-backend-00007-abc=100');
});

test('with no previous revision a failed check only explains', async () =>
{
    const describe = { status: 0, stdout: traffic([{ revisionName: CANDIDATE, tag: 'c-aaaaaaa', url: TAG_URL }]) };
    const { deps, calls, lines } = machine({ describe });

    assert.equal(await release(deps, T), 1);
    assert.equal(updates(calls).length, 1);
    assert.equal(lines.at(-1), 'ERRO: o serviço não respondeu aaaaaaa no /health depois da troca e não há revisão anterior; veja gcloud run revisions list --service infinity-grove-backend --region southamerica-east1');
});

test('release fails without BACKEND_URL and runs nothing', async () =>
{
    const { deps, calls, fetches, lines } = machine({ backendUrl: '' });

    assert.equal(await release(deps, T), 1);
    assert.deepEqual(lines, [MISSING_URL]);
    assert.deepEqual(calls, []);
    assert.deepEqual(fetches, []);
});

test('main runs release', async () =>
{
    const { deps } = machine({ health: { [URL]: up(T) } });

    assert.equal(await main(['release', T], deps), 0);
});
