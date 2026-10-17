package br.com.woodriver.infinity_grove_ws.domain

import br.com.woodriver.infinity_grove_ws.port.DropRollerPort
import org.slf4j.LoggerFactory

/** How a monster level drops copper: a range per kill and the fastest honest time between kills. */
data class DropRule(
    val level: Int,
    val minCopper: Int,
    val maxCopper: Int,
    val killIntervalMs: Long,
) {
    init {
        require(level >= 1) { "Drop table level $level must be at least 1" }
        require(minCopper >= 1) { "Drop table level $level: min-copper $minCopper must be at least 1" }
        require(maxCopper >= minCopper) {
            "Drop table level $level: max-copper $maxCopper must not be below min-copper $minCopper"
        }
        require(killIntervalMs >= 1) { "Drop table level $level: kill-interval-ms $killIntervalMs must be at least 1" }
    }

    fun roll(roller: DropRollerPort): Int {
        val value = roller.roll(minCopper, maxCopper)
        logger.debug("Rolled drop level={} value={}", level, value)
        return value
    }

    fun accepts(value: Int) = value in minCopper..maxCopper

    companion object {
        private val logger = LoggerFactory.getLogger(DropRule::class.java)
    }
}

/** The configured drop rules, one per monster level. */
class DropTable(
    val rules: List<DropRule>,
) {
    init {
        require(rules.isNotEmpty()) { "Drop table must have at least one level" }
        val duplicate = rules.groupBy { it.level }.entries.firstOrNull { it.value.size > 1 }
        require(duplicate == null) { "Drop table has a duplicate level ${duplicate?.key}" }
    }

    val levels: List<Int> = rules.map { it.level }

    fun ruleFor(level: Int): DropRule? = rules.firstOrNull { it.level == level }
}
