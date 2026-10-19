package br.com.woodriver.infinity_grove_ws.domain

import br.com.woodriver.infinity_grove_ws.port.DropRollerPort
import org.slf4j.LoggerFactory

/** How a monster level drops copper: a range per kill and the fastest honest time between kills. */
data class DropRule(
    val id: Int,
    val minCopper: Int,
    val maxCopper: Int,
    val killIntervalMs: Long,
) {
    init {
        require(id >= 1) { "Drop table level $id must be at least 1" }
        require(minCopper >= 1) { "Drop table level $id: min-copper $minCopper must be at least 1" }
        require(maxCopper >= minCopper) {
            "Drop table level $id: max-copper $maxCopper must not be below min-copper $minCopper"
        }
        require(killIntervalMs >= 1) { "Drop table level $id: kill-interval-ms $killIntervalMs must be at least 1" }
    }

    fun roll(roller: DropRollerPort): Int {
        val value = roller.roll(minCopper, maxCopper)
        logger.debug("Rolled drop ruleId={} value={}", id, value)
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
        val duplicate = rules.groupBy { it.id }.entries.firstOrNull { it.value.size > 1 }
        require(duplicate == null) { "Drop table has a duplicate level ${duplicate?.key}" }
    }

    val ids: List<Int> = rules.map { it.id }

    fun ruleFor(id: Int): DropRule? = rules.firstOrNull { it.id == id }
}
