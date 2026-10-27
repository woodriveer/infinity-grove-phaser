package br.com.woodriver.infinity_grove_ws.service

import br.com.woodriver.infinity_grove_ws.InMemoryAutoClickRepository
import br.com.woodriver.infinity_grove_ws.InMemoryCrystalRepository
import br.com.woodriver.infinity_grove_ws.InMemoryProgressRepository
import br.com.woodriver.infinity_grove_ws.InMemoryUserRepository
import br.com.woodriver.infinity_grove_ws.adapter.config.AutoClickConfig
import br.com.woodriver.infinity_grove_ws.adapter.config.AutoClickProperties
import br.com.woodriver.infinity_grove_ws.domain.AutoClickLevelMismatchException
import br.com.woodriver.infinity_grove_ws.domain.AutoClickLockedException
import br.com.woodriver.infinity_grove_ws.domain.AutoClickRules
import br.com.woodriver.infinity_grove_ws.domain.Encounter
import br.com.woodriver.infinity_grove_ws.domain.NotEnoughCrystalsException
import br.com.woodriver.infinity_grove_ws.domain.PlayerAutoClick
import br.com.woodriver.infinity_grove_ws.domain.Progress
import br.com.woodriver.infinity_grove_ws.domain.ProgressPosition
import br.com.woodriver.infinity_grove_ws.domain.User
import br.com.woodriver.infinity_grove_ws.domain.UserNotFoundException
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertTrue

class AutoClickServiceTest {
    private val users = InMemoryUserRepository()
    private val autoClick = InMemoryAutoClickRepository()
    private val crystals = InMemoryCrystalRepository()
    private val progress = InMemoryProgressRepository()
    private val service = AutoClickService(autoClick, crystals, users, progress, AutoClickRules())

    private fun player(
        chapter: Int? = 2,
        crystalBalance: Long = 0,
        level: Int = 0,
    ) {
        users.save(User("yan", "hash", 1L, 1L))
        if (chapter != null) progress.save(Progress("yan", ProgressPosition(chapter, 1, Encounter.PHASE, 1)))
        if (crystalBalance > 0) crystals.save("yan", crystalBalance)
        if (level > 0) autoClick.save("yan", level)
    }

    @Test
    fun `get gives level 0 and 0 crystals to a new player`() {
        player()

        assertEquals(PlayerAutoClick("yan", 0, 0), service.get("yan"))
    }

    @Test
    fun `get gives the stored level and crystals`() {
        player(crystalBalance = 40, level = 2)

        assertEquals(PlayerAutoClick("yan", 2, 40), service.get("yan"))
    }

    @Test
    fun `get for an unknown user fails`() {
        assertFailsWith<UserNotFoundException> { service.get("ghost") }
    }

    @Test
    fun `an upgrade in chapter 2 stores the new level and the crystals left`() {
        player(crystalBalance = 30)

        val upgraded = service.upgrade("yan", 0)

        assertEquals(PlayerAutoClick("yan", 1, 20), upgraded)
        assertEquals(1, autoClick.level("yan"))
        assertEquals(20L, crystals.balance("yan"))
    }

    @Test
    fun `an upgrade for a player with no progress row creates it and is locked in chapter 1`() {
        player(chapter = null, crystalBalance = 100)

        assertFailsWith<AutoClickLockedException> { service.upgrade("yan", 0) }

        assertTrue(progress.progresses.containsKey("yan"))
        assertEquals(
            1,
            progress.progresses
                .getValue("yan")
                .position.chapter,
        )
    }

    @Test
    fun `an upgrade in chapter 1 is refused and stores nothing`() {
        player(chapter = 1, crystalBalance = 100)

        assertFailsWith<AutoClickLockedException> { service.upgrade("yan", 0) }

        assertEquals(0, autoClick.level("yan"))
        assertEquals(100L, crystals.balance("yan"))
    }

    @Test
    fun `an upgrade without enough crystals stores nothing`() {
        player(crystalBalance = 9)

        assertFailsWith<NotEnoughCrystalsException> { service.upgrade("yan", 0) }

        assertEquals(0, autoClick.level("yan"))
        assertEquals(9L, crystals.balance("yan"))
    }

    @Test
    fun `a repeated upgrade from the old level is a mismatch and charges once`() {
        player(crystalBalance = 100)
        service.upgrade("yan", 0)

        assertFailsWith<AutoClickLevelMismatchException> { service.upgrade("yan", 0) }

        assertEquals(1, autoClick.level("yan"))
        assertEquals(90L, crystals.balance("yan"))
    }

    @Test
    fun `an upgrade for an unknown user fails`() {
        assertFailsWith<UserNotFoundException> { service.upgrade("ghost", 0) }
    }

    @Test
    fun `the settings default to the intervals and prices of the spec`() {
        assertEquals(
            AutoClickRules(listOf(500, 250, 150, 100, 50), listOf(10, 25, 50, 100)),
            AutoClickConfig().autoClickRules(AutoClickProperties()),
        )
    }
}
