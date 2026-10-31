import { mkdirSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

//  Saves a screenshot of the page (or of one locator) as .specs/features/<feature>/ui-review/<NN>-<name>-<desktop|phone>.png.
//  The feature is the name of the shots file (bulkSell.shots.js reviews .specs/features/bulk-sell), or the FEATURE env var.
//  Number the names in the order the player meets the screens ('01-bag', '02-selection'), so the files sort like the report.
export async function shot (target, testInfo, name, { fullPage = false } = {}) {
    const feature = process.env.FEATURE ?? kebab(basename(testInfo.file, '.shots.js'));
    const dir = join(repoRoot, '.specs', 'features', feature, 'ui-review');

    mkdirSync(dir, { recursive: true });

    const path = join(dir, `${name}-${testInfo.project.name}.png`);
    const options = 'goto' in target ? { path, fullPage, animations: 'disabled' } : { path, animations: 'disabled' };

    await target.screenshot(options);

    return path;
}

const kebab = (name) => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
