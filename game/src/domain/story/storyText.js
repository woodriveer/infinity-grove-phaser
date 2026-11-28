//  The text of a story line and how much of it shows at a time (spec story-scenes). Pure JavaScript: no Phaser, no clock.

//  The cue texts joined by one space
export const lineText = (line) => line.cues.map((cue) => cue[2]).join(' ');

//  The characters shown `t` seconds into the line: each cue types across its own start and end
export const charsAt = (line, t) =>
{
    let shown = 0;

    for (let i = 0; i < line.cues.length; i++)
    {
        const [ start, end, text ] = line.cues[i];
        //  every cue but the last also brings the space that joins it to the next one
        const length = text.length + (i < line.cues.length - 1 ? 1 : 0);

        if (t >= end)
        {
            shown += length;
        }
        else if (t > start)
        {
            shown += Math.floor(length * (t - start) / (end - start));
            break;
        }
        else
        {
            break;
        }
    }

    return Math.min(shown, lineText(line).length);
};
