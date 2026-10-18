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

export const starsText = (stars) => `${stars}★`;
