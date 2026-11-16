import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseDotenv, readDotenv } from './dotenv.mjs';

test('parses NAME=value lines', () =>
{
    assert.deepEqual(parseDotenv('A=1\nB=two'), { A: '1', B: 'two' });
});

test('skips blank lines and lines that start with #', () =>
{
    assert.deepEqual(parseDotenv('\n# c\n  # d\nA=1\n'), { A: '1' });
});

test('splits at the first = only', () =>
{
    assert.deepEqual(
        parseDotenv('SPRING_DATASOURCE_URL=jdbc:postgresql://h:5432/db?sslmode=require'),
        { SPRING_DATASOURCE_URL: 'jdbc:postgresql://h:5432/db?sslmode=require' }
    );
});

test('reads CRLF line ends', () =>
{
    assert.deepEqual(parseDotenv('A=1\r\nB=2\r\n'), { A: '1', B: '2' });
});

test('keeps the spaces of a value', () =>
{
    assert.deepEqual(parseDotenv('A= x '), { A: ' x ' });
});

test('skips a line with no = or an empty name', () =>
{
    assert.deepEqual(parseDotenv('junk\n=v\nA=1'), { A: '1' });
});

test('the last of two equal names wins', () =>
{
    assert.deepEqual(parseDotenv('A=1\nA=2'), { A: '2' });
});

test('readDotenv returns null for a missing file', () =>
{
    assert.equal(readDotenv(join(mkdtempSync(join(tmpdir(), 'dotenv-')), '.env')), null);
});

test('readDotenv parses an existing file', () =>
{
    const file = join(mkdtempSync(join(tmpdir(), 'dotenv-')), '.env');
    writeFileSync(file, 'A=1\n');

    assert.deepEqual(readDotenv(file), { A: '1' });
});
