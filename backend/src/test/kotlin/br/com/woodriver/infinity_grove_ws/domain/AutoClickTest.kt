package br.com.woodriver.infinity_grove_ws.domain

import br.com.woodriver.infinity_grove_ws.LogCapture
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse
import kotlin.test.assertNull
import kotlin.test.assertSame
import kotlin.test.assertTrue

class AutoClickTest {
    private val rules = AutoClickRules()

    private fun player(
        level: Int = 0,
        crystals: Long = 0,
    ) = PlayerAutoClick("yan", level, crystals)

    @Test
    fun `the default rules give 500, 250, 150, 100 and 50 ms for levels 0 to 4`() {
        assertEquals(listOf(500, 250, 150, 100, 50), (0..4).map { player(level = it).intervalMs(rules) })
        assertEquals(4, rules.maxLevel)
    }

    @Test
    fun `the next upgrade of each level costs 10, 25, 50 and 100 crystals`() {
        assertEquals(AutoClickStep(1, 250, 10), player(level = 0).next(rules))
        assertEquals(AutoClickStep(2, 150, 25), player(level = 1).next(rules))
        assertEquals(AutoClickStep(3, 100, 50), player(level = 2).next(rules))
        assertEquals(AutoClickStep(4, 50, 100), player(level = 3).next(rules))
    }

    @Test
    fun `there is no next upgrade at level 4`() {
        assertNull(player(level = 4).next(rules))
    }

    @Test
    fun `rules with a price count that does not match the levels fail`() {
        assertFailsWith<IllegalArgumentException> { AutoClickRules(listOf(500, 250), listOf(10, 25)) }
    }

    @Test
    fun `rules whose interval does not get faster fail`() {
        assertFailsWith<IllegalArgumentException> { AutoClickRules(listOf(500, 500), listOf(10)) }
    }

    @Test
    fun `rules with a price under 1 fail`() {
        assertFailsWith<IllegalArgumentException> { AutoClickRules(listOf(500, 250), listOf(0)) }
    }

    @Test
    fun `an upgrade from the held level raises it by one and takes the price`() {
        val upgraded = player(level = 0, crystals = 10).upgrade(0, unlocked = true, rules)

        assertEquals(1, upgraded.level)
        assertEquals(0, upgraded.crystals)
        assertEquals(250, upgraded.intervalMs(rules))
    }

    @Test
    fun `an upgrade keeps the crystals the price did not take`() {
        assertEquals(PlayerAutoClick("yan", 4, 7), player(level = 3, crystals = 107).upgrade(3, unlocked = true, rules))
    }

    @Test
    fun `an upgrade from another level is a mismatch carrying the stored state`() {
        val stored = player(level = 1, crystals = 100)

        val error = assertFailsWith<AutoClickLevelMismatchException> { stored.upgrade(0, unlocked = true, rules) }

        assertEquals("AUTO_CLICK_LEVEL_MISMATCH", error.code)
        assertSame(stored, error.current)
    }

    @Test
    fun `an upgrade at level 4 is refused as max level`() {
        val error = assertFailsWith<AutoClickMaxLevelException> { player(level = 4, crystals = 1000).upgrade(4, unlocked = true, rules) }

        assertEquals("AUTO_CLICK_MAX_LEVEL", error.code)
    }

    @Test
    fun `an upgrade while locked is refused`() {
        val error = assertFailsWith<AutoClickLockedException> { player(crystals = 1000).upgrade(0, unlocked = false, rules) }

        assertEquals("AUTO_CLICK_LOCKED", error.code)
    }

    @Test
    fun `an upgrade with fewer crystals than the price is refused`() {
        val error = assertFailsWith<NotEnoughCrystalsException> { player(level = 1, crystals = 24).upgrade(1, unlocked = true, rules) }

        assertEquals("NOT_ENOUGH_CRYSTALS", error.code)
    }

    @Test
    fun `a stale request is a mismatch before the max level, the lock and the crystals`() {
        assertFailsWith<AutoClickLevelMismatchException> { player(level = 4).upgrade(3, unlocked = false, rules) }
    }

    @Test
    fun `the max level is checked before the lock and the crystals`() {
        assertFailsWith<AutoClickMaxLevelException> { player(level = 4).upgrade(4, unlocked = false, rules) }
    }

    @Test
    fun `the lock is checked before the crystals`() {
        assertFailsWith<AutoClickLockedException> { player().upgrade(0, unlocked = false, rules) }
    }

    @Test
    fun `a negative fromLevel is an invalid request`() {
        val error = assertFailsWith<AutoClickRequestException> { player().upgrade(-1, unlocked = true, rules) }

        assertEquals("INVALID_AUTO_CLICK_REQUEST", error.code)
    }

    @Test
    fun `the auto click is locked in chapter 1 and open from chapter 2 or on a completed campaign`() {
        assertFalse(autoClickUnlocked(Progress("yan", ProgressPosition(1, 10, Encounter.CHAPTER_BOSS, 1))))
        assertTrue(autoClickUnlocked(Progress("yan", ProgressPosition(2, 1, Encounter.PHASE, 1))))
        assertTrue(autoClickUnlocked(Progress("yan", ProgressPosition(1, 10, Encounter.CHAPTER_BOSS, 1), completed = true)))
    }

    @Test
    fun `an applied upgrade logs the username, the levels and the crystals at info`() {
        LogCapture(PlayerAutoClick::class.java).use { logs ->
            player(level = 1, crystals = 30).upgrade(1, unlocked = true, rules)

            assertEquals(listOf("Auto click upgraded username=yan from=1 to=2 price=25 crystals=5"), logs.infos)
        }
    }

    @Test
    fun `every refused upgrade logs the username, the levels and the crystals at warn`() {
        LogCapture(PlayerAutoClick::class.java).use { logs ->
            runCatching { player(level = 1, crystals = 7).upgrade(0, unlocked = true, rules) }
            runCatching { player(level = 4, crystals = 8).upgrade(4, unlocked = true, rules) }
            runCatching { player(level = 0, crystals = 9).upgrade(0, unlocked = false, rules) }
            runCatching { player(level = 0, crystals = 3).upgrade(0, unlocked = true, rules) }

            assertEquals(
                listOf(
                    "Auto click upgrade refused, level mismatch username=yan sent=0 stored=1 crystals=7",
                    "Auto click upgrade refused, max level username=yan level=4 crystals=8",
                    "Auto click upgrade refused, locked username=yan level=0 crystals=9",
                    "Auto click upgrade refused, not enough crystals username=yan level=0 crystals=3 price=10",
                ),
                logs.warns,
            )
        }
    }
}
