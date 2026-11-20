//  Claims the event gift when the battle starts (spec black-awareness-staff). Ports (ADR 0007):
//    gateway    { claim() }  POST /gifts/claim; resolves { granted, gift?, piece? }, rejects with an ApiError
//    equipment  { applyDrop({ piece, sold }) }  the equipment collection of the scene
//    onGift(piece)  shows the notice
//  Resolves the granted piece, or null when nothing was granted or the call failed: a failure is never thrown, the battle plays on (D15).
export const claimGift = async ({ gateway, equipment, onGift }) =>
{
    let answer;

    try
    {
        answer = await gateway.claim();
    }
    catch
    {
        return null;
    }

    if (!answer?.granted || !answer.piece)
    {
        return null;
    }

    equipment.applyDrop({ piece: answer.piece, sold: false });
    onGift(answer.piece);

    return answer.piece;
};
