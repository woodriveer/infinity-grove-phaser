package br.com.woodriver.infinity_grove_ws.usecase

import br.com.woodriver.infinity_grove_ws.domain.SyncResult
import br.com.woodriver.infinity_grove_ws.domain.Wallet

interface GetWalletUseCase {
    /** Returns the player's wallet with its drop queues up to date, creating the wallet on first use. */
    fun get(username: String): Wallet
}

interface SyncKillsUseCase {
    /** Credits the kills the allowance accepts, keyed by monster level. */
    fun sync(
        username: String,
        kills: Map<Int, Int>,
    ): SyncResult
}
