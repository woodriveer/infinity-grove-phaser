package br.com.woodriver.infinity_grove_ws.port

import br.com.woodriver.infinity_grove_ws.domain.Wallet

interface WalletRepositoryPort {
    /** Returns the wallet and locks it until the surrounding transaction ends, so concurrent syncs run one after the other. */
    fun findForUpdate(username: String): Wallet?

    /** Stores [wallet] only when the player has none yet; a concurrent insert for the same player is not an error. */
    fun createIfAbsent(wallet: Wallet)

    fun save(wallet: Wallet): Wallet

    fun deleteByUsername(username: String)
}
