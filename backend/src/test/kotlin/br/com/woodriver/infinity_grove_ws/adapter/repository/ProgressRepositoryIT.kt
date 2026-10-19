package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import br.com.woodriver.infinity_grove_ws.domain.Encounter
import br.com.woodriver.infinity_grove_ws.domain.Progress
import br.com.woodriver.infinity_grove_ws.domain.ProgressPosition
import org.junit.jupiter.api.BeforeEach
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.transaction.PlatformTransactionManager
import org.springframework.transaction.support.TransactionTemplate
import java.util.concurrent.CountDownLatch
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertNull

class ProgressRepositoryIT : IntegrationTestBase() {
    @Autowired
    private lateinit var repository: ProgressRepository

    // every row here references a player through a foreign key
    @BeforeEach
    fun players() = users("yan", "ana", "player-0", "player-1", "player-2")

    @Autowired
    private lateinit var transactionManager: PlatformTransactionManager

    private fun progress(
        username: String = "yan",
        encounter: Encounter = Encounter.PHASE,
        stage: Int = 3,
        phase: Int = 2,
        completed: Boolean = false,
    ) = Progress(username, ProgressPosition(1, stage, encounter, phase), completed)

    @Test
    fun `createIfAbsent then findForUpdate returns the same progress for every encounter`() {
        Encounter.entries.forEachIndexed { index, encounter ->
            val username = "player-$index"
            val stored = progress(username, encounter, phase = if (encounter == Encounter.PHASE) 4 else 1)

            repository.createIfAbsent(stored)

            assertEquals(stored, repository.findForUpdate(username))
        }
    }

    @Test
    fun `the completed flag is stored`() {
        repository.createIfAbsent(progress(encounter = Encounter.CHAPTER_BOSS, stage = 10, phase = 1, completed = true))

        assertEquals(true, repository.findForUpdate("yan")!!.completed)
    }

    @Test
    fun `createIfAbsent twice keeps the first progress`() {
        repository.createIfAbsent(progress(stage = 3))

        repository.createIfAbsent(progress(stage = 9))

        assertEquals(3, repository.findForUpdate("yan")!!.position.stage)
    }

    @Test
    fun `concurrent createIfAbsent for one player leaves exactly one row and no error`() {
        val pool = Executors.newFixedThreadPool(4)
        val start = CountDownLatch(1)

        val results =
            (1..4).map {
                pool.submit {
                    start.await(5, TimeUnit.SECONDS)
                    repository.createIfAbsent(progress())
                }
            }
        start.countDown()
        results.forEach { it.get(10, TimeUnit.SECONDS) }
        pool.shutdown()

        assertEquals(1, jpaProgressRepository.count())
    }

    @Test
    fun `findForUpdate returns null for an unknown player`() {
        assertNull(repository.findForUpdate("ghost"))
    }

    @Test
    fun `save replaces the stored position`() {
        repository.createIfAbsent(progress())
        val changed = progress(encounter = Encounter.MINIBOSS, stage = 4, phase = 1)

        assertEquals(changed, repository.save(changed))

        assertEquals(changed, repository.findForUpdate("yan"))
    }

    @Test
    fun `deleteByUsername removes that player and leaves others`() {
        repository.createIfAbsent(progress("yan"))
        repository.createIfAbsent(progress("ana"))

        repository.deleteByUsername("yan")

        assertNull(repository.findForUpdate("yan"))
        assertNotNull(repository.findForUpdate("ana"))
    }

    @Test
    fun `a second transaction waits for the lock and then sees the committed change`() {
        repository.createIfAbsent(progress(stage = 1))
        val template = TransactionTemplate(transactionManager)
        val firstHoldsLock = CountDownLatch(1)
        val pool = Executors.newFixedThreadPool(2)

        val first =
            pool.submit {
                template.executeWithoutResult {
                    val locked = repository.findForUpdate("yan")!!
                    firstHoldsLock.countDown()
                    Thread.sleep(700)
                    repository.save(locked.copy(position = locked.position.copy(stage = 2)))
                }
            }
        val second =
            pool.submit<Int> {
                firstHoldsLock.await(5, TimeUnit.SECONDS)
                template.execute { repository.findForUpdate("yan")!!.position.stage }
            }

        first.get(10, TimeUnit.SECONDS)
        assertEquals(2, second.get(10, TimeUnit.SECONDS))
        pool.shutdown()
    }
}
