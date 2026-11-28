import { expect, test } from './support/coverage';

const KEY = 'infinity-grove.story-seen';
const readSeen = (page) => page.evaluate((key) => localStorage.getItem(key), KEY);

test('the shared fixture marks every catalog scene as seen before the page loads', async ({ page }) => {
    await page.goto('/');

    expect(await readSeen(page)).toBe('["prologue","chapter-1"]');
});

test('the shared fixture keeps a seen list already stored', async ({ page }) => {
    await page.goto('/');
    await page.evaluate((key) => localStorage.setItem(key, '["chapter-1"]'), KEY);
    await page.reload();

    expect(await readSeen(page)).toBe('["chapter-1"]');
});

test.describe('without the seed', () => {
    test.use({ storySeen: false });

    test('the key stays absent', async ({ page }) => {
        await page.goto('/');

        expect(await readSeen(page)).toBeNull();
    });
});
