//  Drag a piece tile onto a hero block to equip it (spec drag-equip). Pointer events give mouse, touch and pen one path.
//  A press becomes a drag once the pointer is DRAG_THRESHOLD_PX from the press point; a shorter press stays a click.
//  Hero blocks carry `data-drop-hero="<heroId>"`; the hero who already wears the piece is not a target.
export const DRAG_THRESHOLD_PX = 6;

//  Edge scroll (spec D7): pointer distances in screen pixels, the step in the window's own scrollTop pixels
export const EDGE_PX = 40;
export const SCROLL_STEP_PX = 8;
export const SCROLL_TICK_MS = 16;

//  The one press in progress: a second pointer, or a press on another tile, is ignored while it runs
let active = null;

//  The hero block under the pointer when it is a valid target, else null. jsdom has no elementFromPoint, hence the `?.`
const heroUnder = (x, y, piece) =>
{
    const block = document.elementFromPoint?.(x, y)?.closest('[data-drop-hero]') ?? null;

    return block && block.getAttribute('data-drop-hero') !== piece.heroId ? block : null;
};

//  After a drag the browser fires a click on the common ancestor of press and release (or on the tile when released on it); it must not
//  open the piece or press a control. The listener goes once the click is past, or with the next task when no click comes.
const swallowNextClick = () =>
{
    const swallow = (event) =>
    {
        event.stopPropagation();
        event.preventDefault();
    };

    window.addEventListener('click', swallow, { capture: true, once: true });
    setTimeout(() => window.removeEventListener('click', swallow, { capture: true }));
};

//  The copy of the tile that follows the pointer: no test id of the tile, out of the tab order, hidden from screen readers.
//  It lives in body, outside the scaled hero panel, so it takes the panel's scale (rendered width over layout width) from the tile
const ghostOf = (tile) =>
{
    const ghost = tile.cloneNode(true);
    const scale = tile.offsetWidth ? tile.getBoundingClientRect().width / tile.offsetWidth : 1;

    ghost.querySelectorAll('.piece-tooltip').forEach((node) => node.remove());
    ghost.classList.add('piece-drag-ghost');
    ghost.style.setProperty('--ghost-scale', String(scale));
    ghost.removeAttribute('data-draggable');
    ghost.setAttribute('data-testid', 'piece-drag-ghost');
    ghost.setAttribute('aria-hidden', 'true');
    ghost.setAttribute('tabindex', '-1');

    return ghost;
};

export const attachDragToEquip = (tile, piece, onDrop) =>
{
    tile.setAttribute('data-draggable', 'true');
    //  The <img> of the icon could start a native drag, which ends ours with a pointercancel
    tile.addEventListener('dragstart', (event) => event.preventDefault());

    tile.addEventListener('pointerdown', (event) =>
    {
        if (active || !event.isPrimary || event.button !== 0 || tile.disabled)
        {
            return;
        }

        const press = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
        let ghost = null;
        let lit = null;
        const scroller = tile.closest('.hero-window');
        let last = press;
        let direction = 0;
        let timer = null;

        //  -1 near the top edge, 1 near the bottom edge, 0 elsewhere or when the window is not laid out (jsdom, hidden)
        const edge = (y) =>
        {
            const box = scroller?.getBoundingClientRect();

            if (!box || box.height === 0)
            {
                return 0;
            }

            if (y - box.top <= EDGE_PX)
            {
                return -1;
            }

            return box.bottom - y <= EDGE_PX ? 1 : 0;
        };

        //  Restarts the timer only when the direction changes: pointer moves come faster than a tick
        const steer = (y) =>
        {
            const next = edge(y);

            if (next === direction)
            {
                return;
            }

            clearInterval(timer);
            timer = null;
            direction = next;

            if (direction !== 0)
            {
                timer = setInterval(() =>
                {
                    scroller.scrollTop += direction * SCROLL_STEP_PX;
                    light(heroUnder(last.x, last.y, piece));
                }, SCROLL_TICK_MS);
            }
        };

        const light = (block) =>
        {
            if (block === lit)
            {
                return;
            }

            lit?.classList.remove('is-drop-target');
            lit?.querySelector('.is-drop-slot')?.classList.remove('is-drop-slot');
            lit = block;
            lit?.classList.add('is-drop-target');
            lit?.querySelector(`.piece-tile[data-slot="${piece.slot}"]`)?.classList.add('is-drop-slot');
        };

        const follow = (x, y) =>
        {
            last = { x, y };
            ghost.style.left = `${x}px`;
            ghost.style.top = `${y}px`;
            light(heroUnder(x, y, piece));
            steer(y);
        };

        //  Ends the press; answers whether it was a drag
        const finish = () =>
        {
            document.removeEventListener('pointermove', move);
            document.removeEventListener('pointerup', up);
            document.removeEventListener('pointercancel', cancel);
            active = null;
            clearInterval(timer);

            if (!ghost)
            {
                return false;
            }

            ghost.remove();
            tile.classList.remove('is-dragging');
            document.body.classList.remove('piece-dragging');
            light(null);
            swallowNextClick();

            return true;
        };

        function move (moved)
        {
            if (moved.pointerId !== press.pointerId)
            {
                return;
            }

            if (!ghost)
            {
                if (Math.hypot(moved.clientX - press.x, moved.clientY - press.y) < DRAG_THRESHOLD_PX)
                {
                    return;
                }

                ghost = ghostOf(tile);
                document.body.append(ghost);
                tile.classList.add('is-dragging');
                document.body.classList.add('piece-dragging');
            }

            follow(moved.clientX, moved.clientY);
        }

        function up (released)
        {
            if (released.pointerId !== press.pointerId)
            {
                return;
            }

            const target = ghost ? heroUnder(released.clientX, released.clientY, piece) : null;

            if (finish() && target)
            {
                onDrop(target.getAttribute('data-drop-hero'));
            }
        }

        function cancel (cancelled)
        {
            if (cancelled.pointerId === press.pointerId)
            {
                finish();
            }
        }

        active = press;
        document.addEventListener('pointermove', move);
        document.addEventListener('pointerup', up);
        document.addEventListener('pointercancel', cancel);
    });
};
