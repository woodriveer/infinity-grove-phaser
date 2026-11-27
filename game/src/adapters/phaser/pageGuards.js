//  The page outside the text fields is not a document (spec ui-polish): no browser menu and no drag of its images or text.
export const TEXT_FIELD_SELECTOR = 'textarea, select, [contenteditable]:not([contenteditable="false"]), input:not([type="checkbox"]):not([type="radio"]):not([type="button"])';

//  A key typed into a text field is text, not a shortcut
export const isTextField = (target) => Boolean(target?.closest?.(TEXT_FIELD_SELECTOR));

//  Cancels the context menu and the drag start of everything but the text fields; the returned function removes both listeners
export const installPageGuards = (doc = document) =>
{
    const cancel = (event) =>
    {
        if (!isTextField(event.target))
        {
            event.preventDefault();
        }
    };
    doc.addEventListener('contextmenu', cancel);
    doc.addEventListener('dragstart', cancel);
    return () =>
    {
        doc.removeEventListener('contextmenu', cancel);
        doc.removeEventListener('dragstart', cancel);
    };
};
