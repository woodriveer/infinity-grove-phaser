import { el } from './dom';

//  The account reset (spec account-reset): the button of the auto click box and the dialog that confirms it. `reward` is the crystals the
//  reset pays; `busy` disables `Resetar` while the reset is on its way and `error` is the line shown after a failed request.
export const resetButtonText = (reward) => `Resetar conta (+${reward} cristais)`;

export const resetDialogText = (reward) => 'Resetar a conta? Você volta ao capítulo 1 e perde todos os talentos e pontos de talento. '
    + `Moedas, equipamentos, cartas, cristais e o auto clique são mantidos. Você ganha ${reward} cristais.`;

export const resetNoticeText = (reward) => `+${reward} cristais`;

export const RESET_ERROR_TEXT = 'Não foi possível resetar. Tente de novo.';

export const renderResetButton = (reward) => el('button', 'reset-account', resetButtonText(reward), { type: 'button', testid: 'reset-account' });

export const renderResetDialog = ({ reward, busy = false, error = null }) =>
{
    const confirm = el('button', 'reset-confirm', 'Resetar', { type: 'button', testid: 'reset-confirm' });
    const nodes = [ el('div', 'reset-question', resetDialogText(reward), { testid: 'reset-question' }) ];

    confirm.disabled = busy;

    if (error)
    {
        nodes.push(el('div', 'reset-error', error, { testid: 'reset-error' }));
    }

    nodes.push(confirm, el('button', 'reset-cancel', 'Cancelar', { type: 'button', testid: 'reset-cancel' }));

    return nodes;
};
