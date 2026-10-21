package br.com.woodriver.infinity_grove_ws.port

interface TalentRepositoryPort {
    /** The levels of the talents the player upgraded, by talent id. The caller holds the wallet lock when it changes them. */
    fun findAll(username: String): Map<String, Int>

    /** Stores [level] for the talent of the player, inserting its row on the first upgrade. */
    fun save(
        username: String,
        talentId: String,
        level: Int,
    )

    fun deleteByUsername(username: String)
}
