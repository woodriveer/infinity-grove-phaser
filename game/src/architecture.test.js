import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

//  The import rule of ADR 0007: imports point inward only.
//    domain      -> domain
//    application -> domain, application
//    phaser      -> domain, application, phaser                  (adapters/phaser, may import 'phaser')
//    http        -> domain, application, http                    (adapters/http, may import 'axios')
//    storage     -> domain, application, storage                 (adapters/storage)
//    root        -> everything                                   (main.js and composition.js wire the game)
const SRC = dirname(fileURLToPath(import.meta.url));

const ALLOWED_LAYERS = {
    domain: [ 'domain' ],
    application: [ 'domain', 'application' ],
    phaser: [ 'domain', 'application', 'phaser' ],
    http: [ 'domain', 'application', 'http' ],
    storage: [ 'domain', 'application', 'storage' ]
};

const ALLOWED_PACKAGES = { phaser: [ 'phaser' ], http: [ 'axios' ] };
const TEST_PACKAGES = [ 'vitest' ];

const layerOf = (path) =>
{
    const parts = relative(SRC, path).split(sep);

    if (parts[0] === 'domain' || parts[0] === 'application')
    {
        return parts[0];
    }

    if (parts[0] === 'adapters')
    {
        return parts[1];
    }

    return parts.length === 1 && [ 'main.js', 'composition.js' ].includes(parts[0]) ? 'root' : null;
};

const IMPORT_PATTERN = /(?:import|export)\s[^'";]*?from\s*['"]([^'"]+)['"]|import\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g;

const importsOf = (source) => [ ...source.matchAll(IMPORT_PATTERN) ].map((match) => match[1] ?? match[2] ?? match[3]);

//  Violations of one file as readable strings; `file` is an absolute path under src/
export const violationsOf = (file, source) =>
{
    const layer = layerOf(file);

    if (!layer || layer === 'root')
    {
        return [];
    }

    const isTest = file.endsWith('.test.js');
    const allowedPackages = [ ...(ALLOWED_PACKAGES[layer] ?? []), ...(isTest ? TEST_PACKAGES : []) ];

    return importsOf(source).flatMap((specifier) =>
    {
        if (!specifier.startsWith('.'))
        {
            const name = specifier.startsWith('node:') ? specifier : specifier.split('/')[0];

            return allowedPackages.includes(name) ? [] : [ `${relative(SRC, file)} imports the package '${specifier}' (${layer} may not)` ];
        }

        const target = layerOf(resolve(dirname(file), specifier));

        return target && !ALLOWED_LAYERS[layer].includes(target)
            ? [ `${relative(SRC, file)} (${layer}) imports '${specifier}' from the ${target} layer` ]
            : [];
    });
};

const sourceFiles = (directory) =>
    readdirSync(directory).flatMap((name) =>
    {
        const path = join(directory, name);

        if (statSync(path).isDirectory())
        {
            return sourceFiles(path);
        }

        return path.endsWith('.js') && !path.endsWith('architecture.test.js') ? [ path ] : [];
    });

describe('architecture (ADR 0007)', () =>
{
    it('every layer imports only inward', () =>
    {
        const violations = sourceFiles(SRC).flatMap((file) => violationsOf(file, readFileSync(file, 'utf8')));

        expect(violations).toEqual([]);
    });

    it('the domain may not import phaser, axios or an adapter', () =>
    {
        const file = join(SRC, 'domain', 'combat', 'x.js');

        expect(violationsOf(file, "import { Scene } from 'phaser';")).toHaveLength(1);
        expect(violationsOf(file, "import axios from 'axios';")).toHaveLength(1);
        expect(violationsOf(file, "import { walletApi } from '../../adapters/http/walletApi';")).toHaveLength(1);
        expect(violationsOf(file, "import { WalletLedger } from '../economy/walletLedger';")).toEqual([]);
    });

    it('the application may not import an adapter, composition or a package', () =>
    {
        const file = join(SRC, 'application', 'wallet', 'x.js');

        expect(violationsOf(file, "import { httpClient } from '../../adapters/http/httpClient';")).toHaveLength(1);
        expect(violationsOf(file, "import { Scene } from 'phaser';")).toHaveLength(1);
        expect(violationsOf(file, "export { services } from '../../composition';")).toEqual([]);
        expect(violationsOf(file, "import { WalletLedger } from '../../domain/economy/walletLedger';")).toEqual([]);
    });

    it('an adapter may not import a sibling adapter, but may import its own package and the inner layers', () =>
    {
        const scene = join(SRC, 'adapters', 'phaser', 'x.js');
        const http = join(SRC, 'adapters', 'http', 'x.js');

        expect(violationsOf(scene, "import { userApi } from '../http/userApi';")).toHaveLength(1);
        expect(violationsOf(scene, "import { Scene } from 'phaser';")).toEqual([]);
        expect(violationsOf(scene, "import axios from 'axios';")).toHaveLength(1);
        expect(violationsOf(http, "import axios from 'axios';")).toEqual([]);
        expect(violationsOf(http, "import { sessionStore } from '../storage/sessionStore';")).toHaveLength(1);
        expect(violationsOf(http, "import { ApiError } from '../../application/ApiError';")).toEqual([]);
    });

    it('a dynamic import is checked like a static one', () =>
    {
        const file = join(SRC, 'domain', 'x.js');

        expect(violationsOf(file, "const m = await import('../adapters/http/httpClient');")).toHaveLength(1);
    });

    it('tests may import vitest, and main.js and composition.js may import anything', () =>
    {
        expect(violationsOf(join(SRC, 'domain', 'x.test.js'), "import { it } from 'vitest';")).toEqual([]);
        expect(violationsOf(join(SRC, 'domain', 'x.js'), "import { it } from 'vitest';")).toHaveLength(1);
        expect(violationsOf(join(SRC, 'main.js'), "import { Game } from 'phaser';")).toEqual([]);
        expect(violationsOf(join(SRC, 'composition.js'), "import axios from 'axios';")).toEqual([]);
    });
});
