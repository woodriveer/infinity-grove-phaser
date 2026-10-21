import { el } from './dom';

//  The tags of the effects that run now ({ label, seconds } from the skill combat): "Ventos Ligeiros 12s", "Bomba de Veneno x2 5s"
export const renderEffectTags = (effects) => effects.map(({ label, seconds }) => el('span', 'tag tag-effect', `${label} ${seconds}s`));
