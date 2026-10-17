package br.com.woodriver.infinity_grove_ws.domain

import br.com.woodriver.infinity_grove_ws.port.DropRollerPort
import org.slf4j.LoggerFactory

/** A player's money and their per-level drop state. [copper] is the whole total; coins are derived from it. */
data class Wallet(
    val username: String,
    val copper: Long,
    val levels: Map<Int, LevelDrops>,
) {
    fun coins() =
        Coins(
            gold = copper / COPPER_PER_GOLD,
            silver = (copper / COPPER_PER_SILVER % SILVER_PER_GOLD).toInt(),
            copper = (copper % COPPER_PER_SILVER).toInt(),
        )

    /** Adds levels that are new to the table and re-rolls queues the table no longer allows. Hidden levels stay as stored. */
    fun refreshed(
        table: DropTable,
        roller: DropRollerPort,
        now: Long,
    ): Wallet {
        val updated =
            table.rules.associate { rule ->
                rule.level to (levels[rule.level]?.refreshed(rule, roller) ?: LevelDrops.fresh(rule, roller, now))
            }
        return copy(levels = levels + updated)
    }

    fun dropsFor(table: DropTable): Map<Int, List<Int>> = table.levels.associateWith { level -> levels.getValue(level).queue }

    /** Credits the queued values for the kills the allowance accepts; rejects the whole request if any level is unknown. */
    fun credit(
        kills: Map<Int, Int>,
        table: DropTable,
        roller: DropRollerPort,
        now: Long,
    ): SyncResult {
        kills.keys.firstOrNull { table.ruleFor(it) == null }?.let {
            logger.warn("Sync rejected, unknown level username={} level={}", username, it)
            throw UnknownLevelException(it.toString())
        }
        var total = copper
        var updated = levels
        val accepted = linkedMapOf<Int, Int>()
        kills.forEach { (level, requested) ->
            val rule = table.ruleFor(level)!!
            val current = levels[level] ?: LevelDrops.fresh(rule, roller, now)
            val result = current.accept(requested, rule, roller, now)
            total = addClamped(total, result.copper)
            updated = updated + (level to result.drops)
            accepted[level] = result.count
            logger.info("Credited kills username={} level={} requested={} accepted={}", username, level, requested, result.count)
            if (result.count < requested) {
                logger.warn("Discarded kills username={} level={} discarded={}", username, level, requested - result.count)
            }
        }
        return SyncResult(copy(copper = total, levels = updated), accepted)
    }

    private fun addClamped(
        total: Long,
        amount: Long,
    ) = if (total > Long.MAX_VALUE - amount) Long.MAX_VALUE else total + amount

    companion object {
        private val logger = LoggerFactory.getLogger(Wallet::class.java)
        private const val COPPER_PER_SILVER = 100L
        private const val SILVER_PER_GOLD = 100L
        private const val COPPER_PER_GOLD = COPPER_PER_SILVER * SILVER_PER_GOLD

        fun open(
            username: String,
            table: DropTable,
            roller: DropRollerPort,
            now: Long,
        ): Wallet {
            logger.info("Opening Wallet username={}", username)
            return Wallet(username, 0, table.rules.associate { it.level to LevelDrops.fresh(it, roller, now) })
        }
    }
}

/** A wallet total split into denominations. Gold has no cap other than the 64-bit copper total behind it. */
data class Coins(
    val gold: Long,
    val silver: Int,
    val copper: Int,
)

data class SyncResult(
    val wallet: Wallet,
    val accepted: Map<Int, Int>,
)
