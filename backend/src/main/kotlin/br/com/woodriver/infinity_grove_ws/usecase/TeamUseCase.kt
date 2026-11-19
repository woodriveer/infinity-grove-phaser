package br.com.woodriver.infinity_grove_ws.usecase

import br.com.woodriver.infinity_grove_ws.domain.LeaderChange
import br.com.woodriver.infinity_grove_ws.domain.SlotPurchase

interface SaveTeamUseCase {
    /** Stores [allies] (4 entries, index 0 = ally slot 1, a hero id or null) as the player's team and returns the leader and the team. */
    fun saveAllies(
        username: String,
        allies: List<String?>,
    ): LeaderChange
}

interface BuyTeamSlotUseCase {
    /** Buys the next ally slot; [fromSlots] is the bought count the player saw. */
    fun buySlot(
        username: String,
        fromSlots: Int,
    ): SlotPurchase
}
