import { el } from './dom';

//  The version of the game in the bottom-right corner of the page (spec game-version). It sits in document.body, outside the scaled
//  canvas, so it keeps its size on a phone and stays on every scene; style.css .game-version places it and lets clicks through.
export const VERSION_TESTID = 'game-version';

//  'v' and the version without the whitespace around it; null when the version is not a string or is blank
export const versionText = (version) =>
{
    if (typeof version !== 'string' || version.trim() === '')
    {
        return null;
    }

    return `v${version.trim()}`;
};

//  Appends the label to document.body, or rewrites the text of the label already there (the page holds one). Adds nothing for a blank version.
export const mountVersionLabel = (version) =>
{
    const text = versionText(version);

    if (text === null)
    {
        return null;
    }

    const existing = document.querySelector(`[data-testid="${VERSION_TESTID}"]`);

    if (existing)
    {
        existing.textContent = text;

        return existing;
    }

    const label = el('div', 'game-version', text, { testid: VERSION_TESTID });

    document.body.append(label);

    return label;
};
