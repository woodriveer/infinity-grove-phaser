package br.com.woodriver.infinity_grove_ws.adapter.repository

import br.com.woodriver.infinity_grove_ws.IntegrationTestBase
import br.com.woodriver.infinity_grove_ws.domain.DropQueue
import br.com.woodriver.infinity_grove_ws.domain.Wallet
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.transaction.PlatformTransactionManager
import org.springframework.transaction.support.TransactionTemplate
import java.util.concurrent.CountDownLatch
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertNull

class WalletRepositoryIT : IntegrationTestBase() {
    @Autowired
    private lateinit var repository: WalletRepository

    @Autowired
    private lateinit var transactionManager: PlatformTransactionManager

    @Autowired
    private lateinit var jdbcTemplate: JdbcTemplate

    private fun wallet(
        username: String = "yan",
        copper: Long = 1_234_567,
    ) = Wallet(
        username,
        copper,
        mapOf(
            1 to DropQueue(1, List(20) { it % 5 + 1 }, allowance = 7, allowanceUpdatedAt = 123_456),
            2 to DropQueue(2, List(20) { 10 + it % 3 }, allowance = 20, allowanceUpdatedAt = 9),
        ),
    )

    @Test
    fun `tables are empty at the start of each test`() {
        assertEquals(0, jpaWalletRepository.count())
        assertEquals(0, jpaWalletDropQueueRepository.count())
    }

    @Test
    fun `createIfAbsent then findForUpdate returns the same wallet with queue order and allowance fields`() {
        repository.createIfAbsent(wallet())

        assertEquals(wallet(), repository.findForUpdate("yan"))
    }

    @Test
    fun `each queue is stored in wallet_drop_queues under its drop rule id`() {
        repository.createIfAbsent(wallet())

        val rows =
            jdbcTemplate.queryForList(
                "select id, drop_rule_id from wallet_drop_queues where username = 'yan' order by drop_rule_id",
            )

        assertEquals(
            listOf(mapOf("id" to "yan/1", "drop_rule_id" to 1), mapOf("id" to "yan/2", "drop_rule_id" to 2)),
            rows,
        )
        assertEquals(setOf(1, 2), repository.findForUpdate("yan")!!.queues.keys)
    }

    @Test
    fun `the copper total keeps the full 64-bit range`() {
        repository.createIfAbsent(wallet(copper = Long.MAX_VALUE))

        assertEquals(Long.MAX_VALUE, repository.findForUpdate("yan")!!.copper)
    }

    @Test
    fun `createIfAbsent twice keeps the first wallet`() {
        repository.createIfAbsent(wallet(copper = 10))

        repository.createIfAbsent(wallet(copper = 999))

        assertEquals(wallet(copper = 10), repository.findForUpdate("yan"))
    }

    @Test
    fun `findForUpdate returns null for an unknown player`() {
        assertNull(repository.findForUpdate("ghost"))
    }

    @Test
    fun `save replaces the copper total, queues and allowances`() {
        repository.createIfAbsent(wallet(copper = 10))
        val changed =
            Wallet("yan", 77, mapOf(1 to DropQueue(1, List(20) { 5 }, allowance = 3, allowanceUpdatedAt = 5_000)))

        assertEquals(changed, repository.save(changed))

        val stored = repository.findForUpdate("yan")!!
        assertEquals(77L, stored.copper)
        assertEquals(List(20) { 5 }, stored.queues.getValue(1).queue)
        assertEquals(3, stored.queues.getValue(1).allowance)
        assertEquals(5_000L, stored.queues.getValue(1).allowanceUpdatedAt)
    }

    @Test
    fun `deleteByUsername removes that wallet and its level rows and leaves other players`() {
        repository.createIfAbsent(wallet("yan"))
        repository.createIfAbsent(wallet("ana"))

        repository.deleteByUsername("yan")

        assertNull(repository.findForUpdate("yan"))
        assertNotNull(repository.findForUpdate("ana"))
        assertEquals(2, jpaWalletDropQueueRepository.count())
    }

    @Test
    fun `a second transaction waits for the lock and then sees the committed change`() {
        repository.createIfAbsent(wallet(copper = 0))
        val template = TransactionTemplate(transactionManager)
        val firstHoldsLock = CountDownLatch(1)
        val pool = Executors.newFixedThreadPool(2)

        val first =
            pool.submit {
                template.executeWithoutResult {
                    val locked = repository.findForUpdate("yan")!!
                    firstHoldsLock.countDown()
                    Thread.sleep(700)
                    repository.save(locked.copy(copper = 1))
                }
            }
        val second =
            pool.submit<Long> {
                firstHoldsLock.await(5, TimeUnit.SECONDS)
                template.execute { repository.findForUpdate("yan")!!.copper }
            }

        first.get(10, TimeUnit.SECONDS)
        assertEquals(1L, second.get(10, TimeUnit.SECONDS))
        pool.shutdown()
    }
}
