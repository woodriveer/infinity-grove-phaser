package br.com.woodriver.infinity_grove_ws.usecase

import br.com.woodriver.infinity_grove_ws.domain.DropTable
import br.com.woodriver.infinity_grove_ws.domain.SyncResult
import br.com.woodriver.infinity_grove_ws.domain.Wallet

interface GetWalletUseCase {
    /** Returns the player's wallet with its drop queues up to date, creating the wallet on first use. */
    fun get(username: String): Wallet
}

interface SyncKillsUseCase {
    /** Credits the kills the allowance accepts, keyed by drop rule id. */
    fun sync(
        username: String,
        kills: Map<Int, Int>,
    ): SyncResult
}

interface GetDropTableUseCase {
    /** The drop rules as they are stored now; the wallet shows one queue per rule. */
    fun dropTable(): DropTable
}
