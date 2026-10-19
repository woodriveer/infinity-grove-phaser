package br.com.woodriver.infinity_grove_ws.domain

import br.com.woodriver.infinity_grove_ws.port.DropRollerPort
import org.slf4j.LoggerFactory

/** A player's money and their per-rule drop queues. [copper] is the whole total; coins are derived from it. */
data class Wallet(
    val username: String,
    val copper: Long,
    val queues: Map<Int, DropQueue>,
) {
    fun coins() =
        Coins(
            gold = copper / COPPER_PER_GOLD,
            silver = (copper / COPPER_PER_SILVER % SILVER_PER_GOLD).toInt(),
            copper = (copper % COPPER_PER_SILVER).toInt(),
        )

    /** Adds queues for rules new to the table and re-rolls queues the table no longer allows. Hidden queues stay as stored. */
    fun refreshed(
        table: DropTable,
        roller: DropRollerPort,
        now: Long,
    ): Wallet {
        val updated =
            table.rules.associate { rule ->
                rule.id to (queues[rule.id]?.refreshed(rule, roller) ?: DropQueue.fresh(rule, roller, now))
            }
        return copy(queues = queues + updated)
    }

    fun dropsFor(table: DropTable): Map<Int, List<Int>> = table.ids.associateWith { id -> queues.getValue(id).queue }

    /** Credits the queued values for the kills the allowance accepts; rejects the whole request if any rule is unknown. */
    fun credit(
        kills: Map<Int, Int>,
        table: DropTable,
        roller: DropRollerPort,
        now: Long,
    ): SyncResult {
        kills.keys.firstOrNull { table.ruleFor(it) == null }?.let {
            logger.warn("Sync rejected, unknown drop rule username={} ruleId={}", username, it)
            throw UnknownLevelException(it.toString())
        }
        var total = copper
        var updated = queues
        val accepted = linkedMapOf<Int, Int>()
        kills.forEach { (ruleId, requested) ->
            val rule = table.ruleFor(ruleId)!!
            val current = queues[ruleId] ?: DropQueue.fresh(rule, roller, now)
            val result = current.accept(requested, rule, roller, now)
            total = addClamped(total, result.copper)
            updated = updated + (ruleId to result.drops)
            accepted[ruleId] = result.count
            logger.info("Credited kills username={} ruleId={} requested={} accepted={}", username, ruleId, requested, result.count)
            if (result.count < requested) {
                logger.warn("Discarded kills username={} ruleId={} discarded={}", username, ruleId, requested - result.count)
            }
        }
        return SyncResult(copy(copper = total, queues = updated), accepted)
    }

    /** Adds [amount] copper, clamped at the 64-bit total. */
    fun plus(amount: Long): Wallet = copy(copper = addClamped(copper, amount))

    /** Takes [amount] copper; a wallet that holds less is rejected and nothing changes. */
    fun minus(amount: Long): Wallet {
        if (copper < amount) throw NotEnoughCopperException(amount)
        return copy(copper = copper - amount)
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
            return Wallet(username, 0, table.rules.associate { it.id to DropQueue.fresh(it, roller, now) })
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
