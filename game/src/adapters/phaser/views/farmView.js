import { bossLabel } from '../../../domain/heroes/heroes';
import { el } from './dom';

//  The bosses the player beat and may fight again; the chapter boss shows its wins left today and cannot be picked at 0.
//  `onPick(boss)` fires with { kind, stage } of the chosen boss.
export const renderFarm = (bosses, winsLeft, { onPick }) =>
{
    if (bosses.length === 0)
    {
        return el('p', 'hero-empty', 'Nenhum chefe derrotado ainda.', { testid: 'farm-empty' });
    }

    const list = el('div', 'farm-list', '', { testid: 'farm-list' });

    bosses.forEach((boss) =>
    {
        const chapterBoss = boss.kind === 'CHAPTER_BOSS';
        const id = chapterBoss ? 'chapter-boss' : `miniboss-${boss.stage}`;
        const row = el('button', 'farm-entry', '', { type: 'button', testid: `farm-entry-${id}` });

        row.append(el('span', 'farm-name', bossLabel(boss)));

        if (chapterBoss)
        {
            row.append(el('span', 'farm-wins', `${winsLeft} vitórias restantes hoje`));
            row.disabled = winsLeft <= 0;
        }

        row.addEventListener('click', () => onPick(boss));
        list.append(row);
    });

    return list;
};
