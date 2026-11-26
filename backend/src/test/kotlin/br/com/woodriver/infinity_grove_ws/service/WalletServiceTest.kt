package br.com.woodriver.infinity_grove_ws.service

import br.com.woodriver.infinity_grove_ws.InMemoryDropRuleRepository
import br.com.woodriver.infinity_grove_ws.InMemoryLegacyRepository
import br.com.woodriver.infinity_grove_ws.InMemoryUserRepository
import br.com.woodriver.infinity_grove_ws.InMemoryWalletRepository
import br.com.woodriver.infinity_grove_ws.MutableClock
import br.com.woodriver.infinity_grove_ws.SequenceDropRoller
import br.com.woodriver.infinity_grove_ws.domain.ChapterDefinition
import br.com.woodriver.infinity_grove_ws.domain.DropRule
import br.com.woodriver.infinity_grove_ws.domain.DropTable
import br.com.woodriver.infinity_grove_ws.domain.ResetLegacy
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
    private val legacies = InMemoryLegacyRepository()
    private val service = WalletService(wallets, users, rules, roller, clock, legacies)

    /** Rolls the top of each range, so a queue shows which rule rolled it. */
    private val topRoller =
        object : DropRollerPort {
            override fun roll(
                min: Int,
                max: Int,
            ) = max
        }
    private val tuned = WalletService(wallets, users, rules, topRoller, clock, legacies)

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

    /** Rolls the bottom of each range. */
    private val bottomRoller =
        object : DropRollerPort {
            override fun roll(
                min: Int,
                max: Int,
            ) = min
        }

    private val seeded = (1..15).flatMap(ChapterDefinition::dropRules)

    /** A service over the seeded drop table of the 15 chapters, with its own wallets, rolling with [dropRoller]. */
    private fun seededService(dropRoller: DropRollerPort) =
        WalletService(InMemoryWalletRepository(), users, InMemoryDropRuleRepository(*seeded.toTypedArray()), dropRoller, clock, legacies)

    private fun legacyOf(vararg percents: Pair<Int, Int>) = legacies.save(ResetLegacy("yan", mapOf(*percents)))

    @Test
    fun `a player with 50 percent of chapter 15 gets queues of rule 1 inside 354 to 1062`() {
        existingUser()
        legacyOf(15 to 50)

        val bottom = seededService(bottomRoller).get("yan")
        val top = seededService(topRoller).get("yan")

        assertEquals(List(20) { 354 }, bottom.queues.getValue(1).queue)
        assertEquals(List(20) { 1062 }, top.queues.getValue(1).queue)
        assertEquals(List(20) { 1416 }, bottom.queues.getValue(2).queue)
        assertEquals(List(20) { 3540 }, top.queues.getValue(2).queue)
        assertEquals(List(20) { 5310 }, bottom.queues.getValue(3).queue)
        assertEquals(List(20) { 12390 }, top.queues.getValue(3).queue)
    }

    @Test
    fun `a player with no legacy keeps today's ranges`() {
        existingUser()

        assertEquals(
            List(20) { 2 },
            seededService(bottomRoller)
                .get("yan")
                .queues
                .getValue(1)
                .queue,
        )
        assertEquals(
            List(20) { 6 },
            seededService(topRoller)
                .get("yan")
                .queues
                .getValue(1)
                .queue,
        )
    }

    @Test
    fun `a legacy raised after the wallet was opened re-rolls the queues on the next get`() {
        existingUser()
        val seededTop = seededService(topRoller)
        assertEquals(
            List(20) { 6 },
            seededTop
                .get("yan")
                .queues
                .getValue(1)
                .queue,
        )

        legacyOf(5 to 100)

        assertEquals(
            List(20) { 102 },
            seededTop
                .get("yan")
                .queues
                .getValue(1)
                .queue,
        )
    }

    @Test
    fun `a sync of 3 kills of rule 1 with 100 percent of chapter 5 credits 3 values inside 34 to 102`() {
        existingUser()
        legacyOf(5 to 100)

        val bottom = seededService(bottomRoller).sync("yan", mapOf(1 to 3))
        val top = seededService(topRoller).sync("yan", mapOf(1 to 3))

        assertEquals(mapOf(1 to 3), bottom.accepted)
        assertEquals(3 * 34L, bottom.wallet.copper)
        assertEquals(3 * 102L, top.wallet.copper)
    }

    @Test
    fun `the allowance stays 20 and refills one per 1500 ms with a legacy`() {
        existingUser()
        legacyOf(15 to 50)
        val boosted = seededService(bottomRoller)

        assertEquals(mapOf(1 to 20), boosted.sync("yan", mapOf(1 to 500)).accepted)
        clock.millis += 3_000

        assertEquals(mapOf(1 to 2), boosted.sync("yan", mapOf(1 to 10)).accepted)
    }

    @Test
    fun `the drop table answers the plain ranges with a legacy`() {
        legacyOf(15 to 50)

        assertEquals(seeded, seededService(bottomRoller).dropTable().rules)
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
