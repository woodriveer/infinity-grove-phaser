package br.com.woodriver.infinity_grove_ws.domain

import br.com.woodriver.infinity_grove_ws.LogCapture
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse
import kotlin.test.assertNull
import kotlin.test.assertSame
import kotlin.test.assertTrue

class AccountResetTest {
    private fun at(
        chapter: Int,
        completed: Boolean = false,
    ) = Progress("yan", ProgressPosition(chapter, 1, Encounter.PHASE, 1), completed)

    private fun viewOf(progress: Progress) = progress.view(ChapterDefinition.of(progress.position.chapter))

    @Test
    fun `chapter 1 pays nothing and every later chapter pays its number`() {
        assertNull(AccountReset.reward(at(1)))
        assertEquals(2, AccountReset.reward(at(2)))
        assertEquals(3, AccountReset.reward(at(3)))
        assertEquals(5, AccountReset.reward(at(5)))
    }

    @Test
    fun `a completed campaign pays 5`() {
        assertEquals(5, AccountReset.reward(at(5, completed = true)))
    }

    @Test
    fun `a reset from the stored chapter returns its reward`() {
        val progress = at(4)

        assertEquals(4, AccountReset.check(progress, 4) { viewOf(progress) })
    }

    @Test
    fun `a reset from another chapter is a mismatch carrying the stored progress`() {
        val progress = at(1)
        val view = viewOf(progress)

        val error = assertFailsWith<ResetChapterMismatchException> { AccountReset.check(progress, 3) { view } }

        assertEquals("RESET_CHAPTER_MISMATCH", error.code)
        assertSame(view, error.current)
    }

    @Test
    fun `a reset from chapter 1 is locked`() {
        val progress = at(1)

        val error = assertFailsWith<ResetLockedException> { AccountReset.check(progress, 1) { viewOf(progress) } }

        assertEquals("RESET_LOCKED", error.code)
    }

    @Test
    fun `the invalid request code is INVALID_RESET_REQUEST`() {
        assertEquals("INVALID_RESET_REQUEST", ResetRequestException("fromChapter must be an integer").code)
    }

    @Test
    fun `a player who reset has the auto click in chapter 1 and one who never did has not`() {
        assertTrue(autoClickUnlocked(at(1), resets = 1))
        assertFalse(autoClickUnlocked(at(1), resets = 0))
    }

    @Test
    fun `every refused reset logs the username, the reason and the stored chapter at warn`() {
        LogCapture(AccountReset::class.java).use { logs ->
            runCatching { AccountReset.check(at(1), 3) { viewOf(at(1)) } }
            runCatching { AccountReset.check(at(1), 1) { viewOf(at(1)) } }

            assertEquals(
                listOf(
                    "Account reset refused, chapter mismatch username=yan sent=3 stored=1",
                    "Account reset refused, locked username=yan stored=1",
                ),
                logs.warns,
            )
        }
    }
}
