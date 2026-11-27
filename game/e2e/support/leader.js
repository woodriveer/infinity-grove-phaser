import { expect } from '@playwright/test';

//  Opens the leader list: the Equipe screen, then its leader card, which shows `Escolher líder` over one row `leader-entry-<id>` per owned hero (spec ui-polish, UIP-13)
export const openLeaderList = async (page) => {
    await page.getByTestId('hud-team').click();
    await expect(page.getByTestId('team-screen')).toBeVisible();
    await page.getByTestId('team-slot-0').click();
    await expect(page.getByTestId('leader-list')).toBeVisible();
};
