//  Small helpers shared by the hero views, which build plain DOM (no Phaser) so they can be tested in jsdom.
export const ART_PATH = 'assets/heroes';

//  An element with a class name, optional text and attributes (`testid` becomes data-testid)
export const el = (tag, className = '', text = '', attributes = {}) =>
{
    const node = document.createElement(tag);

    if (className)
    {
        node.className = className;
    }

    if (text !== '')
    {
        node.textContent = text;
    }

    Object.entries(attributes).forEach(([ name, value ]) =>
    {
        node.setAttribute(name === 'testid' ? 'data-testid' : name, value);
    });

    return node;
};

export const art = (name, alt, className) => el('img', className, '', { src: `${ART_PATH}/${name}.jpg`, alt, loading: 'lazy' });

//  The standing hero on a transparent background (the portrait art still carries its chroma-key backdrop)
export const sprite = (heroId, alt, className = '') => el('img', className, '', { src: `${ART_PATH}/${heroId}_sprite.png`, alt, loading: 'lazy' });

export const starsText = (stars) => `${stars}★`;

//  An icon from assets/ui; when the file is missing (the art may not exist yet) it is replaced by `glyph`, a mark drawn with text, so the
//  control that holds it keeps working. The wrapper is a span with the class `icon`.
export const UI_ART_PATH = 'assets/ui';

export const iconWithFallback = (name, glyph, className = '') =>
{
    const wrapper = el('span', `icon ${className}`.trim());
    const image = el('img', 'icon-image', '', { src: `${UI_ART_PATH}/${name}.png`, alt: '', loading: 'lazy' });

    image.addEventListener('error', () =>
    {
        image.replaceWith(el('span', 'icon-fallback', glyph));
    });
    wrapper.append(image);

    return wrapper;
};
