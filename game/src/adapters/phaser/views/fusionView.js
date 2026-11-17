import { isAscended } from '../../../domain/heroes/heroes';
import { el, starsText } from './dom';

//  The card a fusion made; from 4 stars it names the one skill the new star raised and its new level
export const renderFusionResult = ({ heroName, stars, skillName = '', level = 0 }) =>
    el('div', 'fusion-result', `Nova carta: ${heroName} ${starsText(stars)}${isAscended(stars) && skillName && level >= 1 ? ` · ${skillName} no nível ${level}` : ''}`, { testid: 'fusion-result' });
