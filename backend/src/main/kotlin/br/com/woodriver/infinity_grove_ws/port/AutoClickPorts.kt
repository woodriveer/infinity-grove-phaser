package br.com.woodriver.infinity_grove_ws.port

interface CrystalRepositoryPort {
    /** The crystals of the player, 0 when they never had any. */
    fun balance(username: String): Long

    /** Stores the balance of the player, inserting its row the first time. */
    fun save(
        username: String,
        crystals: Long,
    )
}

interface AutoClickRepositoryPort {
    /** The auto click level of the player, 0 when they never upgraded it. */
    fun level(username: String): Int

    /** Stores the level of the player, inserting its row on the first upgrade. */
    fun save(
        username: String,
        level: Int,
    )
}
