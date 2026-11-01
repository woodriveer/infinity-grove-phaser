import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderConf, switchScript, switchTo } from './proxy.mjs';

//  A fake docker that records each command with its stdin and exits with the given status
const fakeExec = (status = 0) =>
{
    const calls = [];
    const exec = (command, args, options) =>
    {
        calls.push({ line: [command, ...args.slice(0, 5)].join(' '), script: args[5], input: options?.input });

        return { status, stdout: '', stderr: '' };
    };

    return { exec, calls };
};

const servers = (conf) => [...conf.matchAll(/url:\s+(\S+)/g)].map((match) => match[1]);

test('the conf names only the given slot behind one catch-all router on the web entry point', () =>
{
    assert.deepEqual(servers(renderConf('green')), ['http://backend-green:8080']);
    assert.deepEqual(servers(renderConf('blue')), ['http://backend-blue:8080']);
    assert.match(renderConf('blue'), /entryPoints: \[ web \]/);
    assert.match(renderConf('blue'), /rule: PathPrefix\(`\/`\)/);
});

test('switchTo pipes the conf of the slot into the proxy container and reports the success', () =>
{
    const { exec, calls } = fakeExec();

    assert.equal(switchTo(exec, 'green'), true);
    assert.deepEqual(calls, [{
        line: 'docker exec -i infinity-grove-proxy sh -c',
        script: switchScript('green'),
        input: renderConf('green')
    }]);
});

test('switchTo reports a failure when the script exits non-zero', () =>
{
    assert.equal(switchTo(fakeExec(1).exec, 'green'), false);
});

test('the script keeps a backup, waits for the API to serve the slot and otherwise puts the backup back', () =>
{
    const lines = switchScript('green').split('\n');

    assert.match(lines[0], /cp \/etc\/traefik\/dynamic\/backend\.yml \/etc\/traefik\/dynamic\/backend\.yml\.bak/);
    assert.match(lines[1], /cat > \S+\.tmp && mv \S+\.tmp \/etc\/traefik\/dynamic\/backend\.yml$/);
    assert.match(lines[2], /wget -qO- http:\/\/127\.0\.0\.1:8080\/api\/http\/services\/backend@file .*grep -q 'backend-green:8080' && exit 0/);
    assert.match(lines[3], /mv \S+\.bak \/etc\/traefik\/dynamic\/backend\.yml; else rm -f/);
    assert.equal(lines[4], 'exit 1');
});
