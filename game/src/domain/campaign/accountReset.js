//  The account reset (spec account-reset): from chapter 2 the player gives up the campaign and the talents for crystals, as many as the
//  chapter left, up to the last chapter. The backend pays the reward; the game mirrors the rule only to label the button (AD-004).
export const RESET_MAX_REWARD = 5;

//  The crystals a reset pays now; null in chapter 1 and before the campaign loads, where the reset is closed
export const resetReward = ({ chapter, completed }) =>
{
    if (completed === true)
    {
        return RESET_MAX_REWARD;
    }

    return (chapter ?? 0) >= 2 ? Math.min(chapter, RESET_MAX_REWARD) : null;
};
