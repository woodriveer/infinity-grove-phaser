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

    /** Removes every level of the player, keeping the points their first clears paid. */
    fun deleteLevels(username: String)

    /** The talent points the first clears of the player paid. */
    fun earnedPoints(username: String): Int

    /** Records the award [key] of the player with its [points]; false, and nothing stored, when that key was already paid. */
    fun award(
        username: String,
        key: String,
        points: Int,
    ): Boolean

    fun deleteByUsername(username: String)
}
