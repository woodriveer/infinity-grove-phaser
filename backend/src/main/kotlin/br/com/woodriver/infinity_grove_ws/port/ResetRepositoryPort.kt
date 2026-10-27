package br.com.woodriver.infinity_grove_ws.port

interface ResetRepositoryPort {
    /** How many times the player reset the account, 0 when they never did. */
    fun count(username: String): Int

    /** Stores the reset count of the player, inserting its row on the first reset. */
    fun save(
        username: String,
        resets: Int,
    )
}
