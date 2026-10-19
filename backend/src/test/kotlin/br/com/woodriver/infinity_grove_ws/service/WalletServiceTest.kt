package br.com.woodriver.infinity_grove_ws.service

import br.com.woodriver.infinity_grove_ws.InMemoryDropRuleRepository
import br.com.woodriver.infinity_grove_ws.InMemoryUserRepository
import br.com.woodriver.infinity_grove_ws.InMemoryWalletRepository
import br.com.woodriver.infinity_grove_ws.MutableClock
import br.com.woodriver.infinity_grove_ws.SequenceDropRoller
import br.com.woodriver.infinity_grove_ws.domain.DropRule
import br.com.woodriver.infinity_grove_ws.domain.DropTable
import br.com.woodriver.infinity_grove_ws.domain.UnknownDropRuleException
import br.com.woodriver.infinity_grove_ws.domain.User
import br.com.woodriver.infinity_grove_ws.domain.UserNotFoundException
import br.com.woodriver.infinity_grove_ws.domain.Wallet
import br.com.woodriver.infinity_grove_ws.port.DropRollerPort
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertTrue

class WalletServiceTest {
    private val users = InMemoryUserRepository()
    private val wallets = InMemoryWalletRepository()
    private val clock = MutableClock(1_000_000L)
    private val table = DropTable(listOf(DropRule(1, 1, 5, 1500)))
    private val rules = InMemoryDropRuleRepository(DropRule(1, 1, 5, 1500))
    private val roller = SequenceDropRoller(1, 2, 3, 4, 5)
    private val service = WalletService(wallets, users, rules, roller, clock)

    /** Rolls the top of each range, so a queue shows which rule rolled it. */
    private val topRoller =
        object : DropRollerPort {
            override fun roll(
                min: Int,
                max: Int,
            ) = max
        }
    private val tuned = WalletService(wallets, users, rules, topRoller, clock)

    private fun existingUser(name: String = "yan") = users.save(User(name, "hash", 1L, 1L))

    @Test
    fun `get creates a zero wallet with 20 drops for an existing user`() {
        existingUser()

        val wallet = service.get("yan")

        assertEquals(0L, wallet.copper)
        assertEquals(List(20) { it % 5 + 1 }, wallet.dropsFor(table).getValue(1))
        assertEquals(wallet, wallets.wallets["yan"])
    }

    @Test
    fun `get twice returns the same drops in the same order`() {
        existingUser()

        val first = service.get("yan")
        val second = service.get("yan")

        assertEquals(first.dropsFor(table), second.dropsFor(table))
    }

    @Test
    fun `get returns the stored wallet when one exists`() {
        existingUser()
        val stored = service.get("yan").copy(copper = 12_345)
        wallets.save(stored)

        assertEquals(12_345L, service.get("yan").copper)
    }

    @Test
    fun `get re-rolls a stored queue that is outside the configured range`() {
        existingUser()
        val stored = service.get("yan")
        val stale = stored.copy(queues = mapOf(1 to stored.queues.getValue(1).copy(queue = List(20) { 9 })))
        wallets.save(stale)

        val wallet = service.get("yan")

        assertTrue(wallet.dropsFor(table).getValue(1).all { it in 1..5 })
        assertEquals(wallet, wallets.wallets["yan"])
    }

    @Test
    fun `get re-rolls a queue whose drop rule range was changed in the database`() {
        existingUser()
        tuned.get("yan")
        rules.save(DropRule(1, 10, 12, 1500))

        val wallet = tuned.get("yan")

        assertEquals(List(20) { 12 }, wallet.queues.getValue(1).queue)
        assertEquals(wallet, wallets.wallets["yan"])
    }

    @Test
    fun `get opens a full queue for a drop rule added in the database`() {
        existingUser()
        tuned.get("yan")
        rules.save(DropRule(2, 5, 15, 1500))

        val wallet = tuned.get("yan")

        assertEquals(List(20) { 15 }, wallet.queues.getValue(2).queue)
        assertEquals(20, wallet.queues.getValue(2).allowance)
        assertEquals(List(20) { 5 }, wallet.queues.getValue(1).queue)
        assertEquals(wallet, wallets.wallets["yan"])
    }

    @Test
    fun `sync credits kills of a drop rule added in the database within its range`() {
        existingUser()
        tuned.get("yan")
        rules.save(DropRule(2, 5, 15, 1500))

        val result = tuned.sync("yan", mapOf(2 to 3))

        assertEquals(mapOf(2 to 3), result.accepted)
        assertEquals(45L, result.wallet.copper)
    }

    @Test
    fun `dropTable returns the rules as they are stored now`() {
        rules.save(DropRule(2, 5, 15, 1500))

        assertEquals(listOf(DropRule(1, 1, 5, 1500), DropRule(2, 5, 15, 1500)), service.dropTable().rules)
    }

    @Test
    fun `get fails and creates no wallet when the user does not exist`() {
        assertFailsWith<UserNotFoundException> { service.get("ghost") }

        assertTrue(wallets.wallets.isEmpty())
    }

    @Test
    fun `sync credits the first queued values and stores the new wallet`() {
        existingUser()
        val before = service.get("yan")

        val result = service.sync("yan", mapOf(1 to 3))

        assertEquals(mapOf(1 to 3), result.accepted)
        assertEquals(
            before
                .dropsFor(table)
                .getValue(1)
                .take(3)
                .sum()
                .toLong(),
            result.wallet.copper,
        )
        assertEquals(result.wallet, wallets.wallets["yan"])
    }

    @Test
    fun `sync accepts at most the allowance and discards the excess`() {
        existingUser()

        val result = service.sync("yan", mapOf(1 to 500))

        assertEquals(mapOf(1 to 20), result.accepted)
    }

    @Test
    fun `sync accepts more kills as time passes`() {
        existingUser()
        service.sync("yan", mapOf(1 to 20))
        clock.millis += 3_000

        val result = service.sync("yan", mapOf(1 to 10))

        assertEquals(mapOf(1 to 2), result.accepted)
    }

    @Test
    fun `sync creates the wallet for an existing user that has none`() {
        existingUser()

        service.sync("yan", mapOf(1 to 1))

        assertEquals(1L, wallets.wallets["yan"]!!.copper)
    }

    @Test
    fun `sync with an unknown drop rule stores nothing`() {
        existingUser()
        val before: Wallet = service.get("yan")

        assertFailsWith<UnknownDropRuleException> { service.sync("yan", mapOf(1 to 3, 9 to 1)) }

        assertEquals(before, wallets.wallets["yan"])
    }

    @Test
    fun `sync fails and creates no wallet when the user does not exist`() {
        assertFailsWith<UserNotFoundException> { service.sync("ghost", mapOf(1 to 1)) }

        assertTrue(wallets.wallets.isEmpty())
    }
}
