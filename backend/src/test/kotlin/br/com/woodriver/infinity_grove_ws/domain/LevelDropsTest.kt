package br.com.woodriver.infinity_grove_ws.domain

import br.com.woodriver.infinity_grove_ws.SequenceDropRoller
import kotlin.test.Test
import kotlin.test.assertEquals

class LevelDropsTest {
    private val rule = DropRule(level = 1, minCopper = 1, maxCopper = 5, killIntervalMs = 1500)
    private val firstTwenty = (0 until 20).map { it % 5 + 1 }

    private fun roller() = SequenceDropRoller(1, 2, 3, 4, 5)

    private fun state(
        allowance: Int,
        updatedAt: Long,
        queue: List<Int> = firstTwenty,
    ) = LevelDrops(1, queue, allowance, updatedAt)

    @Test
    fun `fresh holds 20 rolled values and a full allowance starting now`() {
        val drops = LevelDrops.fresh(rule, roller(), now = 1_000)

        assertEquals(firstTwenty, drops.queue)
        assertEquals(20, drops.allowance)
        assertEquals(1_000, drops.allowanceUpdatedAt)
    }

    @Test
    fun `accept credits the first values, removes them and refills the queue to 20`() {
        val roller = SequenceDropRoller(1, 2, 3, 4, 5)
        val drops = LevelDrops.fresh(rule, roller, now = 0)

        val result = drops.accept(3, rule, roller, now = 0)

        assertEquals(3, result.count)
        assertEquals(6L, result.copper)
        assertEquals(firstTwenty.drop(3) + listOf(1, 2, 3), result.drops.queue)
        assertEquals(20, result.drops.queue.size)
    }

    @Test
    fun `accepting all 20 kills of a full allowance credits all 20 and returns a fresh queue of 20`() {
        val roller = roller()
        val drops = LevelDrops.fresh(rule, roller, now = 0)

        val result = drops.accept(20, rule, roller, now = 0)

        assertEquals(20, result.count)
        assertEquals(firstTwenty.sum().toLong(), result.copper)
        assertEquals(firstTwenty, result.drops.queue)
    }

    @Test
    fun `accept spends one allowance per accepted kill`() {
        val roller = roller()
        val drops = LevelDrops.fresh(rule, roller, now = 0)

        val result = drops.accept(3, rule, roller, now = 0)

        assertEquals(17, result.drops.allowance)
    }

    @Test
    fun `accept takes at most the allowance and discards the excess`() {
        val roller = roller()
        val drops = LevelDrops.fresh(rule, roller, now = 0)

        val result = drops.accept(500, rule, roller, now = 0)

        assertEquals(20, result.count)
        assertEquals(firstTwenty.sum().toLong(), result.copper)
        assertEquals(0, result.drops.allowance)
    }

    @Test
    fun `an immediate second batch is accepted only up to what the allowance regained`() {
        val roller = roller()
        val first = LevelDrops.fresh(rule, roller, now = 0).accept(20, rule, roller, now = 0)

        val second = first.drops.accept(500, rule, roller, now = 1_499)

        assertEquals(0, second.count)
        assertEquals(0L, second.copper)
    }

    @Test
    fun `allowance grows by one for each full interval`() {
        val roller = roller()

        val result = state(allowance = 17, updatedAt = 0).accept(100, rule, roller, now = 3_000)

        assertEquals(19, result.count)
    }

    @Test
    fun `allowance never grows above 20`() {
        val roller = roller()

        val result = state(allowance = 18, updatedAt = 0).accept(100, rule, roller, now = 15_000)

        assertEquals(20, result.count)
    }

    @Test
    fun `partial interval progress is kept after a spend`() {
        val roller = roller()
        val spent = state(allowance = 10, updatedAt = 0).accept(12, rule, roller, now = 3_700)

        assertEquals(12, spent.count)
        assertEquals(0, spent.drops.allowance)
        assertEquals(3_000, spent.drops.allowanceUpdatedAt)
        assertEquals(1, spent.drops.accept(5, rule, roller, now = 4_500).count)
    }

    @Test
    fun `leaving the full allowance starts the timer at the moment of the spend`() {
        val roller = roller()
        val full = LevelDrops.fresh(rule, roller, now = 0)

        val emptied = full.accept(20, rule, roller, now = 10_000)

        assertEquals(10_000, emptied.drops.allowanceUpdatedAt)
        assertEquals(0, emptied.drops.accept(5, rule, roller, now = 11_499).count)
        assertEquals(1, emptied.drops.accept(5, rule, roller, now = 11_500).count)
    }

    @Test
    fun `a clock that moved backwards adds no allowance`() {
        val roller = roller()

        val result = state(allowance = 5, updatedAt = 10_000).accept(10, rule, roller, now = 5_000)

        assertEquals(5, result.count)
    }

    @Test
    fun `zero kills leave the state unchanged`() {
        val roller = roller()
        val drops = state(allowance = 7, updatedAt = 123)

        val result = drops.accept(0, rule, roller, now = 999_999)

        assertEquals(0, result.count)
        assertEquals(0L, result.copper)
        assertEquals(drops, result.drops)
    }

    @Test
    fun `refreshed keeps a queue whose values are all in range`() {
        val drops = state(allowance = 4, updatedAt = 50)

        assertEquals(drops, drops.refreshed(rule, roller()))
    }

    @Test
    fun `refreshed rolls a new queue when a value is outside the range`() {
        val stale = state(allowance = 4, updatedAt = 50, queue = firstTwenty.dropLast(1) + 6)

        val refreshed = stale.refreshed(rule, roller())

        assertEquals(firstTwenty, refreshed.queue)
        assertEquals(4, refreshed.allowance)
        assertEquals(50, refreshed.allowanceUpdatedAt)
    }

    @Test
    fun `refreshed rolls a new queue when it does not hold 20 values`() {
        val short = state(allowance = 4, updatedAt = 50, queue = listOf(1, 2, 3))

        assertEquals(firstTwenty, short.refreshed(rule, roller()).queue)
    }
}
