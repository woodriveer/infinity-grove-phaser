import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { renderConf, switchTo, writeConf } from './proxy.mjs';

let dir;

beforeEach(() =>
{
    dir = mkdtempSync(join(tmpdir(), 'deploy-proxy-'));
});

//  A fake docker that records the nginx commands and fails the ones listed
const fakeExec = (failing = []) =>
{
    const calls = [];
    const exec = (command, args) =>
    {
        calls.push([command, ...args].join(' '));
        const failed = failing.some((part) => args.join(' ').endsWith(part));

        return { status: failed ? 1 : 0, stdout: '', stderr: failed ? 'nginx: [emerg]' : '' };
    };

    return { exec, calls };
};

const servers = (conf) => [...conf.matchAll(/server\s+([^\s;]+);/g)].map((match) => match[1]);

test('the conf names only the given slot', () =>
{
    assert.deepEqual(servers(renderConf('green')), ['backend-green:8080']);
    assert.deepEqual(servers(renderConf('blue')), ['backend-blue:8080']);
    assert.match(renderConf('green'), /proxy_pass http:\/\/backend;/);
});

//  A reload closes the idle keep-alive connections of the old workers, and a request sent on one at that moment is reset
//  (seen live: one UND_ERR_SOCKET right at a switch); with no client keep-alive no connection is idle at a reload
test('the conf turns off client keep-alive, so a reload resets no request', () =>
{
    assert.match(renderConf('green'), /^\s*keepalive_timeout 0;$/m);
});

test('writeConf writes default.conf in the dir', () =>
{
    writeConf(dir, 'blue');

    assert.equal(readFileSync(join(dir, 'default.conf'), 'utf8'), renderConf('blue'));
});

test('switchTo writes the conf, checks it, then reloads', () =>
{
    writeConf(dir, 'blue');
    const { exec, calls } = fakeExec();

    assert.equal(switchTo(exec, dir, 'green'), true);
    assert.deepEqual(calls, [
        'docker exec infinity-grove-proxy nginx -t',
        'docker exec infinity-grove-proxy nginx -s reload'
    ]);
    assert.equal(readFileSync(join(dir, 'default.conf'), 'utf8'), renderConf('green'));
});

test('a failed nginx -t writes the old conf back and does not reload', () =>
{
    writeConf(dir, 'blue');
    const { exec, calls } = fakeExec(['nginx -t']);

    assert.equal(switchTo(exec, dir, 'green'), false);
    assert.deepEqual(calls, ['docker exec infinity-grove-proxy nginx -t']);
    assert.equal(readFileSync(join(dir, 'default.conf'), 'utf8'), renderConf('blue'));
});

test('a failed reload writes the old conf back', () =>
{
    writeConf(dir, 'blue');
    const { exec } = fakeExec(['-s reload']);

    assert.equal(switchTo(exec, dir, 'green'), false);
    assert.equal(readFileSync(join(dir, 'default.conf'), 'utf8'), renderConf('blue'));
});

test('a failed check with no conf before leaves no conf', () =>
{
    const { exec } = fakeExec(['nginx -t']);

    assert.equal(switchTo(exec, dir, 'green'), false);
    assert.equal(existsSync(join(dir, 'default.conf')), false);
});
