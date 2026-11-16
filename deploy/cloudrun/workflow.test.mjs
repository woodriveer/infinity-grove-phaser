import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const yaml = readFileSync(join(ROOT, '.github', 'workflows', 'deploy.yml'), 'utf8').replace(/\r\n/g, '\n');
const count = (text) => yaml.split(text).length - 1;
const backend = yaml.slice(yaml.indexOf('\n  backend:'), yaml.indexOf('\n  game:'));
const game = yaml.slice(yaml.indexOf('\n  game:'));

const git = (args) => spawnSync('git', args, { cwd: ROOT, encoding: 'utf8' });

test('runs on every push to main and by hand', () =>
{
    assert.ok(yaml.includes('    branches: [ main ]'));
    assert.ok(yaml.includes('  workflow_dispatch:'));
});

test('the trigger paths cover the backend, every game path the watcher shipped, the release script and itself', () =>
{
    const paths = [
        'backend/**', 'game/src/**', 'game/public/**', 'game/worker/**', 'game/index.html', 'game/vite.config.js', 'game/package.json',
        'game/wrangler.jsonc', 'game/scripts/deploy.mjs', 'game/.env.pages', 'deploy/cloudrun/**', 'deploy/regression.mjs', '.github/workflows/deploy.yml'
    ];

    for (const path of paths)
    {
        assert.ok(yaml.includes(`      - '${path}'`), path);
    }
});

test('one production run at a time, never cancelled halfway', () =>
{
    assert.ok(yaml.includes('  group: production'));
    assert.ok(yaml.includes('  cancel-in-progress: false'));
});

test('both jobs wait for the cutover variable, except a build-only or rehearsal backend run', () =>
{
    assert.equal(count("vars.CLOUD_RUN_PRODUCTION == 'true'"), 2);
    assert.ok(yaml.includes("    if: vars.CLOUD_RUN_PRODUCTION == 'true' || inputs.mode == 'build-only' || inputs.mode == 'rehearsal'"));
});

test('a run by hand chooses deploy, build-only or rehearsal, and a push deploys', () =>
{
    assert.ok(yaml.includes('      mode:'));
    assert.ok(yaml.includes('        type: choice'));
    assert.ok(yaml.includes('        options: [ deploy, build-only, rehearsal ]'));
    assert.ok(yaml.includes('        default: deploy'));
    assert.ok(backend.includes("      MODE: ${{ inputs.mode || 'deploy' }}"));
    assert.ok(!yaml.includes('inputs.rehearsal'));
});

test('the steps are gated by plan, by the image lookup and by the mode', () =>
{
    assert.equal(count("if: steps.plan.outputs.deploy == 'true'"), 6);
    assert.equal(count("if: steps.image.outputs.prebuilt == 'false'"), 5);
    assert.equal(count("steps.plan.outputs.deploy == 'true' && env.MODE == 'deploy'"), 2);
    assert.equal(count("steps.plan.outputs.deploy == 'true' && env.MODE == 'rehearsal'"), 1);
});

test('the gate runs in order: sign-in, image lookup, tests, candidate regression, push, revision, release', () =>
{
    const steps = [
        'google-github-actions/auth@v3',
        'node deploy/cloudrun/cloudRunRelease.mjs image',
        './gradlew ktlintCheck test',
        'node deploy/regression.mjs http://127.0.0.1:8080',
        'docker push',
        'google-github-actions/deploy-cloudrun@v3',
        'node deploy/cloudrun/cloudRunRelease.mjs release'
    ].map((text) => yaml.indexOf(text));

    for (const index of steps)
    {
        assert.notEqual(index, -1);
    }

    for (let i = 1; i < steps.length; i++)
    {
        assert.ok(steps[i] > steps[i - 1], `step ${i} runs before step ${i - 1}`);
    }
});

test('the candidate runs on the runner\'s throwaway Postgres', () =>
{
    assert.ok(yaml.includes('postgres:16'));
    assert.ok(yaml.includes('-e SPRING_DATASOURCE_URL=jdbc:postgresql://ci-postgres:5432/infinity_grove'));
});

test('the backend job signs in with Workload Identity Federation and no key', () =>
{
    assert.ok(backend.includes('      id-token: write'));
    assert.ok(backend.includes('google-github-actions/auth@v3'));
    assert.ok(backend.includes('workload_identity_provider: ${{ vars.GCP_WIF_PROVIDER }}'));
    assert.ok(backend.includes('service_account: ${{ vars.GCP_DEPLOY_SA }}'));
    assert.ok(!yaml.includes('credentials_json'));
    assert.ok(!yaml.includes('private_key'));
    assert.ok(!yaml.includes('GOOGLE_CREDENTIALS'));
    assert.ok(!game.includes('id-token'));
});

test('the revision is created with no traffic and the commit tag', () =>
{
    assert.ok(yaml.includes('          service: infinity-grove-backend'));
    assert.ok(yaml.includes('          region: southamerica-east1'));
    assert.ok(yaml.includes('          image: ${{ env.IMAGE }}:${{ steps.plan.outputs.target }}'));
    assert.ok(yaml.includes('          tag: ${{ steps.plan.outputs.tag }}'));
    assert.ok(yaml.includes('          no_traffic: true'));
    assert.ok(yaml.includes('  IMAGE: southamerica-east1-docker.pkg.dev/${{ vars.GCP_PROJECT_ID }}/infinity-grove/backend'));
});

test('the service size, scale and probes are pinned', () =>
{
    const flags = [
        '--port=8080', '--cpu=1 ', '--memory=1Gi', '--cpu-boost', '--concurrency=80', '--timeout=120', '--min-instances=0',
        '--max-instances=1', '--max=1', '--service-account=${{ vars.GCP_RUNTIME_SA }}',
        '--startup-probe=httpGet.path=/health,initialDelaySeconds=5,periodSeconds=5,timeoutSeconds=4,failureThreshold=36',
        '--liveness-probe=httpGet.path=/health,periodSeconds=60,timeoutSeconds=5,failureThreshold=3'
    ];

    for (const flag of flags)
    {
        assert.ok(yaml.includes(flag), flag);
    }
});

test('the environment and the secrets come from the workflow and Secret Manager only', () =>
{
    const lines = [
        '            APP_COMMIT=${{ steps.plan.outputs.target }}',
        '            JAVA_TOOL_OPTIONS=-XX:MaxRAMPercentage=60',
        '          env_vars_update_strategy: overwrite',
        '            JWT_SECRET=jwt-secret:latest',
        '            SPRING_DATASOURCE_URL=spring-datasource-url:latest',
        '            SPRING_DATASOURCE_USERNAME=spring-datasource-username:latest',
        '            SPRING_DATASOURCE_PASSWORD=spring-datasource-password:latest',
        '          secrets_update_strategy: overwrite'
    ];

    for (const line of lines)
    {
        assert.ok(yaml.includes(line), line);
    }

    assert.equal(count('SPRING_DATASOURCE_PASSWORD'), 1);
});

test('the image is looked up, built, pushed and deployed under the commit plan chose, never latest', () =>
{
    assert.ok(yaml.includes('      - id: image'));
    assert.ok(yaml.includes('        run: node deploy/cloudrun/cloudRunRelease.mjs image ${{ steps.plan.outputs.target }}'));
    assert.equal(count('"$IMAGE:${{ steps.plan.outputs.target }}"'), 3);
    assert.ok(yaml.includes('          image: ${{ env.IMAGE }}:${{ steps.plan.outputs.target }}'));
    assert.ok(!yaml.includes('backend:latest'));
    assert.ok(!yaml.includes('$IMAGE:latest'));
});

test('the Worker waits for a green backend job of a deploy run and proxies to the service URL', () =>
{
    assert.ok(game.includes('    needs: backend'));
    assert.ok(game.includes("needs.backend.result == 'success'"));
    assert.ok(game.includes("(inputs.mode || 'deploy') == 'deploy'"));
    assert.ok(game.includes('          BACKEND_URL: ${{ vars.BACKEND_URL }}'));
});

test('the only GitHub secrets are the Cloudflare ones and no address is hard-coded', () =>
{
    assert.deepEqual(
        [...new Set(yaml.match(/secrets\.[A-Z_]+/g))].sort(),
        ['secrets.CLOUDFLARE_ACCOUNT_ID', 'secrets.CLOUDFLARE_API_TOKEN']
    );
    assert.equal(yaml.toLowerCase().includes('supabase'), false);
    assert.ok(!yaml.includes('run.app'));
    assert.ok(!yaml.includes('jdbc:postgresql://aws'));
});

test('the plan step reads the whole history and the service URL', () =>
{
    assert.ok(yaml.includes('          fetch-depth: 0'));
    assert.ok(yaml.includes('      - id: plan'));
    assert.ok(yaml.includes('        run: node deploy/cloudrun/cloudRunRelease.mjs plan'));
    assert.ok(backend.includes('      BACKEND_URL: ${{ vars.BACKEND_URL }}'));
});

test('build-only and rehearsal never reach the revision step', () =>
{
    assert.ok(yaml.includes('        run: node deploy/cloudrun/cloudRunRelease.mjs inspect'));
    assert.ok(yaml.includes("        if: steps.plan.outputs.deploy == 'true' && env.MODE == 'deploy'\n        uses: google-github-actions/deploy-cloudrun@v3"));
    assert.ok(yaml.indexOf('cloudRunRelease.mjs inspect') < yaml.indexOf('deploy-cloudrun@v3'));
});

test('the actions run on their current major versions', () =>
{
    assert.ok(yaml.includes('actions/checkout@v7'));
    assert.ok(yaml.includes('actions/setup-node@v7'));
    assert.ok(yaml.includes('actions/setup-java@v6'));
    assert.ok(yaml.includes('google-github-actions/setup-gcloud@v3'));
});

test('the image cleanup deletes after 30 days and keeps the 3 newest', () =>
{
    assert.deepEqual(JSON.parse(readFileSync(join(ROOT, 'deploy', 'cloudrun', 'artifact-cleanup.json'), 'utf8')), [
        { name: 'delete-older-than-30-days', action: { type: 'Delete' }, condition: { tagState: 'any', olderThan: '30d' } },
        { name: 'keep-3-most-recent', action: { type: 'Keep' }, mostRecentVersions: { keepCount: 3 } }
    ]);
});

test('the credential file of the auth action is ignored by git', () =>
{
    assert.equal(git(['check-ignore', '-q', 'gha-creds-0123abcd.json']).status, 0);
});
