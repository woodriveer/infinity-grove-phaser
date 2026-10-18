package br.com.woodriver.infinity_grove_ws.domain

import br.com.woodriver.infinity_grove_ws.port.DropRollerPort
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class WalletTest {
    /** Always rolls the lowest value, so level 1 drops 1 copper and level 2 drops 10. */
    private val minRoller =
        object : DropRollerPort {
            override fun roll(
                min: Int,
                max: Int,
            ) = min
        }

    private val levelOne = DropRule(1, 1, 5, 1500)
    private val levelTwo = DropRule(2, 10, 12, 3000)
    private val oneLevel = DropTable(listOf(levelOne))
    private val twoLevels = DropTable(listOf(levelOne, levelTwo))

    private fun wallet(
        copper: Long = 0,
        table: DropTable = twoLevels,
    ) = Wallet.open("yan", table, minRoller, now = 0).copy(copper = copper)

    @Test
    fun `open starts at zero copper with a fresh state for every level`() {
        val wallet = Wallet.open("yan", twoLevels, minRoller, now = 500)

        assertEquals("yan", wallet.username)
        assertEquals(0L, wallet.copper)
        assertEquals(setOf(1, 2), wallet.levels.keys)
        assertEquals(List(20) { 1 }, wallet.levels.getValue(1).queue)
        assertEquals(List(20) { 10 }, wallet.levels.getValue(2).queue)
        assertEquals(20, wallet.levels.getValue(2).allowance)
        assertEquals(500L, wallet.levels.getValue(2).allowanceUpdatedAt)
    }

    @Test
    fun `coins derive gold silver and copper from the copper total`() {
        assertEquals(Coins(0, 0, 0), wallet(0).coins())
        assertEquals(Coins(0, 0, 99), wallet(99).coins())
        assertEquals(Coins(0, 1, 0), wallet(100).coins())
        assertEquals(Coins(0, 99, 99), wallet(9_999).coins())
        assertEquals(Coins(1, 0, 0), wallet(10_000).coins())
        assertEquals(Coins(1234, 56, 78), wallet(12_345_678).coins())
    }

    @Test
    fun `coins leave gold unbounded up to the 64-bit total`() {
        assertEquals(Coins(922_337_203_685_477, 58, 7), wallet(Long.MAX_VALUE).coins())
    }

    @Test
    fun `refreshed adds a level that is new to the table and keeps the others`() {
        val old = wallet(table = oneLevel)

        val refreshed = old.refreshed(twoLevels, minRoller, now = 900)

        assertEquals(old.levels.getValue(1), refreshed.levels.getValue(1))
        assertEquals(LevelDrops.fresh(levelTwo, minRoller, 900), refreshed.levels.getValue(2))
    }

    @Test
    fun `refreshed re-rolls a queue that left the level range`() {
        val narrowed = DropTable(listOf(DropRule(1, 3, 4, 1500)))

        val refreshed = wallet(table = oneLevel).refreshed(narrowed, minRoller, now = 0)

        assertEquals(List(20) { 3 }, refreshed.levels.getValue(1).queue)
    }

    @Test
    fun `refreshed keeps the stored state of a level missing from the table`() {
        val old = wallet(table = twoLevels)

        val refreshed = old.refreshed(oneLevel, minRoller, now = 0)

        assertEquals(old.levels.getValue(2), refreshed.levels.getValue(2))
    }

    @Test
    fun `refreshed twice returns the same drops in the same order`() {
        val once = wallet().refreshed(twoLevels, minRoller, now = 10)

        val twice = once.refreshed(twoLevels, minRoller, now = 20)

        assertEquals(once.dropsFor(twoLevels), twice.dropsFor(twoLevels))
    }

    @Test
    fun `dropsFor returns the queues of table levels only`() {
        val full = wallet(table = twoLevels)

        assertEquals(setOf(1), full.dropsFor(oneLevel).keys)
        assertEquals(List(20) { 1 }, full.dropsFor(oneLevel).getValue(1))
    }

    @Test
    fun `credit adds the queued values of every level and reports accepted kills per level`() {
        val result = wallet().credit(mapOf(1 to 3, 2 to 2), twoLevels, minRoller, now = 0)

        assertEquals(3 * 1 + 2 * 10L, result.wallet.copper)
        assertEquals(mapOf(1 to 3, 2 to 2), result.accepted)
    }

    @Test
    fun `credit discards kills above the allowance of each level`() {
        val result = wallet().credit(mapOf(1 to 500, 2 to 7), twoLevels, minRoller, now = 0)

        assertEquals(mapOf(1 to 20, 2 to 7), result.accepted)
        assertEquals(20 * 1 + 7 * 10L, result.wallet.copper)
    }

    @Test
    fun `credit refills each queue and keeps the levels it was not asked about unchanged`() {
        val old = wallet()

        val result = old.credit(mapOf(1 to 5), twoLevels, minRoller, now = 0)

        assertEquals(
            20,
            result.wallet.levels
                .getValue(1)
                .queue.size,
        )
        assertEquals(
            15,
            result.wallet.levels
                .getValue(1)
                .allowance,
        )
        assertEquals(old.levels.getValue(2), result.wallet.levels.getValue(2))
    }

    @Test
    fun `credit with no kills or only zero counts leaves the wallet unchanged`() {
        val old = wallet(copper = 42)

        assertEquals(old, old.credit(emptyMap(), twoLevels, minRoller, now = 99).wallet)

        val zeros = old.credit(mapOf(1 to 0, 2 to 0), twoLevels, minRoller, now = 99)
        assertEquals(old, zeros.wallet)
        assertEquals(mapOf(1 to 0, 2 to 0), zeros.accepted)
    }

    @Test
    fun `credit rejects an unknown level and credits nothing even for the valid ones`() {
        val e = assertFailsWith<UnknownLevelException> { wallet().credit(mapOf(1 to 3, 7 to 1), twoLevels, minRoller, now = 0) }

        assertEquals("WALLET_UNKNOWN_LEVEL", e.code)
    }

    @Test
    fun `credit clamps the total at the largest 64-bit value`() {
        val result = wallet(copper = Long.MAX_VALUE - 2).credit(mapOf(2 to 1), twoLevels, minRoller, now = 0)

        assertEquals(Long.MAX_VALUE, result.wallet.copper)
    }

    @Test
    fun `plus adds copper and clamps at the 64-bit total`() {
        assertEquals(150L, wallet(100).plus(50).copper)
        assertEquals(Long.MAX_VALUE, wallet(Long.MAX_VALUE - 1).plus(5).copper)
    }

    @Test
    fun `minus takes copper down to exactly zero`() {
        assertEquals(100L, wallet(600).minus(500).copper)
        assertEquals(0L, wallet(500).minus(500).copper)
    }

    @Test
    fun `minus rejects an amount above the balance and leaves the wallet as it was`() {
        val wallet = wallet(499)

        assertFailsWith<NotEnoughCopperException> { wallet.minus(500) }
        assertEquals(499L, wallet.copper)
    }
}
