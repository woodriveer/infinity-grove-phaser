package br.com.woodriver.infinity_grove_ws.service

import br.com.woodriver.infinity_grove_ws.InMemoryDropRuleRepository
import br.com.woodriver.infinity_grove_ws.InMemoryTalentRepository
import br.com.woodriver.infinity_grove_ws.InMemoryUserRepository
import br.com.woodriver.infinity_grove_ws.InMemoryWalletRepository
import br.com.woodriver.infinity_grove_ws.MutableClock
import br.com.woodriver.infinity_grove_ws.SequenceDropRoller
import br.com.woodriver.infinity_grove_ws.domain.DropRule
import br.com.woodriver.infinity_grove_ws.domain.NotEnoughCopperException
import br.com.woodriver.infinity_grove_ws.domain.TalentLevelMismatchException
import br.com.woodriver.infinity_grove_ws.domain.TalentMaxLevelException
import br.com.woodriver.infinity_grove_ws.domain.TalentNotFoundException
import br.com.woodriver.infinity_grove_ws.domain.TalentRequestException
import br.com.woodriver.infinity_grove_ws.domain.TalentRules
import br.com.woodriver.infinity_grove_ws.domain.User
import br.com.woodriver.infinity_grove_ws.domain.UserNotFoundException
import br.com.woodriver.infinity_grove_ws.domain.Wallet
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class TalentServiceTest {
    private val users = InMemoryUserRepository()
    private val talents = InMemoryTalentRepository()
    private val wallets = InMemoryWalletRepository()
    private val walletAccess =
        WalletAccess(wallets, InMemoryDropRuleRepository(DropRule(1, 1, 5, 1500)), SequenceDropRoller(1), MutableClock(1_000L))
    private val service = TalentService(talents, users, walletAccess, TalentRules())

    private fun player(copper: Long) {
        users.save(User("yan", "hash", 1L, 1L))
        wallets.wallets["yan"] = Wallet("yan", copper, emptyMap())
    }

    @Test
    fun `list gives level 0 everywhere to a new player`() {
        player(0)

        val tree = service.list("yan")

        assertEquals(emptyMap(), tree.levels)
        assertEquals(0, tree.level("CLICK_DAMAGE"))
    }

    @Test
    fun `list for an unknown user fails`() {
        assertFailsWith<UserNotFoundException> { service.list("ghost") }
    }

    @Test
    fun `list gives only the levels of that player`() {
        player(0)
        users.save(User("other", "hash", 1L, 1L))
        talents.save("yan", "CLICK_DAMAGE", 2)
        talents.save("other", "CLICK_DAMAGE", 7)

        assertEquals(2, service.list("yan").level("CLICK_DAMAGE"))
    }

    @Test
    fun `an upgrade from level 0 with 300 copper raises the level, takes 300 and stores both`() {
        player(300)

        val change = service.upgrade("yan", "CLICK_DAMAGE", 0)

        assertEquals(1, change.talents.level("CLICK_DAMAGE"))
        assertEquals(0L, change.wallet.copper)
        assertEquals(1, talents.levels.getValue("yan" to "CLICK_DAMAGE"))
        assertEquals(0L, wallets.wallets.getValue("yan").copper)
    }

    @Test
    fun `the second upgrade takes 480 copper`() {
        player(1_000)
        service.upgrade("yan", "CLICK_DAMAGE", 0)

        val change = service.upgrade("yan", "CLICK_DAMAGE", 1)

        assertEquals(2, change.talents.level("CLICK_DAMAGE"))
        assertEquals(220L, change.wallet.copper)
    }

    @Test
    fun `a stale request is a level mismatch and takes nothing`() {
        player(1_000)
        service.upgrade("yan", "CLICK_DAMAGE", 0)

        assertFailsWith<TalentLevelMismatchException> { service.upgrade("yan", "CLICK_DAMAGE", 0) }

        assertEquals(1, talents.levels.getValue("yan" to "CLICK_DAMAGE"))
        assertEquals(700L, wallets.wallets.getValue("yan").copper)
    }

    @Test
    fun `299 copper is not enough for level 1 and nothing changes`() {
        player(299)

        assertFailsWith<NotEnoughCopperException> { service.upgrade("yan", "CLICK_DAMAGE", 0) }

        assertEquals(emptyMap(), talents.levels)
        assertEquals(299L, wallets.wallets.getValue("yan").copper)
    }

    @Test
    fun `a talent at level 10 is refused as max level and takes nothing`() {
        player(1_000_000)
        talents.save("yan", "CLICK_DAMAGE", 10)

        assertFailsWith<TalentMaxLevelException> { service.upgrade("yan", "CLICK_DAMAGE", 10) }

        assertEquals(1_000_000L, wallets.wallets.getValue("yan").copper)
    }

    @Test
    fun `an unknown talent is not found`() {
        player(1_000)

        assertFailsWith<TalentNotFoundException> { service.upgrade("yan", "NOPE", 0) }
    }

    @Test
    fun `a level the client could not have seen is a bad request`() {
        player(1_000)

        assertFailsWith<TalentRequestException> { service.upgrade("yan", "CLICK_DAMAGE", -1) }
        assertFailsWith<TalentRequestException> { service.upgrade("yan", "CLICK_DAMAGE", 11) }
        assertEquals(1_000L, wallets.wallets.getValue("yan").copper)
    }

    @Test
    fun `an upgrade for an unknown user fails`() {
        assertFailsWith<UserNotFoundException> { service.upgrade("ghost", "CLICK_DAMAGE", 0) }
    }

    @Test
    fun `an upgrade creates the wallet of a player that has none and then refuses for lack of copper`() {
        users.save(User("yan", "hash", 1L, 1L))

        assertFailsWith<NotEnoughCopperException> { service.upgrade("yan", "CLICK_DAMAGE", 0) }
    }

    @Test
    fun `the other talents of the player are untouched`() {
        player(1_000)
        talents.save("yan", "CRIT_CHANCE", 4)

        service.upgrade("yan", "CLICK_DAMAGE", 0)

        assertEquals(4, talents.levels.getValue("yan" to "CRIT_CHANCE"))
    }
}
