package br.com.woodriver.infinity_grove_ws.service

import br.com.woodriver.infinity_grove_ws.InMemoryChapterRepository
import br.com.woodriver.infinity_grove_ws.InMemoryProgressRepository
import br.com.woodriver.infinity_grove_ws.InMemoryUserRepository
import br.com.woodriver.infinity_grove_ws.domain.ChapterDefinition
import br.com.woodriver.infinity_grove_ws.domain.ChapterNotFoundException
import br.com.woodriver.infinity_grove_ws.domain.Encounter
import br.com.woodriver.infinity_grove_ws.domain.Outcome
import br.com.woodriver.infinity_grove_ws.domain.Progress
import br.com.woodriver.infinity_grove_ws.domain.ProgressConflictException
import br.com.woodriver.infinity_grove_ws.domain.ProgressPosition
import br.com.woodriver.infinity_grove_ws.domain.User
import br.com.woodriver.infinity_grove_ws.domain.UserNotFoundException
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertTrue

class ProgressServiceTest {
    private val users = InMemoryUserRepository()
    private val progresses = InMemoryProgressRepository()
    private val chapter = ChapterDefinition.first()
    private val chapters = InMemoryChapterRepository(chapter)
    private val service = ProgressService(progresses, chapters, users)

    private val start = ProgressPosition(1, 1, Encounter.PHASE, 1)

    private fun existingUser(name: String = "yan") = users.save(User(name, "hash", 1L, 1L))

    @Test
    fun `get creates stage 1 phase 1 for a player without progress and returns the chapter definition`() {
        existingUser()

        val view = service.get("yan")

        assertEquals(start, view.progress.position)
        assertEquals(chapter, view.chapter)
        assertEquals(Progress.start("yan"), progresses.progresses["yan"])
    }

    @Test
    fun `get returns the stored progress when one exists`() {
        existingUser()
        val stored = Progress("yan", ProgressPosition(1, 4, Encounter.MINIBOSS, 1))
        progresses.save(stored)

        assertEquals(stored, service.get("yan").progress)
    }

    @Test
    fun `get for an unknown user fails and creates no progress`() {
        assertFailsWith<UserNotFoundException> { service.get("ghost") }

        assertTrue(progresses.progresses.isEmpty())
    }

    @Test
    fun `get fails when the stored chapter does not exist`() {
        existingUser()
        progresses.save(Progress("yan", ProgressPosition(2, 1, Encounter.PHASE, 1)))

        assertFailsWith<ChapterNotFoundException> { service.get("yan") }
    }

    @Test
    fun `report saves the next position and returns it`() {
        existingUser()

        val view = service.report("yan", start, Outcome.CLEARED)

        val expected = Progress("yan", ProgressPosition(1, 1, Encounter.PHASE, 2))
        assertEquals(expected, view.progress)
        assertEquals(expected, progresses.progresses["yan"])
    }

    @Test
    fun `report creates the progress first when the player has none`() {
        existingUser()

        service.report("yan", start, Outcome.CLEARED)

        val saved = progresses.progresses.getValue("yan")
        assertEquals(2, saved.position.phase)
    }

    @Test
    fun `a failed boss is saved as the last phase of the stage`() {
        existingUser()
        progresses.save(Progress("yan", ProgressPosition(1, 3, Encounter.MINIBOSS, 1)))

        val view = service.report("yan", ProgressPosition(1, 3, Encounter.MINIBOSS, 1), Outcome.FAILED)

        assertEquals(ProgressPosition(1, 3, Encounter.PHASE, 5), view.progress.position)
    }

    @Test
    fun `a conflicting report saves nothing and the exception carries the stored progress`() {
        existingUser()
        val stored = Progress("yan", ProgressPosition(1, 1, Encounter.PHASE, 3))
        progresses.save(stored)

        val e = assertFailsWith<ProgressConflictException> { service.report("yan", start, Outcome.CLEARED) }

        assertEquals(stored, e.current.progress)
        assertEquals(chapter, e.current.chapter)
        assertEquals(stored, progresses.progresses["yan"])
    }

    @Test
    fun `report for an unknown user fails and creates no progress`() {
        assertFailsWith<UserNotFoundException> { service.report("ghost", start, Outcome.CLEARED) }

        assertTrue(progresses.progresses.isEmpty())
    }

    @Test
    fun `players do not share progress`() {
        existingUser("yan")
        existingUser("ana")

        service.report("yan", start, Outcome.CLEARED)

        val ana = service.get("ana").progress
        assertEquals(1, ana.position.phase)
    }
}
