package br.com.woodriver.infinity_grove_ws.domain

import br.com.woodriver.infinity_grove_ws.port.DropRollerPort
import org.slf4j.LoggerFactory

/** One player's drops for one monster level: the pre-rolled queue and the kill allowance bucket. */
data class LevelDrops(
    val level: Int,
    val queue: List<Int>,
    val allowance: Int,
    val allowanceUpdatedAt: Long,
) {
    /** Re-rolls the whole queue when it is not 20 values inside the level's current range. */
    fun refreshed(
        rule: DropRule,
        roller: DropRollerPort,
    ): LevelDrops {
        if (queue.size == QUEUE_SIZE && queue.all(rule::accepts)) return this
        logger.info("Re-rolling drop queue level={}", level)
        return copy(queue = rollQueue(rule, roller))
    }

    /** Accepts up to [requested] kills, never more than the allowance, and credits the first queued values. */
    fun accept(
        requested: Int,
        rule: DropRule,
        roller: DropRollerPort,
        now: Long,
    ): AcceptedKills {
        if (requested == 0) return AcceptedKills(this, 0, 0)
        val current = withAllowanceAt(rule, now)
        val count = minOf(requested, current.allowance)
        val credited = current.queue.take(count).sumOf { it.toLong() }
        val queue = current.queue.drop(count) + List(count) { rule.roll(roller) }
        logger.debug("Accepted kills level={} requested={} accepted={}", level, requested, count)
        return AcceptedKills(current.copy(queue = queue, allowance = current.allowance - count), count, credited)
    }

    private fun withAllowanceAt(
        rule: DropRule,
        now: Long,
    ): LevelDrops {
        if (allowance >= MAX_ALLOWANCE) return copy(allowance = MAX_ALLOWANCE, allowanceUpdatedAt = now)
        val steps = ((now - allowanceUpdatedAt) / rule.killIntervalMs).coerceAtLeast(0)
        val grown = minOf(MAX_ALLOWANCE.toLong(), allowance + steps).toInt()
        val updatedAt = if (grown >= MAX_ALLOWANCE) now else allowanceUpdatedAt + steps * rule.killIntervalMs
        return copy(allowance = grown, allowanceUpdatedAt = updatedAt)
    }

    companion object {
        private val logger = LoggerFactory.getLogger(LevelDrops::class.java)
        const val QUEUE_SIZE = 20
        const val MAX_ALLOWANCE = 20

        fun fresh(
            rule: DropRule,
            roller: DropRollerPort,
            now: Long,
        ) = LevelDrops(rule.level, rollQueue(rule, roller), MAX_ALLOWANCE, now)

        private fun rollQueue(
            rule: DropRule,
            roller: DropRollerPort,
        ) = List(QUEUE_SIZE) { rule.roll(roller) }
    }
}

/** The outcome of accepting kills: the new state, how many kills counted, and the copper they credit. */
data class AcceptedKills(
    val drops: LevelDrops,
    val count: Int,
    val copper: Long,
)
