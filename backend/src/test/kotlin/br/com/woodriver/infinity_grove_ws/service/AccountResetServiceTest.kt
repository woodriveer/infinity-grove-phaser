package br.com.woodriver.infinity_grove_ws.service

import br.com.woodriver.infinity_grove_ws.InMemoryAutoClickRepository
import br.com.woodriver.infinity_grove_ws.InMemoryChapterRepository
import br.com.woodriver.infinity_grove_ws.InMemoryCrystalRepository
import br.com.woodriver.infinity_grove_ws.InMemoryProgressRepository
import br.com.woodriver.infinity_grove_ws.InMemoryResetRepository
import br.com.woodriver.infinity_grove_ws.InMemoryTalentRepository
import br.com.woodriver.infinity_grove_ws.InMemoryUserRepository
import br.com.woodriver.infinity_grove_ws.LogCapture
import br.com.woodriver.infinity_grove_ws.domain.ChapterDefinition
import br.com.woodriver.infinity_grove_ws.domain.Encounter
import br.com.woodriver.infinity_grove_ws.domain.Progress
import br.com.woodriver.infinity_grove_ws.domain.ProgressPosition
import br.com.woodriver.infinity_grove_ws.domain.ResetChapterMismatchException
import br.com.woodriver.infinity_grove_ws.domain.ResetLockedException
import br.com.woodriver.infinity_grove_ws.domain.User
import br.com.woodriver.infinity_grove_ws.domain.UserNotFoundException
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertTrue

class AccountResetServiceTest {
    private val users = InMemoryUserRepository()
    private val progress = InMemoryProgressRepository()
    private val chapters = InMemoryChapterRepository(*(1..5).map { ChapterDefinition.of(it) }.toTypedArray())
    private val talents = InMemoryTalentRepository()
    private val crystals = InMemoryCrystalRepository()
    private val resets = InMemoryResetRepository()
    private val autoClick = InMemoryAutoClickRepository()
    private val service = AccountResetService(progress, chapters, users, talents, crystals, resets)

    private val start = Progress("yan", ProgressPosition(1, 1, Encounter.PHASE, 1))

    private fun player(
        chapter: Int = 3,
        completed: Boolean = false,
        crystalBalance: Long = 0,
        resetCount: Int = 0,
    ) {
        users.save(User("yan", "hash", 1L, 1L))
        progress.save(Progress("yan", ProgressPosition(chapter, 2, Encounter.MINIBOSS, 1), completed))
        if (crystalBalance > 0) crystals.save("yan", crystalBalance)
        if (resetCount > 0) resets.save("yan", resetCount)
        talents.save("yan", "CLICK_DAMAGE", 2)
        talents.award("yan", "1:1:PHASE:1", 1)
        talents.award("yan", "legacy", 3)
        autoClick.save("yan", 1)
    }

    @Test
    fun `a reset from chapter 3 pays 3 crystals and puts the campaign back at its start`() {
        player(chapter = 3, crystalBalance = 4, resetCount = 1)

        val result = service.reset("yan", 3)

        assertEquals(3, result.reward)
        assertEquals(7L, result.crystals)
        assertEquals(2, result.resets)
        assertEquals(start, result.view.progress)
        assertEquals(1, result.view.chapter.number)
        assertEquals(start, progress.progresses.getValue("yan"))
        assertEquals(7L, crystals.balance("yan"))
        assertEquals(2, resets.count("yan"))
    }

    @Test
    fun `a reset deletes every talent level and every talent point award`() {
        player()

        service.reset("yan", 3)

        assertEquals(emptyMap(), talents.findAll("yan"))
        assertEquals(0, talents.earnedPoints("yan"))
    }

    @Test
    fun `a reset keeps the auto click level`() {
        player()

        service.reset("yan", 3)

        assertEquals(1, autoClick.level("yan"))
    }

    @Test
    fun `a first reset of a player with no crystals pays the reward and counts 1`() {
        player(chapter = 2)

        val result = service.reset("yan", 2)

        assertEquals(2L, result.crystals)
        assertEquals(1, result.resets)
    }

    @Test
    fun `a completed campaign pays 5`() {
        player(chapter = 5, completed = true)

        assertEquals(5, service.reset("yan", 5).reward)
    }

    @Test
    fun `a reset from chapter 1 is locked and changes nothing`() {
        player(chapter = 1, crystalBalance = 4)

        assertFailsWith<ResetLockedException> { service.reset("yan", 1) }

        assertUnchanged(chapter = 1, crystalBalance = 4)
    }

    @Test
    fun `a reset from another chapter is a mismatch carrying the stored progress and changes nothing`() {
        player(chapter = 3, crystalBalance = 4)

        val error = assertFailsWith<ResetChapterMismatchException> { service.reset("yan", 4) }

        assertEquals(3, error.current.progress.position.chapter)
        assertUnchanged(chapter = 3, crystalBalance = 4)
    }

    @Test
    fun `a repeated reset is a mismatch and pays once`() {
        player(chapter = 3)
        service.reset("yan", 3)

        assertFailsWith<ResetChapterMismatchException> { service.reset("yan", 3) }

        assertEquals(3L, crystals.balance("yan"))
        assertEquals(1, resets.count("yan"))
    }

    @Test
    fun `a reset for an unknown user fails`() {
        assertFailsWith<UserNotFoundException> { service.reset("ghost", 3) }
    }

    @Test
    fun `an applied reset logs the username, the chapter, the reward, the crystals and the resets at info`() {
        player(chapter = 4, crystalBalance = 1, resetCount = 2)

        LogCapture(AccountResetService::class.java).use { logs ->
            service.reset("yan", 4)

            assertTrue("Account reset username=yan chapter=4 reward=4 crystals=5 resets=3" in logs.infos)
        }
    }

    private fun assertUnchanged(
        chapter: Int,
        crystalBalance: Long,
    ) {
        assertEquals(chapter, progress.progresses.getValue("yan").position.chapter)
        assertEquals(crystalBalance, crystals.balance("yan"))
        assertEquals(0, resets.count("yan"))
        assertEquals(mapOf("CLICK_DAMAGE" to 2), talents.findAll("yan"))
        assertEquals(4, talents.earnedPoints("yan"))
    }
}
